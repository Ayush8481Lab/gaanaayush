/**
 * @fileoverview Handler for fetching literal .lrc text content
 * @module handlers/lrc
 */

import { Context } from 'hono'

export const handleLrc = async (c: Context) => {
  const trackId = c.req.query('id')

  if (!trackId) {
    // Returning pure JSON to avoid the "meta" block
    return c.json({ success: false, error: 'Song ID (?id=) is required' }, 400)
  }

  try {
    const response = await fetch(`https://apiv2.gaana.com/lyrics/url?track_id=${trackId}`, {
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
    let lyricsText = null

    // FIX 1: We removed the "status === 1" check. 
    // Now it directly checks if lyrics_url exists and fetches it!
    if (gaanaData && gaanaData.lyrics_url) {
      try {
        const fileRes = await fetch(gaanaData.lyrics_url)
        lyricsText = await fileRes.text()
      } catch (err) {
        console.error("Could not download actual lyrics file content", err)
      }
    }

    // FIX 2: We removed `gaanaService.formatResponse()`. 
    // This gives you clean output without the "meta" tag!
    return c.json({
      success: true,
      data: {
        track_id: trackId,
        lyrics: lyricsText, // This will now contain the literal [00:00] lyrics!
        lyrics_url: gaanaData?.lyrics_url || null,
        raw_response: gaanaData
      }
    })

  } catch (error: any) {
    console.error("Lyrics API Error:", error)
    return c.json({ 
      success: false, 
      error: 'Internal Server Error',
      message: error.message || String(error)
    }, 500)
  }
}
