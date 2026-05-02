/**
 * @fileoverview Handler for Gaana Super Search
 * @module handlers/supersearch
 */

import { Context } from 'hono'

export const handleSuperSearch = async (c: Context) => {
  // 1. Extract query parameters with defaults
  const query = c.req.query('q')
  const language = c.req.query('language') || 'Hindi,English' // Default languages
  const include = c.req.query('include') || 'allitems'        // album, playlist, track, artist, allitems
  const startIndex = c.req.query('startIndex') || '0'         // Default to page 0

  if (!query) {
    return c.json({ success: false, error: 'Search query (?q=) is required' }, 400)
  }

  try {
    // 2. Construct the exact URL Gaana expects
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

    // 3. Fetch with the mandatory bypass headers
    const response = await fetch(searchUrl.toString(), {
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
      const errorText = await response.text()
      return c.json({ 
        success: false, 
        error: `Gaana blocked the request. Status: ${response.status}`,
        details: errorText 
      }, response.status as any)
    }

    const gaanaData = await response.json()

    // 4. Return beautifully formatted, pure JSON without 'meta' tags
    return c.json({
      success: true,
      query: query,
      params: {
        language,
        include,
        startIndex
      },
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
