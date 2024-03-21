import { PublicKey } from '@solana/web3.js'

export function checkAddress(address) {
  try {
    return new PublicKey(address?.trim())
  } catch {}
  return false
}

export function imagetoBase64(img) {
  if (!img) return
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(img)
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
  })
}

export const trimAddress = address => address.slice(0, 4) + '..' + address.slice(-4)
