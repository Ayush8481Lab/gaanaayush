/**
 * @fileoverview Handler for Gaana Super Search
 * @module handlers/supersearch
 */

import { Context } from 'hono'

export const handleSuperSearch = async (c: Context) => {
  const query = c.req.query('q')
  const language = c.req.query('language') || 'Hindi,English' 
  const include = c.req.query('include') || 'allitems'        
  const startIndex = c.req.query('startIndex') || '0'         

  if (!query) {
    return c.json({ success: false, error: 'Search query (?q=) is required' }, 400)
  }

  try {
    const searchUrl = new URL('https://gsearch.gaana.com/vichitih/go/v2/')
    searchUrl.searchParams.append('geoLocation', 'GLOBAL')
    searchUrl.searchParams.append('query', query)
    searchUrl.searchParams.append('content_filter', '2')
    searchUrl.searchParams.append('include', include)
    searchUrl.searchParams.append('isRegSrch', '0')
    searchUrl.searchParams.append('webVersion', 'mix')
    searchUrl.searchParams.append('rType', 'web')
    searchUrl.searchParams.append('startIndex', startIndex)
    searchUrl.searchParams.append('usrLang', language)

    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        // We use pure Web headers here because rType=web. 
        // DO NOT use deviceType=GaanaAndroidApp for this specific endpoint.
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://gaana.com',
        'Referer': 'https://gaana.com/'
      }
    })

    if (!response.ok) {
      const errText = await response.text()
      return c.json({ 
        success: false, 
        error: `Gaana blocked request: ${response.status}`,
        details: errText 
      }, response.status as any)
    }

    // FIX: Read as text first to prevent the JSON crash
    const responseText = await response.text()

    if (!responseText) {
      return c.json({ 
        success: false, 
        error: 'Gaana returned an empty response (Firewall block).',
        url_used: searchUrl.toString()
      }, 502)
    }

    // Now safely parse the text into JSON
    const gaanaData = JSON.parse(responseText)

    return c.json({
      success: true,
      query: query,
      params: { language, include, startIndex },
      data: gaanaData
    })

  } catch (error: any) {
    console.error("SuperSearch API Error:", error)
    return c.json({ 
      success: false, 
      error: 'Internal Server Error',
      message: error.message || String(error)
    }, 500)
  }
}
