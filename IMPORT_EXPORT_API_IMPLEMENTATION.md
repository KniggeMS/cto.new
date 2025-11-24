# Import/Export API Implementation

This document describes the implemented import/export functionality for the InFocus platform.

## Overview

The import/export feature allows users to:
1. Import watchlist data from CSV or JSON files
2. Preview import data with TMDB match candidates
3. Resolve duplicates using skip/overwrite/merge strategies
4. Export watchlist data in CSV or JSON format

## API Endpoints

### POST /watchlist/import/preview

**Description**: Parse uploaded file and generate preview with TMDB matches

**Request**: 
- Method: POST
- Content-Type: multipart/form-data
- Body: file (CSV or JSON)

**Response**:
```json
{
  "message": "Import preview generated successfully",
  "data": [
    {
      "originalTitle": "Inception",
      "originalYear": 2010,
      "matchCandidates": [
        {
          "tmdbId": 27205,
          "tmdbType": "movie",
          "title": "Inception",
          "year": 2010,
          "posterPath": "/path/to/poster.jpg",
          "confidence": 0.98
        }
      ],
      "suggestedStatus": "completed",
      "rating": 9,
      "hasExistingEntry": false,
      "shouldSkip": false,
      "error": null
    }
  ],
  "count": 1
}
```

### POST /watchlist/import/confirm

**Description**: Execute import with duplicate resolutions

**Request**:
```json
{
  "items": [...], // NormalizedPreviewItem array
  "resolutions": [
    {
      "itemIndex": 0,
      "strategy": "skip|overwrite|merge",
      "mergeFields": {
        "status": true,
        "rating": false,
        "notes": "append|replace|keep",
        "streamingProviders": "merge|replace|keep"
      }
    }
  ],
  "skipUnmatched": false,
  "defaultDuplicateStrategy": "skip"
}
```

**Response**:
```json
{
  "message": "Import completed successfully",
  "data": {
    "imported": 5,
    "skipped": 2,
    "failed": 0,
    "merged": 1,
    "overwritten": 0,
    "errors": []
  }
}
```

### GET /watchlist/export

**Description**: Export watchlist data in specified format

**Request**:
- Method: GET
- Query Parameter: format (csv|json)

**Response**:
- CSV: Content-Type: text/csv with downloadable file
- JSON: Content-Type: application/json with downloadable file

## File Formats

### CSV Import Format

Required columns:
- `title` (string, required)
- `year` (number, optional)
- `status` (string, optional) - "not_watched", "watching", "completed"
- `rating` (number, optional) - 0-10 scale
- `notes` (string, optional)
- `dateAdded` (string, optional) - ISO 8601 format
- `streamingProviders` (string, optional) - Comma-separated or JSON array

Example:
```csv
title,year,status,rating,notes,dateAdded,streamingProviders
Inception,2010,completed,9,Amazing movie!,2024-01-15,"netflix,hulu"
The Matrix,1999,watching,8,"Classic sci-fi",2024-01-16,netflix
```

### JSON Import Format

Array of objects with the same fields as CSV:

```json
[
  {
    "title": "Inception",
    "year": 2010,
    "status": "completed",
    "rating": 9,
    "notes": "Amazing movie!",
    "dateAdded": "2024-01-15T00:00:00.000Z",
    "streamingProviders": ["netflix", "hulu"]
  }
]
```

### Export Formats

Both CSV and JSON exports include:
- Title, year, type (movie/tv)
- Watch status, rating, notes
- Date added, date watched
- Streaming providers, TMDB ID, poster path

## Duplicate Resolution Strategies

### Skip
- Keeps existing entry unchanged
- Ignores imported data for that item

### Overwrite
- Replaces existing entry completely with imported data
- All fields are updated to match import

### Merge
- Combines existing and imported data
- Selective field updates via mergeFields configuration:
  - `status`: Update watch status
  - `rating`: Update rating
  - `notes`: "append" (add to existing), "replace" (replace), "keep" (existing)
  - `streamingProviders`: "merge" (combine), "replace" (replace), "keep" (existing)

## TMDB Integration

- Automatic TMDB search for each imported item
- Confidence scoring based on:
  - Title similarity (up to 0.5 points)
  - Year match (up to 0.3 points)
  - Poster availability (0.05 points)
  - Popularity bonus for high-confidence matches (0.15 points)
- Multiple match candidates returned sorted by confidence
- Minimum confidence threshold of 0.3 for inclusion

## Error Handling

### File Upload Errors
- Unsupported file format
- File size exceeds 10MB limit
- Invalid CSV/JSON structure

### Import Errors
- TMDB API failures (graceful degradation)
- Validation errors for individual items
- Database constraint violations

### Export Errors
- Empty watchlist
- Database query failures
- File generation errors

## Rate Limits

- TMDB API: 40 requests per 10 seconds
- File uploads: 10MB size limit
- Import preview: Limited by TMDB rate limits

## Client Integration

### Web Client
- Drag & drop file upload
- Real-time preview with match selection
- Interactive duplicate resolution
- Export format selection and download

### Mobile Client
- Document picker integration
- Modal-based preview and resolution
- Share integration for exports
- Offline file handling

## Testing

Comprehensive test coverage includes:
- File parsing validation
- TMDB integration mocking
- Duplicate resolution scenarios
- Export format validation
- Error handling paths
- Authentication requirements
- Rate limiting behavior

## Security Considerations

- File type validation
- File size limits
- Authentication required for all endpoints
- User data isolation
- Input sanitization
- TMDB API key protection