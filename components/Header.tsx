import Image from 'next/image'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const Header = () => {
  return (
    <header className="w-full border-b border-gray-800 bg-black">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <Image
            src="/Atrium Logo.png"
            alt="Company Logo"
            width={200}
            height={40}
            className="mr-2"
          />
        </div>
        <div className="flex items-center justify-center">
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}

export default Header
