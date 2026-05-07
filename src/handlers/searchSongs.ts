/**
 * @fileoverview Handler for song search endpoint.
 * Searches for songs matching the query string.
 * @module handlers/searchSongs
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'
import { validateQueryParam, validationSchemas } from '../utils/validation.js'

export async function handleSearchSongs(c: Context) {
  // Validate search query
  const queryValidation = validateQueryParam(c, 'q', validationSchemas.searchQuery, true)
  if (!queryValidation.success) {
    return c.json({ error: queryValidation.error }, queryValidation.status)
  }

  // Get dynamic limit as string (defaults to "0,10")
  const limitParam = c.req.query('limit') || '0,10'
  
  // Security check: Make sure limit format is either "40" or "10,40"
  if (!/^\d+(,\d+)?$/.test(limitParam)) {
    return c.json({ error: "Invalid limit format. Use number or 'offset,count' (e.g., 10,40)" }, 400)
  }

  // Validate language (optional parameter)
  const languageValidation = validateQueryParam(c, 'language', validationSchemas.language, false)
  if (!languageValidation.success) {
    return c.json({ error: languageValidation.error }, languageValidation.status)
  }

  try {
    // Pass query, limit string, and language to the service
    const songs = await gaanaService.searchSongs(
      queryValidation.data, 
      limitParam,
      languageValidation.data
    )

    return c.json(gaanaService.formatResponse(songs, { count: songs.length }))
  } catch (err) {
    console.error('Search songs error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Search failed' }, 500)
  }
}
