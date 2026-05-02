/**
 * @fileoverview Main API router configuration for all endpoints.
 * @module routes/index
 */

import { Hono } from 'hono'
import { handleSearch } from '../handlers/search.js'
import { handleSearchSongs } from '../handlers/searchSongs.js'
import { handleSearchAlbums } from '../handlers/searchAlbums.js'
import { handleSearchPlaylists } from '../handlers/searchPlaylists.js'
import { handleSearchArtists } from '../handlers/searchArtists.js'
import { handleGetSong } from '../handlers/songs.js'
import { handleGetAlbum } from '../handlers/albums.js'
import { handleGetPlaylist } from '../handlers/playlists.js'
import { handleGetArtist } from '../handlers/artists.js'
import { handleTrending } from '../handlers/trending.js'
import { handleCharts } from '../handlers/charts.js'
import { handleNewReleases } from '../handlers/newreleases.js'
import { handleAlbumList } from '../handlers/albumList.js'
import { handleLyricsList, handleSongLyrics } from '../handlers/lyrics.js'
import { handleHealth } from '../handlers/health.js'
import { handleGetStream } from '../handlers/stream.js'
import { handleLrc } from '../handlers/lrc.js'

// --- CORRECTED IMPORT (No 'a' in superserch) ---
import { handleSuperserch } from '../handlers/superserch.js'
import { handleSuperserch } from '../handlers/supersearch.js'

const router = new Hono()

// Health check
router.get('/health', handleHealth)

// Type-specific search endpoints
router.get('/search/songs', handleSearchSongs)
router.get('/search/albums', handleSearchAlbums)
router.get('/search/playlists', handleSearchPlaylists)
router.get('/search/artists', handleSearchArtists)

// Global search endpoint
router.get('/search', handleSearch)

// Resource endpoints
router.get('/songs', handleGetSong)
router.get('/albums', handleGetAlbum)
router.get('/playlists', handleGetPlaylist)
router.get('/artists', handleGetArtist)

// Path parameter support
router.get('/songs/:seokey', handleGetSong)
router.get('/albums/:seokey', handleGetAlbum)
router.get('/playlists/:seokey', handleGetPlaylist)
router.get('/artists/:seokey', handleGetArtist)

// Browse endpoints
router.get('/trending', handleTrending)
router.get('/charts', handleCharts)
router.get('/new-releases', handleNewReleases)
router.get('/album-list', handleAlbumList)
router.get('/lyrics', handleLyricsList)
router.get('/lyrics/:seokey', handleSongLyrics)

// Stream URL endpoint
router.get('/stream', handleGetStream)
router.get('/stream/:trackId', handleGetStream)

// Custom LRC endpoint
router.get('/lrc', handleLrc)

// --- CORRECTED ROUTE ---
// Dynamic apiv2 Proxy Route
router.get('/superserch/*', handleSuperserch)
router.get('/supersearch/*', handleSupersearch)

export default router
