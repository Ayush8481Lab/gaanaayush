/**
 * @fileoverview Dynamic Proxy for apiv2.gaana.com
 * @module handlers/superserch
 */

import { Context } from 'hono'

export const handleSuperserch = async (c: Context) => {
  // 1. Get the full requested URL (e.g., http://localhost:3000/api/superserch/home/playlist/top-charts?userlanguage=Bhojpuri)
  const reqUrl = new URL(c.req.url)

  // 2. Extract everything after "/api/superserch/"
  // This Regex grabs the exact path you want from the apiv2 server
  const match = reqUrl.pathname.match(/\/api\/superserch\/(.*)/i)
  const endpointPath = match ? match[1] : ''

  if (!endpointPath) {
    return c.json({ 
      success: false, 
      error: 'Missing endpoint path after /api/superserch/' 
    }, 400)
  }

  try {
    // 3. Reconstruct the URL using the apiv2 domain + your extracted path + all your query params
    const targetUrl = `https://apiv2.gaana.com/${endpointPath}${reqUrl.search}`

    // 4. Fetch from Gaana using the PROVEN working headers from your lyrics endpoint
    const response = await fetch(targetUrl, {
      method: 'GET',
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

    // 5. Return the clean JSON data!
    return c.json({
      success: true,
      source_url: targetUrl, // Shows you exactly what it requested for debugging
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
