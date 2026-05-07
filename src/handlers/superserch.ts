/**
 * @fileoverview Dynamic Proxy for apiv2.gaana.com (Supports Root & Subpaths)
 * @module handlers/superserch
 */

import { Context } from 'hono'

export const handleSuperserch = async (c: Context) => {
  const reqUrl = new URL(c.req.url)

  // 1. Extract the path after "/api/superserch". 
  // Using \/? makes the trailing slash optional, so it safely captures root queries too.
  const match = reqUrl.pathname.match(/\/api\/superserch\/?(.*)/i)
  const endpointPath = match ? match[1] : ''

  try {
    // 2. Reconstruct the URL. 
    // If endpointPath is empty, this perfectly builds "https://apiv2.gaana.com/?query=..."
    const targetUrl = `https://api.gaana.com/${endpointPath}${reqUrl.search}`

    // 3. Fetch from Gaana using our bypass headers
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
     'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    Origin: 'https://gaana.com',
    Referer: 'https://gaana.com/',
    Connection: 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin'
      }
    })

    if (!response.ok) {
      const errText = await response.text()
      return c.json({ 
        success: false, 
        error: `Gaana blocked request: ${response.status}`,
        details: errText,
        url_attempted: targetUrl
      }, response.status as any)
    }

    const gaanaData = await response.json()

    // 4. Return clean data
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
