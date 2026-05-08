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
    const targetUrl = `https://gsearch.gaana.com/${endpointPath}${reqUrl.search}`

    // 3. Fetch from Gaana using our bypass headers
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "referer": "https://gaana.com/search/songs/hellllll",
        "accept": "text/css,*/*;q=0.1",
        "accept-encoding": "gzip, deflate, br, zstd",
        "connection": "keep-alive",
        "cookie": "deviceId=4aa04b60-4bb4-4903-9bc0-7db7dc91c41a; deviceType=GaanaWebsiteApp; __ul=Hindi%2CEnglish",
        "host": "gaana.com",
        "sec-fetch-dest": "style",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-site": "same-origin"
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
