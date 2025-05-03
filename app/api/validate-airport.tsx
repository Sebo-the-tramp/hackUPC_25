// app/api/validate-airport.tsx
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the airport code from query parameters
  const { code } = req.query;
  
  // Validate the code is present
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Airport code is required' });
  }

  // Make sure we have an API token
  if (!process.env.AIRPORTDB_API_TOKEN) {
    console.error('AIRPORTDB_API_TOKEN is not set in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    console.log(`Fetching airport data for code: ${code}`);
    
    // Call the external API
    const response = await fetch(
      `https://airportdb.io/api/v1/airport/${code}?apiToken=${process.env.AIRPORTDB_API_TOKEN}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    // Log the status code to help with debugging
    console.log(`API response status: ${response.status}`);

    // Handle non-200 responses
    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: 'Airport not found' });
      } else {
        return res.status(response.status).json({ 
          error: `API error: ${response.statusText}` 
        });
      }
    }

    // Parse the JSON response
    const data = await response.json();
    
    // Format a simplified response
    const airportData = {
      name: data.name,
      city: data.municipality,
      country: data.iso_country,
      code: data.icao_code
    };
    
    return res.status(200).json(airportData);
  } catch (err) {
    console.error('Error in validate-airport API route:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}