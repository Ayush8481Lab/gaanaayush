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
    const targetUrl = `https://rec.gaana.com/${endpointPath}${reqUrl.search}`

    // 3. Fetch from Gaana using our bypass headers
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'deviceType': 'GaanaAndroidApp',
        'appVersion': 'V5',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://gaana.com',
        'Referer': 'https://gaana.com/'
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
