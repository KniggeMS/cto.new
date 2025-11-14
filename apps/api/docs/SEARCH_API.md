# Search API Documentation

The Search API provides endpoints for discovering movies and TV shows through TMDB integration with intelligent caching and provider data enrichment.

## Base URL
- Development: `http://localhost:3001/search`
- Production: `https://api.infocus.app/search`

## Authentication
Search endpoints do not require authentication. However, some features like cache management may be restricted in production.

## Endpoints

### 1. Search Movies and TV Shows

Search for movies and TV shows across the TMDB database with results enriched with cached provider data.

**Endpoint:** `GET /search`

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search query (minimum 1 character) |
| page | integer | No | 1 | Page number (1-1000) |
| include_adult | boolean | No | false | Include adult content in results |

**Request Example:**
```bash
GET /search?query=inception&page=1&include_adult=false
```

**Response Example:**
```json
{
  "page": 1,
  "results": [
    {
      "id": 27205,
      "title": "Inception",
      "overview": "A thief who steals corporate secrets...",
      "poster_path": "/qmDpIHrmpDINLDtE9IuPWqI6p4f.jpg",
      "backdrop_path": "/s3TBrRGB1iav7gFOCNx3H31MoYS.jpg",
      "release_date": "2010-07-16",
      "vote_average": 8.367,
      "genre_ids": [28, 878, 12],
      "media_type": "movie",
      "streamingProviders": [
        {
          "provider_id": "netflix",
          "provider_name": "netflix",
          "logo_path": null,
          "regions": ["US", "GB"]
        }
      ],
      "inDatabase": true
    }
  ],
  "total_results": 1,
  "total_pages": 1,
  "cached": false
}
```

**Response Fields:**
- `page`: Current page number
- `results`: Array of search results
- `total_results`: Total number of results
- `total_pages`: Total number of pages
- `cached`: Boolean indicating if results came from cache
- `stale`: Boolean indicating if cached data is stale (only present when using fallback)

**Result Object Fields:**
- `id`: TMDB ID
- `title`: Title (movie or TV show name)
- `overview`: Description/plot summary
- `poster_path`: Poster image path
- `backdrop_path`: Backdrop image path
- `release_date`: Release date (movies) or first air date (TV)
- `vote_average`: Average rating (0-10)
- `genre_ids`: Array of genre IDs
- `media_type`: "movie" or "tv"
- `streamingProviders`: Array of streaming providers (if in database)
- `inDatabase`: Boolean indicating if media exists in our database

**Error Responses:**

400 Bad Request:
```json
{
  "error": "Invalid query parameters",
  "details": [
    {
      "code": "too_small",
      "message": "String must contain at least 1 character(s)",
      "path": ["query"]
    }
  ]
}
```

500 Internal Server Error:
```json
{
  "error": "Failed to perform search",
  "message": "TMDB API Error: Invalid API key (401)"
}
```

### 2. Get Media Details

Get detailed information about a specific movie or TV show including streaming providers.

**Endpoint:** `GET /media/:tmdbId`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tmdbId | integer | Yes | TMDB ID of the media |

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| type | string | No | movie | Media type: "movie" or "tv" |
| language | string | No | en | Language code for results |

**Request Example:**
```bash
GET /media/27205?type=movie&language=en
```

**Response Example:**
```json
{
  "id": 27205,
  "title": "Inception",
  "overview": "A thief who steals corporate secrets...",
  "poster_path": "/qmDpIHrmpDINLDtE9IuPWqI6p4f.jpg",
  "backdrop_path": "/s3TBrRGB1iav7gFOCNx3H31MoYS.jpg",
  "release_date": "2010-07-16",
  "vote_average": 8.367,
  "genre_ids": [28, 878, 12],
  "media_type": "movie",
  "adult": false,
  "original_language": "en",
  "popularity": 31.486,
  "video": false,
  "vote_count": 35000,
  "genres": [
    {
      "id": 28,
      "name": "Action"
    },
    {
      "id": 878,
      "name": "Science Fiction"
    }
  ],
  "watch_providers": {
    "results": {
      "US": {
        "flatrate": [
          {
            "provider_id": 8,
            "provider_name": "Netflix",
            "logo_path": "/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg"
          }
        ],
        "buy": [
          {
            "provider_id": 2,
            "provider_name": "Apple TV",
            "logo_path": "/4VzX4yqrM6XfYwF8fLWHkzKQxfL.jpg"
          }
        ]
      }
    },
    "cached": [
      {
        "provider_id": "netflix",
        "provider_name": "netflix",
        "logo_path": null,
        "regions": ["US", "GB"]
      }
    ]
  },
  "runtime": 148,
  "inDatabase": true
}
```

