import React from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { L2_CHAIN, L3_NATIVE_TOKEN_SYMBOL } from '../../../constants'
import styles from './WithdrawTransactions.module.css'
import { ethers } from 'ethers'
import { Skeleton } from 'summon-ui/mantine'
import IconArrowNarrowUp from '@/assets/IconArrowNarrowUp'
import IconLinkExternal02 from '@/assets/IconLinkExternal02'
import IconLoading01 from '@/assets/IconLoading01'
import { useBlockchainContext } from '@/components/bridge/BlockchainContext'
import { L3_NETWORKS } from '@/components/bridge/l3Networks'
import useL2ToL1MessageStatus from '@/hooks/useL2ToL1MessageStatus'
import { L2ToL1MessageStatus, L2ToL1MessageWriter, L2TransactionReceipt } from '@arbitrum/sdk'

const timeAgo = (timestamp: number) => {
  const now = new Date().getTime()
  const date = new Date(Number(timestamp) * 1000).getTime()
  const timeDifference = Math.floor((now - date) / 1000)

  const units = [
    { name: 'year', inSeconds: 60 * 60 * 24 * 365 },
    { name: 'month', inSeconds: 60 * 60 * 24 * 30 },
    { name: 'day', inSeconds: 60 * 60 * 24 },
    { name: 'hour', inSeconds: 60 * 60 },
    { name: 'minute', inSeconds: 60 },
    { name: 'second', inSeconds: 1 }
  ]

  for (const unit of units) {
    const value = Math.floor(timeDifference / unit.inSeconds)
    if (value >= 1) {
      return `${value} ${unit.name}${value > 1 ? 's' : ''} ago`
    }
  }
  return 'just now'
}

const ETA = (timestamp: number, delayInSeconds: number) => {
  const now = new Date().getTime()
  const date = new Date(Number(timestamp) * 1000 + delayInSeconds * 1000).getTime()
  const timeDifference = Math.floor((date - now) / 1000)
  if (timeDifference < 0) {
    return '~now'
  }
  const units = [
    { name: 'year', inSeconds: 60 * 60 * 24 * 365 },
    { name: 'month', inSeconds: 60 * 60 * 24 * 30 },
    { name: 'day', inSeconds: 60 * 60 * 24 },
    { name: 'hour', inSeconds: 60 * 60 },
    { name: 'minute', inSeconds: 60 },
    { name: 'second', inSeconds: 1 }
  ]

  for (const unit of units) {
    const value = Math.floor(timeDifference / unit.inSeconds)
    if (value >= 1) {
      return `~${value} ${unit.name}${value > 1 ? 's' : ''}`
    }
  }
  return 'just now'
}

const networkName = (chainId: number) => {
  const network = L3_NETWORKS.find((n) => n.chainInfo.chainId === chainId)
  return network?.chainInfo.chainName
}

const networkRPC = (chainId: number) => {
  const network = L3_NETWORKS.find((n) => n.chainInfo.chainId === chainId)
  return network?.chainInfo.rpcs[0]
}

const networkExplorer = (chainId: number): string | undefined => {
  const network = L3_NETWORKS.find((n) => n.chainInfo.chainId === chainId)
  if (network?.chainInfo.blockExplorerURLs) {
    return network?.chainInfo.blockExplorerURLs[0] ?? undefined
  }
  return
}

