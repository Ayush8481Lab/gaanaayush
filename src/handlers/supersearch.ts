/**
 * @fileoverview Handler for Gaana Super Search (App Spoofing)
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
    searchUrl.searchParams.append('startIndex', startIndex)
    searchUrl.searchParams.append('usrLang', language)
    
    // REMOVED: rType=web and webVersion=mix to avoid Web Firewall

    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        // SPOOFING AS THE ANDROID APP (Bypasses Vercel Server Blocks)
        'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 10; SM-G975F)', // Real Android User-Agent
        'deviceType': 'GaanaAndroidApp',
        'appVersion': 'V5',
        'Accept': 'application/json',
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

    const responseText = await response.text()

    if (!responseText) {
      return c.json({ 
        success: false, 
        error: 'Gaana firewall still blocking.',
        url_used: searchUrl.toString()
      }, 502)
    }

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
