/**
 * @fileoverview Independent LRC (Lyrics) endpoint
 * @module routes/lrc
 */

import { Hono } from 'hono'
import { gaanaService } from '../services/instances.js'

const lrcRouter = new Hono()

lrcRouter.get('/', async (c) => {
  const trackId = c.req.query('id')

  if (!trackId) {
    return c.json(
      gaanaService.formatResponse({ error: 'Song ID (?id=) is required' }),
      400
    )
  }

  try {
    // Fetch Gaana API with required bypass headers
    const response = await fetch(`https://apiv2.gaana.com/lyrics/url?track_id=${trackId}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'deviceType': 'GaanaAndroidApp',
        'appVersion': 'V5',
        'Accept': 'application/json',
        'Origin': 'https://gaana.com',
        'Referer': 'https://gaana.com/'
      }
    })

    if (!response.ok) {
      return c.json(
        gaanaService.formatResponse({ error: 'Failed to communicate with Gaana API' }),
        response.status
      )
    }

    const gaanaData = await response.json()
    let lyricsText = null

    // If a valid lyrics URL is found, fetch the actual .lrc text automatically
    if (gaanaData.status === 1 && gaanaData.lyrics_url) {
      try {
        const fileRes = await fetch(gaanaData.lyrics_url)
        lyricsText = await fileRes.text()
      } catch (err) {
        console.error("Could not download actual lyrics file content", err)
      }
    }

    return c.json(
      gaanaService.formatResponse({
        track_id: trackId,
        lyrics: lyricsText, // Literal LRC content 
        lyrics_url: gaanaData.lyrics_url || null,
        raw_response: gaanaData
      })
    )
  } catch (error) {
    console.error("Lyrics API Error:", error)
    return c.json(
      gaanaService.formatResponse({ error: 'Internal Server Error' }),
      500
    )
  }
})

export default lrcRouter
