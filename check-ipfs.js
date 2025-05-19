const fetch = require('node-fetch')

async function checkIPFSContent() {
  const cid = 'bafybeigoxzqzbnxsn35vq7lls3ljxdcwjafxvbvkivprsodzrptpiguysy'
  const gateways = [
    `https://ipfs.io/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
  ]

  for (const gateway of gateways) {
    try {
      console.log(`\nTrying gateway: ${gateway}`)
      const response = await fetch(gateway)
      const contentType = response.headers.get('content-type')
      console.log('Content-Type:', contentType)

      if (contentType?.includes('application/json')) {
        const json = await response.json()
        console.log('Content:', JSON.stringify(json, null, 2))
      } else {
        const text = await response.text()
        console.log('Content (first 200 chars):', text.substring(0, 200))
      }
    } catch (error) {
      console.error(`Error with ${gateway}:`, error.message)
    }
  }
}

checkIPFSContent()
