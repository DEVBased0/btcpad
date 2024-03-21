import Image from 'next/image'
import Link from 'next/link'
import { Divider } from '@nextui-org/react'
import { FaTelegramPlane, FaTwitter } from 'react-icons/fa'
import config from '../config.js'
import logo from '../../public/logo.png'

export default function Footer() {
  return (
    <div className="px-2 py-14">
      <div className="mx-auto flex max-w-3xl items-center justify-between xl:max-w-6xl">
        <div className="space-y-3">
          <Link target="_blank" className="group flex items-center space-x-3" href={config.website}>
            <Image src={logo} height={45} alt="logo" className="max-h-10 w-auto rounded-xl" />
            <div>
              <p className="text-lg font-bold tracking-wider text-orange-500 transition-all duration-75 ease-in-out group-hover:text-orange-600 sm:text-xl">BTC</p>
              <p className="text-sm text-gray-400">© {new Date().getFullYear()}. All rights reserved</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <div className="hidden items-center space-x-2 sm:flex">
            <Link href="/" className="text-sm text-foreground-500 transition-all duration-75 ease-in-out hover:text-foreground-600">
              Launchpad
            </Link>
            <Divider orientation="vertical" className="h-unit-md bg-foreground-300" />
            <Link href="/tools" className="text-sm text-foreground-500 transition-all duration-75 ease-in-out hover:text-foreground-600">
              Token Tools
            </Link>
            <Divider orientation="vertical" className="h-unit-md bg-foreground-300" />
          </div>
          <div className="flex items-center space-x-5 text-lg sm:space-x-3">
            <Link target="_blank" href={config.telegram} className="text-orange-500 transition-all duration-75 ease-in-out hover:text-orange-600">
              <FaTelegramPlane />
            </Link>
            <Link target="_blank" href={config.twitter} className="text-orange-500 transition-all duration-75 ease-in-out hover:text-orange-600">
              <FaTwitter />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
