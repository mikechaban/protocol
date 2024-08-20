import { L1_NETWORK, L2_NETWORK, L3_NETWORK } from '../../../../constants'
import styles from './BridgeView.module.css'
import { Icon } from 'summon-ui'
import { Combobox, Group, InputBase, InputBaseProps, useCombobox } from 'summon-ui/mantine'
import IconArbitrumOne from '@/assets/IconArbitrumOne'
import IconCheck from '@/assets/IconCheck'
import IconEthereum from '@/assets/IconEthereum'
import IconG7T from '@/assets/IconG7T'
import { HighNetworkInterface, NetworkInterface } from '@/contexts/BlockchainContext'

type NetworkSelectorProps = {
  networks: NetworkInterface[]
  selectedNetwork: NetworkInterface
  onChange: (network: NetworkInterface | HighNetworkInterface) => void
} & InputBaseProps

const NetworkSelector = ({ networks, onChange, selectedNetwork }: NetworkSelectorProps) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption()
  })

  const icon = (chainId: number) => {
    switch (chainId) {
      case L1_NETWORK.chainId:
        return <IconEthereum />
      case L2_NETWORK.chainId:
        return <IconArbitrumOne />
      case L3_NETWORK.chainId:
        return <IconG7T />
      default:
        return <></>
    }
  }

  return (
    <Combobox
      store={combobox}
      variant='unstyled'
      onOptionSubmit={(val: string) => {
        const newSelection = networks.find((n) => String(n.chainId) === val)
        if (newSelection) {
          onChange(newSelection)
        }
        combobox.closeDropdown()
      }}
      classNames={{ options: styles.options, option: styles.option, dropdown: styles.dropdown }}
    >
      <Combobox.Target>
        <InputBase
          component='button'
          className={styles.networkSelectSelect}
          pointer
          variant='unstyled'
          leftSection={
            selectedNetwork.chainId === L3_NETWORK.chainId ? (
              <IconG7T />
            ) : selectedNetwork.chainId === L1_NETWORK.chainId ? (
              <IconEthereum />
            ) : (
              <IconArbitrumOne />
            )
          }
          rightSection={networks.length > 1 ? <Icon name={'ChevronDown'} color={'#667085'} /> : ''}
          rightSectionPointerEvents='none'
          onClick={() => combobox.toggleDropdown()}
        >
          <span className={styles.networkSelectNetworkName}>{selectedNetwork.displayName}</span>
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown className='!bg-dark-900 !rounded-md !border-dark-700'>
        <Combobox.Options>
          {networks
            .sort((a, b) => {
              if (a.chainId === selectedNetwork.chainId) return 1
              if (b.chainId === selectedNetwork.chainId) return -1
              return 0
            })
            .map((n) => (
              <Combobox.Option value={String(n.chainId)} key={n.chainId}>
                <Group>
                  <div
                    className={
                      n.chainId === selectedNetwork.chainId ? styles.optionContainerSelected : styles.optionContainer
                    }
                  >
                    <div className={styles.optionLeftSection}>
                      {icon(n.chainId)}
                      {n.displayName}
                    </div>
                    {n.chainId === selectedNetwork.chainId && <IconCheck />}
                  </div>
                </Group>
              </Combobox.Option>
            ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}
export default NetworkSelector
