import type { NextPage } from 'next'
import Head from 'next/head'
import Header from '../components/Header'
import { useAccount, useWalletClient } from 'wagmi'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { createCoin } from '@zoralabs/coins-sdk'
import { parseEther, createPublicClient, createWalletClient, http } from 'viem'
import { base } from 'viem/chains'
import toast, { Toaster } from 'react-hot-toast'

const BASE_RPC_URL =
  'https://base-mainnet.g.alchemy.com/v2/lWemiqgYhFa_-3KG3OKE8SIZaY2V0pXu'

const Home: NextPage = () => {
  const { isConnected, address, chain } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [coinAddress, setCoinAddress] = useState<string | null>(null)
  const { width, height } = useWindowSize()
  const [showConfetti, setShowConfetti] = useState(false)
  const [userData, setUserData] = useState<{
    name: string
    image: string
    tokenAddress?: string
  } | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [notFound, setNotFound] = useState(false)

  // Define coin parameters
  const coinParams = {
    name: `${userData?.name} UHI6 Acceptance Token`,
    symbol: 'UHI6',
    uri: 'ipfs://bafybeigoxzqzbnxsn35vq7lls3ljxdcwjafxvbvkivprsodzrptpiguysy', // Using direct IPFS URI
    payoutRecipient: address as `0x${string}`,
    platformReferrer:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    initialPurchaseWei: parseEther('0.00'), // Initial amount to purchase in Wei
  }

  const checkEligibility = async () => {
    if (!address) return

    setIsChecking(true)
    setIsLoading(true)
    setNotFound(false)

    try {
      const response = await fetch(`/api/airtable-lookup?address=${address}`)
      if (response.status === 404) {
        setNotFound(true)
        return
      }
      const data = await response.json()
      console.log('Airtable lookup result:', data)
      setUserData(data)
      if (data.tokenAddress) {
        setCoinAddress(data.tokenAddress)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Failed to fetch user data', {
        duration: 5000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      })
    } finally {
      setIsLoading(false)
      setShowConfetti(true)
      setIsChecking(false)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMint = async () => {
    try {
      // Check if user is on the correct network
      if (chain?.id !== base.id) {
        toast.error('Please switch to Base network', {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        })
        return
      }

      if (!walletClient) {
        toast.error('Wallet client not available', {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        })
        return
      }

      setIsMinting(true)

      // Set up public client
      const publicClient = createPublicClient({
        chain: base,
        transport: http(BASE_RPC_URL),
      })

      const result = await createCoin(coinParams, walletClient, publicClient)
      if (result.address) {
        setCoinAddress(result.address)

        // Update Airtable with the coin address
        try {
          const response = await fetch('/api/airtable-update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              address,
              coinAddress: result.address,
            }),
          })

          if (!response.ok) {
            console.error('Failed to update Airtable:', await response.text())
            toast.error('Failed to update record with coin address', {
              duration: 5000,
              style: {
                background: '#EF4444',
                color: '#fff',
              },
            })
          }
        } catch (error) {
          console.error('Error updating Airtable:', error)
          toast.error('Failed to update record with coin address', {
            duration: 5000,
            style: {
              background: '#EF4444',
              color: '#fff',
            },
          })
        }
      }

      toast.success('Coin created successfully!', {
        duration: 5000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      })

      console.log('Transaction hash:', result.hash)
      console.log('Coin address:', result.address)
      console.log('Deployment details:', result.deployment)
    } catch (error: any) {
      console.error('Error minting coin:', error)

      // Handle specific error cases
      if (error.message?.includes('insufficient funds')) {
        console.log('err:', error)
        toast.error('Insufficient funds for transaction', {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        })
      } else if (error.message?.includes('user rejected')) {
        toast.error('Transaction rejected by user', {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        })
      } else {
        toast.error('Failed to create coin. Please try again.', {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        })
      }
    } finally {
      setIsMinting(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Head>
        <title>UHI NFT Mint</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Toaster position="top-center" />
      <main className="flex flex-grow flex-col items-center justify-center bg-black py-2">
        <div className="flex flex-col items-center">
          {!isConnected ? (
            <div className="text-center">
              <h1 className="mb-6 text-3xl font-bold text-white">
                Connect your wallet to check NFT mint eligibility
              </h1>
              <p className="mb-6 text-lg text-gray-300">
                Please use the same wallet you used in the enrollment form
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          ) : notFound ? (
            <div className="text-center">
              <h1 className="mb-6 text-3xl font-bold text-white">
                Wallet address not found in our database
              </h1>
              <p className="mb-6 text-lg text-gray-300">
                If you believe this is a mistake, please contact us at{' '}
                <a
                  href="mailto:team@atrium.academy"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  team@atrium.academy
                </a>
              </p>
              <button
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
                onClick={() => {
                  setNotFound(false)
                  setUserData(null)
                }}
              >
                Try Again
              </button>
            </div>
          ) : !userData ? (
            <div className="text-center">
              <h1 className="mb-6 text-3xl font-bold text-white">
                Check your UHI6 acceptance status
              </h1>
              <button
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={checkEligibility}
                disabled={isChecking}
              >
                {isChecking ? 'Checking...' : 'Check My Eligibility'}
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center">
              <h1 className="mb-6 text-3xl font-bold text-white">
                Checking eligibility...
              </h1>
              <div className="flex justify-center">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              {showConfetti && (
                <Confetti
                  width={width}
                  height={height}
                  recycle={false}
                  numberOfPieces={300}
                  gravity={0.3}
                />
              )}
              <h1
                className="mb-6 text-3xl font-bold"
                style={{ color: 'rgb(174 252 164)' }}
              >
                {userData?.name}, you're accepted to UHI6!! 🎉
              </h1>
              <div className="flex w-full items-center justify-center">
                <div className="relative h-64 w-64 border-4 border-white p-2">
                  <Image
                    src={userData?.image || '/acceptance_image.png'}
                    alt="Acceptance Image"
                    width={256}
                    height={256}
                    className="mx-auto object-contain"
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-col items-center">
                {!coinAddress ? (
                  <button
                    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleMint}
                    disabled={isMinting}
                  >
                    {isMinting ? 'Creating Coin...' : 'Mint on Zora'}
                  </button>
                ) : (
                  <>
                    <p className="mb-4 text-gray-300">
                      {userData?.tokenAddress
                        ? 'You have already minted your acceptance token!'
                        : 'Your acceptance token has been minted!'}
                    </p>
                    <button
                      className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors duration-200 hover:bg-purple-700"
                      onClick={() =>
                        window.open(
                          `https://zora.co/coin/base:${coinAddress}`,
                          '_blank',
                        )
                      }
                    >
                      View on Zora
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Home
