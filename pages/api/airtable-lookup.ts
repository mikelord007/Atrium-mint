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
    console.log('Starting Airtable lookup with:', {
      address,
      tableName: process.env.AIRTABLE_TABLE_NAME,
      baseId: process.env.AIRTABLE_BASE_ID,
      hasApiKey: !!process.env.AIRTABLE_API_KEY,
    })

    const table = process.env.AIRTABLE_TABLE_NAME as string
    const records = await base(table)
      .select({
        filterByFormula: `{Uniswap Wallet Address} = '${address}'`,
      })
      .firstPage()

    console.log('Airtable query completed, found records:', records.length)

    if (records.length === 0) {
      return res.status(404).json({ message: 'Record not found' })
    }

    const record = records[0]
    const userData = {
      name: record.get('Preferred Name?') as string,
      image: record.get('Personalized Acceptance Image Link') as string,
      tokenAddress: record.get('Acceptance token address') as string,
    }

    console.log('Successfully retrieved user data:', {
      name: userData.name,
      hasImage: !!userData.image,
      hasTokenAddress: !!userData.tokenAddress,
    })

    res.status(200).json(userData)
  } catch (error: any) {
    console.error('Detailed error in Airtable lookup:', {
      error: error.message,
      statusCode: error.statusCode,
      details: error.error,
      stack: error.stack,
      address,
      table: process.env.AIRTABLE_TABLE_NAME,
      baseId: process.env.AIRTABLE_BASE_ID,
      hasApiKey: !!process.env.AIRTABLE_API_KEY,
      response: error.response
        ? {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data:
              typeof error.response.data === 'string'
                ? error.response.data.substring(0, 500) // Log first 500 chars of response
                : error.response.data,
          }
        : undefined,
    })

    // If we got an HTML response, it's likely an authentication or server error
    if (
      error.response?.data &&
      typeof error.response.data === 'string' &&
      error.response.data.includes('<!DOCTYPE')
    ) {
      return res.status(500).json({
        message: 'Airtable API returned an HTML error page',
        error: 'Authentication or server error',
        statusCode: error.response?.status,
      })
    }

    res.status(500).json({
      message: 'Error fetching record',
      error: error.message,
      details: error.error,
      statusCode: error.statusCode,
    })
  }
}
