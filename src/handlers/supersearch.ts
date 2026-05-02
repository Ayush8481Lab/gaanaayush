/**
 * @fileoverview Handler for Gaana Super Search (Ultimate Firewall Bypass)
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
    
    // Generate a random Indian IP address to hide the Vercel Data Center IP
    const fakeIp = `103.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`

    const response = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        // 1. Use the exact networking library the Android App uses
        'User-Agent': 'okhttp/4.9.2',
        
        // 2. Official App Credentials
        'deviceType': 'GaanaAndroidApp',
        'appVersion': 'V9',
        
        // 3. Accepted data types
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',

        // 4. IP Spoofing (Crucial for Vercel)
        'X-Forwarded-For': fakeIp,
        'X-Real-IP': fakeIp
        
        // NOTICE: No 'Origin' or 'Referer' headers are here! 
        // Adding them will cause the firewall to block us again.
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

    if (!responseText || responseText.trim() === '') {
      return c.json({ 
        success: false, 
        error: 'Gaana firewall still blocking (Empty Response).',
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
