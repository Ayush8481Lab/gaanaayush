 /**
 * @fileoverview Handler for song search endpoint.
 * Searches for songs matching the query string.
 * @module handlers/searchSongs
 */

import { Context } from 'hono'
import { gaanaService } from '../services/instances.js'
import { validateQueryParam, validateQueryNumber, validationSchemas } from '../utils/validation.js'

/**
 * Handles GET requests for song search.
 *
 * @param {Context} c - Hono context object
 * @returns {Promise<Response>} JSON response with search results or error
 *
 * @example
 * ```typescript
 * GET /api/search/songs?q=new&limit=40&language=Hindi&page=1
 * ```
 */
export async function handleSearchSongs(c: Context) {
  // Validate search query
  const queryValidation = validateQueryParam(c, 'q', validationSchemas.searchQuery, true)
  if (!queryValidation.success) {
    return c.json({ error: queryValidation.error }, queryValidation.status)
  }

  // Validate limit
  const limitValidation = validateQueryNumber(
    c,
    'limit',
    validationSchemas.searchLimit,
    10
  )
  if (!limitValidation.success) {
    return c.json({ error: limitValidation.error }, limitValidation.status)
  }

  // Validate page (defaults to 0 if not provided)
  const pageValidation = validateQueryNumber(
    c, 
    'page', 
    validationSchemas.page, 
    0
  )
  if (!pageValidation.success) {
    return c.json({ error: pageValidation.error }, pageValidation.status)
  }

  // Validate language (optional parameter)
  const languageValidation = validateQueryParam(
    c, 
    'language', 
    validationSchemas.language, 
    false
  )
  if (!languageValidation.success) {
    return c.json({ error: languageValidation.error }, languageValidation.status)
  }

  try {
    // Pass query, limit, page, and language to the service
    const songs = await gaanaService.searchSongs(
      queryValidation.data, 
      limitValidation.data,
      pageValidation.data,
      languageValidation.data
    )

    return c.json(gaanaService.formatResponse(songs, { count: songs.length }))
  } catch (err) {
    console.error('Search songs error:', err)
    return c.json({ error: err instanceof Error ? err.message : 'Search failed' }, 500)
  }
}
