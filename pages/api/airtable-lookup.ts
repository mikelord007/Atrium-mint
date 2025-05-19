import type { NextApiRequest, NextApiResponse } from 'next'
import Airtable from 'airtable'

if (!process.env.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY is not defined')
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID is not defined')
}

if (!process.env.AIRTABLE_TABLE_NAME) {
  throw new Error('AIRTABLE_TABLE_NAME is not defined')
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID as string,
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { address } = req.query

  if (!address) {
    return res.status(400).json({ message: 'Address is required' })
  }

  try {
    const table = process.env.AIRTABLE_TABLE_NAME
    const records = await base(table)
      .select({
        filterByFormula: `{Uniswap Wallet Address} = '${address}'`,
      })
      .firstPage()

    if (records.length === 0) {
      return res.status(404).json({ message: 'Record not found' })
    }

    const record = records[0]
    const userData = {
      name: record.get('Preferred Name?') as string,
      image: record.get('Personalized Acceptance Image Link') as string,
      tokenAddress: record.get('Acceptance token address') as string,
    }

    res.status(200).json(userData)
  } catch (error: any) {
    console.error('Error fetching from Airtable:', {
      error: error.message,
      statusCode: error.statusCode,
      details: error.error,
    })
    res.status(500).json({ message: 'Error fetching record' })
  }
}
