/**
 * @fileoverview Dynamic Proxy for gsearch.gaana.com (Supports Root & Subpaths)
 * @module handlers/superserch
 */

import { Context } from 'hono'

export const handleSuperserch = async (c: Context) => {
  const reqUrl = new URL(c.req.url)

  // 1. Extract the path after "/api/superserch"
  const match = reqUrl.pathname.match(/\/api\/superserch\/?(.*)/i)
  const endpointPath = match ? match[1] : ''

  try {
    // 2. Reconstruct the Target URL
    const targetUrl = `https://gsearch.gaana.com/${endpointPath}${reqUrl.search}`

    // 3. Fetch from Gaana using strictly WEB headers (Removed AndroidApp headers)
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://gaana.com',
        'Referer': 'https://gaana.com/'
      }
    })

    // 4. READ AS TEXT FIRST. This prevents the "Unexpected end of JSON input" crash.
    const rawText = await response.text()

    // 5. Handle standard HTTP errors
    if (!response.ok) {
      return c.json({ 
        success: false, 
        error: `Gaana blocked request: ${response.status}`,
        details: rawText, 
        url_attempted: targetUrl
      }, response.status as any)
    }

    // 6. Handle silent blocks (Empty Responses)
    if (!rawText || rawText.trim() === '') {
      return c.json({
        success: false,
        error: 'Gaana returned an empty response (Possible Bot Block by Gaana)',
        url_attempted: targetUrl
      }, 500)
    }

    // 7. Safely parse JSON
    let gaanaData;
    try {
      gaanaData = JSON.parse(rawText)
    } catch (parseError) {
      // If Gaana sends back HTML (like an Akamai block page), return the text so you can debug it
      return c.json({
        success: false,
        error: 'Gaana returned non-JSON data. See raw_response.',
        raw_response: rawText.substring(0, 500), // First 500 chars
        url_attempted: targetUrl
      }, 500)
    }

    // 8. Return successful clean data
    return c.json({
      success: true,
      source_url: targetUrl, 
      data: gaanaData
    })

  } catch (error: any) {
    console.error("Dynamic API Error:", error)
    return c.json({ 
      success: false, 
      error: 'Internal Server Error',
      message: error.message || String(error)
    }, 500)
  }
}
