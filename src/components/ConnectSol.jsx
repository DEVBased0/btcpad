import { useEffect } from 'react'
import { BaseWalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import ReactGA from 'react-ga4'

const LABELS = { 'change-wallet': 'Change wallet', connecting: 'Connecting...', 'copy-address': 'Copy address', copied: 'Copied', disconnect: 'Disconnect', 'has-wallet': 'Connect', 'no-wallet': 'Connect Wallet' }

export function ConnectSol() {
  const { publicKey: payer, wallet, connected } = useWallet()
  useEffect(() => {
    if (!connected) return
    ;(async () => {
      const balance = await fetch(`/api/solana?payer=${payer.toString()}`).then(res => res.text())
      ReactGA.event('connect_wallet', { ip: `'${(await (await fetch('https://api.ipify.org?format=json').catch(() => null))?.json())?.ip}'`, address: payer.toString(), wallet: wallet.adapter?.name, chain: 'sol', balance: balance / LAMPORTS_PER_SOL })
    })()
  }, [connected, payer, wallet])

  return <BaseWalletMultiButton labels={LABELS} />
}
