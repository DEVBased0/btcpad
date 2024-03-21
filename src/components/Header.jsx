import Head from 'next/head'

export default function Header({ title }) {
  return (
    <Head>
      <title>{title || 'Launchpad'}</title>
      <link rel="icon" href="/favicon.ico" />
      <link rel="manifest" href="/manifest.json" />
      <meta property="og:url" content="%PUBLIC_URL%" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="BTC" />
      <meta property="og:image" content="/logo.png" />
      <meta property="og:description" content="BTC" />
      <meta name="description" content="BTC" />
    </Head>
  )
}
