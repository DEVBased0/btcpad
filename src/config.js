const config = {
  website: 'https://brockthecock.com/',
  telegram: 'https://t.me/BrockTheCock',
  twitter: '/',
  api: 'https://api.cryptotoken.live',
  // api: 'http://localhost:3005',
  explorer: (mintId, devnet) => `https://solscan.io/token/${mintId}${devnet ? '?cluster=devnet' : ''}`,
  testWallets: ['bjAM6woiKsFzjjfzCsgadmHrP2zHiAHenx4s2S3RhUL'],
}

export default config