**Additional Response Fields for Movies:**
- `runtime`: Duration in minutes
- `status`: Release status

**Additional Response Fields for TV Shows:**
- `number_of_seasons`: Total number of seasons
- `number_of_episodes`: Total number of episodes
- `status`: Series status

**Error Responses:**

400 Bad Request:
```json
{
  "error": "Invalid parameters",
  "details": [
    {
      "code": "invalid_enum_value",
      "message": "Invalid enum value",
      "path": ["type"]
    }
  ]
}
```

404 Not Found:
```json
{
  "error": "Failed to fetch media details",
  "message": "TMDB API Error: Resource not found (404)"
}
```

### 3. Get Genres

Get list of available genres for movies or TV shows.

**Endpoint:** `GET /genres/:type`

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | Yes | Genre type: "movie" or "tv" |

**Request Example:**
```bash
GET /genres/movie
```

**Response Example:**
```json
{
  "genres": [
    {
      "id": 28,
      "name": "Action"
    },
    {
      "id": 12,
      "name": "Adventure"
    },
    {
      "id": 16,
      "name": "Animation"
    },
    {
      "id": 35,
      "name": "Comedy"
    },
    {
      "id": 80,
      "name": "Crime"
    },
    {
      "id": 99,
      "name": "Documentary"
    },
    {
      "id": 18,
      "name": "Drama"
    },
    {
      "id": 10751,
      "name": "Family"
    },
    {
      "id": 14,
      "name": "Fantasy"
    },
    {
      "id": 36,
      "name": "History"
    },
    {
      "id": 27,
      "name": "Horror"
    },
    {
      "id": 10402,
      "name": "Music"
    },
    {
      "id": 9648,
      "name": "Mystery"
    },
    {
      "id": 10749,
      "name": "Romance"
    },
    {
      "id": 878,
      "name": "Science Fiction"
    },
    {
      "id": 10770,
      "name": "TV Movie"
    },
    {
      "id": 53,
      "name": "Thriller"
    },
    {
      "id": 10752,
      "name": "War"
    },
    {
      "id": 37,
      "name": "Western"
    }
  ],
  "cached": false
}
```

**Error Responses:**

400 Bad Request:
```json
{
  "error": "Invalid type. Must be \"movie\" or \"tv\""
}
```

### 4. Cache Management

#### Clear Cache
Clear all cached search and media data.

**Endpoint:** `POST /cache/clear`

**Response Example:**
```json
{
  "message": "Cache cleared successfully"
}
```

#### Get Cache Statistics
Get current cache statistics for monitoring and debugging.

**Endpoint:** `GET /cache/stats`

**Response Example:**
```json
{
  "keys": 1247,
  "hits": 5234,
  "misses": 892,
  "ksize": 2048576,
  "vsize": 5242880
}
```

**Cache Statistics Fields:**
- `keys`: Number of cached keys
- `hits`: Number of cache hits
- `misses`: Number of cache misses
- `ksize`: Size of keys in bytes
- `vsize`: Size of values in bytes

## Caching Behavior

### Cache TTL (Time To Live)
- **Search Results**: 5 minutes (300 seconds)
- **Media Details**: 30 minutes (1800 seconds)
- **Genres**: 24 hours (86400 seconds)
- **Watch Providers**: 1 hour (3600 seconds)

### Cache Invalidation
- Cache is automatically invalidated when TTL expires
- Manual cache clearing available via `/cache/clear` endpoint
- Stale cache fallback when TMDB API is unavailable

### Fallback Behavior
When TMDB API is unavailable:
- Search returns stale cached data with `stale: true` flag
- Media details return stale cached data with `stale: true` flag
- Warning message included in response
- If no cached data available, returns appropriate error

## Rate Limiting

- **TMDB API**: ~40 requests per 10 seconds
- **Built-in Rate Limiting**: Automatic request throttling
- **Batch Processing**: 5 requests per batch with 1-second delays

## Error Handling

### Common Error Codes
- `400`: Bad Request - Invalid parameters
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - API or TMDB service error

### Error Response Format
```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "details": [] // Validation errors (optional)
}
```

## Integration with Watchlist

When users add media to their watchlist:
1. If media exists in database: Use existing record
2. If media doesn't exist: Automatically fetch from TMDB and persist
3. Enrich with streaming provider data
4. Cache results for future requests

## Image URLs

TMDB image paths can be converted to full URLs:
- Base URL: `https://image.tmdb.org/t/p/`
- Sizes: `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original`

Example:
```
https://image.tmdb.org/t/p/w500/qmDpIHrmpDINLDtE9IuPWqI6p4f.jpg
```