import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { WagmiProvider } from 'wagmi'
import { mainnet, sepolia, base } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http } from 'viem'
import { createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

const config = createConfig({
  chains: [mainnet, sepolia, base],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
  },
  connectors: [injected()],
})

const queryClient = new QueryClient()

/**
 * Wrapping the app with WAGMI and Rainbowkit Provider
 */

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default MyApp
