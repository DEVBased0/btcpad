import { useMemo } from 'react'
import { clusterApiUrl } from '@solana/web3.js'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import * as solWallets from '@solana/wallet-adapter-wallets'

const projectId = process.env.WALLETCONNECT_PROJECT_ID

export function SolProvider({ children }) {
  const network = WalletAdapterNetwork.Mainnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets = useMemo(() => [new solWallets.PhantomWalletAdapter(), new solWallets.TrustWalletAdapter(), new solWallets.SolflareWalletAdapter(), new solWallets.LedgerWalletAdapter(), new solWallets.TorusWalletAdapter(), new solWallets.WalletConnectWalletAdapter({ network, projectId }), new solWallets.CoinbaseWalletAdapter(), new solWallets.SafePalWalletAdapter(), new solWallets.MathWalletAdapter(), new solWallets.SolongWalletAdapter()], [network])
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
