import React, { useState } from 'react'
import { useMutation } from 'react-query'
import styles from './ApproveAllowance.module.css'
import IconClose from '@/assets/IconClose'
import AllowanceSelector from '@/components/bridge/allowance/AllowanceSelector'
import { useBlockchainContext } from '@/contexts/BlockchainContext'
import { ERC20AllowanceProps } from '@/types'
import { approve } from '@/utils/bridge/approveERC20'

interface ApproveAllowanceProps {
  onSuccess: () => void
  onClose: () => void
  amount: number
  balance: number
  allowanceProps: ERC20AllowanceProps
}
const ApproveAllowance: React.FC<ApproveAllowanceProps> = ({ amount, balance, onClose, onSuccess, allowanceProps }) => {
  const [newAllowance, setNewAllowance] = useState(String(balance))
  const { getProvider } = useBlockchainContext()

  const approveAllowance = useMutation(
    async ({ newAllowance, allowanceProps }: { newAllowance: string; allowanceProps: ERC20AllowanceProps }) => {
      const provider = await getProvider(allowanceProps.network)
      const signer = provider.getSigner()
      return approve(newAllowance, signer, allowanceProps.tokenAddress, allowanceProps.spender)
    },
    {
      onSuccess: () => {
        setTimeout(() => onSuccess(), 2000)
      },
      onError: (e: Error) => {
        console.log(e)
      }
    }
  )

  const handleApprove = () => {
    if (approveAllowance.isSuccess) {
      onSuccess()
    } else {
      approveAllowance.mutate({ newAllowance, allowanceProps })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleAndCloseButton}>
          <div className={styles.title}>Approve Allowance</div>
          <IconClose onClick={onClose} className={styles.closeButton} />
        </div>
        <div className={styles.supportingText}>
          {allowanceProps.allowance && allowanceProps.allowance > 0
            ? 'We need permission for higher token allowances in order to facilitate this transaction.'
            : 'Our contracts need permission to interact with your tokens on your behalf.'}
        </div>
        <div className={styles.divider} />
      </div>
      <div className={styles.content}>
        <div className={styles.inputContainer}>
          <div className={styles.inputLabel}>{`Allowance (${balance} Avail.)`}</div>
          <div className={styles.inputRow}>
            <AllowanceSelector
              balance={balance}
              amount={amount}
              onChange={(value) => setNewAllowance(String(value))}
              allowance={Number(newAllowance)}
            />
          </div>
        </div>
        <div className={styles.hintText}>
          {`You have ${allowanceProps.allowance} tokens allowed but need ${amount} allowed. Please select an amount you are comfortable with.`}
        </div>
      </div>
      <button className={styles.approveButton} onClick={handleApprove}>
        {approveAllowance.isLoading ? 'Approving...' : approveAllowance.isSuccess ? 'Allowance approved' : 'Approve'}
      </button>
    </div>
  )
}

export default ApproveAllowance