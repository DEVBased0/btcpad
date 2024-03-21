import React from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import Image from 'next/image'
import Link from 'next/link'
import { Divider } from '@nextui-org/react'
import { ConnectSol } from './ConnectSol'
import config from '../config.js'
import logo from '../../public/logo.png'

export default function Navbar() {
  const { connected } = useWallet()

  return (
    <nav className="p-4">
      <div className="mx-auto flex max-w-3xl items-center justify-between xl:max-w-6xl">
        <div className="grid items-center gap-2 sm:flex sm:gap-4">
          <Link href={config.website} target="_blank">
            <Image src={logo} height={55} alt="logo" className="max-h-12 w-auto cursor-pointer rounded-xl sm:mx-auto" />
          </Link>
          <div>
            <Link target="_blank" className="text-lg font-bold tracking-wider text-orange-500 transition-all duration-75 ease-in-out hover:text-orange-600 sm:text-2xl" href={config.website}>
              BTC
            </Link>
            <div className="items-center gap-2 sm:flex">
              <div>
                <Link href="/" className="text-sm text-foreground-500 transition-all duration-75 ease-in-out hover:text-foreground-600">
                  Launchpad
                </Link>
              </div>
              <Divider orientation="vertical" className="hidden h-unit-md bg-foreground-300 sm:inline" />
              <div>
                <Link href="/tools" className="text-sm text-foreground-500 transition-all duration-75 ease-in-out hover:text-foreground-600">
                  Token Tools
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className={`${connected ? 'border-default bg-transparent' : 'connect-btn border-primary bg-primary'} z-10 w-36 min-w-fit rounded-xl border text-center backdrop-blur-md transition-all hover:border-success hover:bg-success`}>
          <ConnectSol />
        </div>
      </div>
    </nav>
  )
}