interface WithdrawalProps {
  txHash: string
  chainId: number
  delay: number
}
const Withdrawal: React.FC<WithdrawalProps> = ({ txHash, chainId, delay }) => {
  const l3RPC = networkRPC(chainId)
  const l3BlockExplorer = networkExplorer(chainId)
  const l3ExplorerLink = `${l3BlockExplorer}/tx/${txHash}`
  const handleStatusClick = () => {
    if (!l3ExplorerLink) {
      return
    }
    window.open(l3ExplorerLink, '_blank')
  }

  if (!l3RPC) {
    console.log('L3 RPC undefined')
    return <></>
  }
  const status = useL2ToL1MessageStatus(txHash, L2_CHAIN.rpcs[0], l3RPC)
  const { switchChain } = useBlockchainContext()
  const queryClient = useQueryClient()

  const execute = useMutation(
    async (l2Receipt: L2TransactionReceipt | undefined) => {
      if (!l2Receipt) {
        throw new Error('receipt undefined')
      }
      const l3Provider = new ethers.providers.JsonRpcProvider(l3RPC)
      let provider
      if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum)
        const currentChain = await provider.getNetwork()
        if (currentChain.chainId !== L2_CHAIN.chainId) {
          await switchChain(L2_CHAIN)
          provider = new ethers.providers.Web3Provider(window.ethereum) //refresh provider
        }
      } else {
        throw new Error('Wallet is not installed!')
      }
      const signer = provider.getSigner()
      const messages: L2ToL1MessageWriter[] = (await l2Receipt.getL2ToL1Messages(signer)) as L2ToL1MessageWriter[]
      const message = messages[0]
      const res = await message.execute(l3Provider)
      const rec = await res.wait()
      console.log('Done! Your transaction is executed', rec)
      return rec
    },
    {
      onSuccess: (data) => {
        console.log(data)
        queryClient.refetchQueries(['ERC20Balance'])
        queryClient.refetchQueries(['nativeBalance'])
        queryClient.setQueryData(['withdrawalStatus', txHash, L2_CHAIN.rpcs[0], l3RPC], (oldData: any) => {
          return { ...oldData, status: L2ToL1MessageStatus.EXECUTED }
        })
        status.refetch()
      },
      onError: (error: Error) => {
        console.log(error)
      }
    }
  )
  if (!status.isLoading && !status.data) {
    return <></>
  }

  return (
    <>
      {status.isLoading ? (
        Array.from(Array(7)).map((_, idx) => (
          <div className={styles.gridItem} key={idx}>
            <Skeleton key={idx} h='12px' w='100%' />
          </div>
        ))
      ) : (
        <>
          <div className={styles.gridItem}>
            <div className={styles.typeWithdrawal}>
              <IconArrowNarrowUp stroke={'#026AA2'} />
              Withdraw
            </div>
          </div>
          <div className={styles.gridItem}>{timeAgo(status.data?.timestamp)}</div>
          <div className={styles.gridItem}>{`${status.data?.value} ${L3_NATIVE_TOKEN_SYMBOL}`}</div>
          <div className={styles.gridItem}>{networkName(chainId) ?? ''}</div>
          <div className={styles.gridItem}>{L2_CHAIN.displayName}</div>
          {status.data?.status === L2ToL1MessageStatus.EXECUTED && (
            <>
              <div className={styles.gridItem}>
                <div className={styles.settled} onClick={handleStatusClick}>
                  Settled
                  {!!l3ExplorerLink && <IconLinkExternal02 stroke={'#027A48'} />}
                </div>
              </div>
              <div className={styles.gridItem}>
                <div>{`${status.data.confirmations} confirmations`}</div>
              </div>
            </>
          )}
          {status.data?.status === L2ToL1MessageStatus.CONFIRMED && (
            <>
              <div className={styles.gridItem}>
                <div className={styles.claimable} onClick={handleStatusClick}>
                  Claimable
                  {!!l3ExplorerLink && <IconLinkExternal02 stroke={'#B54708'} />}
                </div>
              </div>
              <div className={styles.gridItem}>
                <button className={styles.claimButton} onClick={() => execute.mutate(status.data?.l2Receipt)}>
                  {execute.isLoading ? <IconLoading01 color={'white'} className={styles.rotatable} /> : 'Claim now'}
                </button>
              </div>
            </>
          )}
          {status.data?.status === L2ToL1MessageStatus.UNCONFIRMED && (
            <>
              <div className={styles.gridItem}>
                <div className={styles.pending} onClick={handleStatusClick}>
                  Pending
                  {!!l3ExplorerLink && <IconLinkExternal02 stroke={'#175CD3'} />}
                </div>
              </div>
              <div className={styles.gridItem}>
                <div>{ETA(status.data?.timestamp, delay)}</div>
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}

export default Withdrawal
