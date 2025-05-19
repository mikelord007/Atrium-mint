import type { NextApiRequest, NextApiResponse } from 'next'
import Airtable from 'airtable'

if (!process.env.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY is not defined')
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID is not defined')
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID as string,
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!process.env.AIRTABLE_TABLE_NAME) {
    console.error('AIRTABLE_TABLE_NAME is not set')
    return res.status(500).json({ error: 'Airtable table name not configured' })
  }

  const { address, coinAddress } = req.body

  if (!address || !coinAddress) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  try {
    // Find the record by wallet address
    const table = process.env.AIRTABLE_TABLE_NAME
    const records = await base(table)
      .select({
        filterByFormula: `{Uniswap Wallet Address} = '${address}'`,
      })
      .firstPage()

    if (records.length === 0) {
      return res.status(404).json({ message: 'Record not found' })
    }

    // Update the record with the coin address
    const record = records[0]
    const updatedRecord = await base(table).update(record.id, {
      'Acceptance token address': coinAddress,
    })

    console.log('Successfully updated record:', updatedRecord)
    res.status(200).json({ message: 'Record updated successfully' })
  } catch (error: any) {
    console.error('Error updating Airtable:', {
      error: error.message,
      statusCode: error.statusCode,
      details: error.error,
    })

    // Return more specific error messages
    if (error.statusCode === 403) {
      return res.status(403).json({
        message:
          'Airtable API authorization failed. Please check your API key permissions.',
        details: error.error,
      })
    }

    res.status(500).json({
      message: 'Error updating record',
      details: error.message,
    })
  }
}
