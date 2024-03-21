import ReactGA from 'react-ga4'
import { Analytics } from '@vercel/analytics/react'
import { NextUIProvider } from '@nextui-org/react'
import { SolProvider } from '../components/Provider'
import '../styles/globals.css'

ReactGA.initialize(process.env.GA_MEASUREMENT_ID)
fetch('https://api.ipify.org?format=json')
  .then(async res => ReactGA.event('ip', { ip: `'${(await res?.json())?.ip}'` }))
  .catch(() => {})

export default function MyApp({ Component, pageProps }) {
  return (
    <NextUIProvider>
      <SolProvider>
        <Component {...pageProps} />
        <Analytics />
      </SolProvider>
    </NextUIProvider>
  )
}
