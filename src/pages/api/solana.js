const web3 = require('@solana/web3.js')
const { getDomain } = require('tldjs')

const connection = new web3.Connection('https://api.mainnet-beta.solana.com', 'confirmed')

export default async function handler(req, res) {
  if (!req.headers?.referer || getDomain(req.headers?.referer) !== getDomain(req.headers?.host)) return res.status(404).end(), undefined
  res.status(200).send(await connection.getBalance(new web3.PublicKey(req.query.payer)))
}
