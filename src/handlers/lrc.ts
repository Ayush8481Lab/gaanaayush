/**
 * @fileoverview Handler for fetching literal .lrc text content
 * @module handlers/lrc
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'

export const handleLrc = async (c: Context) => {
  // 1. Get the track ID from query: /api/lrc?id=song_id
  const trackId = c.req.query('id')

  if (!trackId) {
    return c.json(
      gaanaService.formatResponse({ error: 'Song ID (?id=) is required' }),
      400
    )
  }

  try {
    // 2. Fetch Gaana API with the mandatory bypass headers
    const response = await fetch(`https://apiv2.gaana.com/lyrics/url?track_id=${trackId}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'deviceType': 'GaanaAndroidApp', // Very important
        'appVersion': 'V5',              // Very important
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://gaana.com',
        'Referer': 'https://gaana.com/'
      }
    })

    if (!response.ok) {
      // FIX: Capture exact error text from Gaana to debug Vercel issues
      const errorText = await response.text()
      return c.json(
        gaanaService.formatResponse({ 
          error: `Gaana blocked the request. Status: ${response.status}`,
          details: errorText 
        }),
        response.status as any // Bypasses Hono strict typing error
      )
    }

    const gaanaData = await response.json()
    let lyricsText = null

    // 3. If a valid lyrics URL is returned, fetch the raw text (.lrc)
    if (gaanaData && gaanaData.status === 1 && gaanaData.lyrics_url) {
      try {
        const fileRes = await fetch(gaanaData.lyrics_url)
        lyricsText = await fileRes.text()
      } catch (err) {
        console.error("Could not download actual lyrics file content", err)
      }
    }

    // 4. Return formatted response blending perfectly with your API
    return c.json(
      gaanaService.formatResponse({
        track_id: trackId,
        lyrics: lyricsText,
        lyrics_url: gaanaData?.lyrics_url || null,
        raw_response: gaanaData
      })
    )
  } catch (error: any) {
    console.error("Lyrics API Error:", error)
    return c.json(
      gaanaService.formatResponse({ 
        error: 'Internal Server Error',
        message: error.message || String(error) // Captures Vercel crash reasons
      }),
      500
    )
  }
}
