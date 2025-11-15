# Watchlist API Documentation

The Watchlist API provides endpoints for managing a user's media watchlist, allowing them to track movies and TV shows they want to watch, are currently watching, or have completed.

## Authentication

All watchlist endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Get User's Watchlist

Retrieves all watchlist entries for the authenticated user with optional filtering and sorting.

**Endpoint:** `GET /watchlist`

**Query Parameters:**

- `status` (optional): Filter by watch status (`not_watched`, `watching`, `completed`)
- `sortBy` (optional): Field to sort by (`dateAdded`, `dateUpdated`, `status`, `rating`). Default: `dateAdded`
- `order` (optional): Sort order (`asc`, `desc`). Default: `desc`

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "clx123abc456",
      "userId": "clx123abc456",
      "mediaItemId": "clx123abc456",
      "status": "watching",
      "rating": 4,
      "notes": "Great movie!",
      "dateAdded": "2024-01-15T10:30:00.000Z",
      "dateUpdated": "2024-01-15T10:30:00.000Z",
      "mediaItem": {
        "id": "clx123abc456",
        "tmdbId": 550,
        "tmdbType": "movie",
        "title": "Fight Club",
        "description": "An insomniac office worker...",
        "posterPath": "/p64JHd3bGjH8qSEp0gyS1BFrP4V.jpg",
        "backdropPath": "/a0JqB5VHx7q0D8dj4qcpFSMiR8e.jpg",
        "releaseDate": "1999-10-15T00:00:00.000Z",
        "rating": 8.8,
        "genres": ["Drama", "Thriller"],
        "creators": ["David Fincher"],
        "streamingProviders": [
          {
            "id": "clx123abc456",
            "provider": "netflix",
            "url": "https://www.netflix.com/title/550",
            "regions": ["US", "CA", "GB"]
          }
        ]
      }
    }
  ],
  "count": 1
}
```

**Example Requests:**

```bash
# Get all entries
curl -H "Authorization: Bearer <token>" http://localhost:3001/watchlist

# Get only watching entries
curl -H "Authorization: Bearer <token>" "http://localhost:3001/watchlist?status=watching"

# Get completed entries sorted by rating
curl -H "Authorization: Bearer <token>" "http://localhost:3001/watchlist?status=completed&sortBy=rating&order=desc"
```

---

### 2. Get Watchlist Statistics

Returns aggregated counts of watchlist entries by status.

**Endpoint:** `GET /watchlist/stats`

**Response:** `200 OK`

```json
{
  "total": 25,
  "not_watched": 10,
  "watching": 5,
  "completed": 10
}
```

**Example Request:**

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/watchlist/stats
```

---

### 3. Add to Watchlist

Adds a media item to the user's watchlist. If the media item doesn't exist in the database, it will be created using the provided metadata.

**Endpoint:** `POST /watchlist`

**Request Body:**

```json
{
  "tmdbId": 550,
  "tmdbType": "movie",
  "status": "not_watched",
  "rating": 4,
  "notes": "Great movie!",
  "metadata": {
    "title": "Fight Club",
    "description": "An insomniac office worker...",
    "posterPath": "/p64JHd3bGjH8qSEp0gyS1BFrP4V.jpg",
    "backdropPath": "/a0JqB5VHx7q0D8dj4qcpFSMiR8e.jpg",
    "releaseDate": "1999-10-15",
    "rating": 8.8,
    "genres": ["Drama", "Thriller"],
    "creators": ["David Fincher"],
    "streamingProviders": [
      {
        "provider": "netflix",
        "url": "https://www.netflix.com/title/550",
        "regions": ["US", "CA"]
      }
    ]
  }
}
```

**Required Fields:**

- `tmdbId`: TMDB ID of the media item (positive integer)
- `tmdbType`: Type of media (`movie` or `tv`)

**Optional Fields:**

- `status`: Watch status (`not_watched`, `watching`, `completed`). Default: `not_watched`
- `rating`: Personal rating (0-5 stars, nullable)
- `notes`: Personal notes (nullable)
- `metadata`: Metadata for creating the media item if it doesn't exist
  - `title`: Required if media item doesn't exist
  - `description`, `posterPath`, `backdropPath`, `releaseDate`, `rating`, `genres`, `creators`, `streamingProviders`: All optional

**Response:** `201 Created`

```json
{
  "message": "Added to watchlist successfully",
  "data": {
    "id": "clx123abc456",
    "userId": "clx123abc456",
    "mediaItemId": "clx123abc456",
    "status": "not_watched",
    "rating": 4,
    "notes": "Great movie!",
    "dateAdded": "2024-01-15T10:30:00.000Z",
    "dateUpdated": "2024-01-15T10:30:00.000Z",
    "mediaItem": { ... }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Validation error or media item not found without metadata
- `409 Conflict`: Media item already in watchlist
- `401 Unauthorized`: Authentication required

**Example Request:**

```bash
curl -X POST http://localhost:3001/watchlist \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbId": 550,
    "tmdbType": "movie",
    "status": "not_watched",
    "metadata": {
      "title": "Fight Club",
      "genres": ["Drama", "Thriller"]
    }
  }'
```

---

### 4. Update Watchlist Entry

Updates an existing watchlist entry. Only the owner can update their entries.

**Endpoint:** `PATCH /watchlist/:id`

**URL Parameters:**

- `id`: Watchlist entry ID

**Request Body:** (all fields optional, but at least one must be provided)

```json
{
  "status": "completed",
  "rating": 5,
  "notes": "Updated notes"
}
```

**Response:** `200 OK`

```json
{
  "message": "Watchlist entry updated successfully",
  "data": {
    "id": "clx123abc456",
    "userId": "clx123abc456",
    "mediaItemId": "clx123abc456",
    "status": "completed",
    "rating": 5,
    "notes": "Updated notes",
    "dateAdded": "2024-01-15T10:30:00.000Z",
    "dateUpdated": "2024-01-15T11:00:00.000Z",
    "mediaItem": { ... }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Validation error
- `403 Forbidden`: Not authorized to update this entry
- `404 Not Found`: Entry not found
- `401 Unauthorized`: Authentication required

**Example Request:**

```bash
curl -X PATCH http://localhost:3001/watchlist/clx123abc456 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "rating": 5
  }'
```

---

### 5. Update Watch Progress

Dedicated endpoint for updating watch progress. Requires status to be provided, making it explicit that the user is updating their progress.

**Endpoint:** `PATCH /watchlist/:id/progress`

**URL Parameters:**

- `id`: Watchlist entry ID

**Request Body:**

```json
{
  "status": "completed",
  "rating": 5
}
```

**Required Fields:**

- `status`: Watch status (`not_watched`, `watching`, `completed`)

**Optional Fields:**

- `rating`: Personal rating (0-5 stars, nullable)

**Response:** `200 OK`

```json
{
  "message": "Watch progress updated successfully",
  "data": {
    "id": "clx123abc456",
    "status": "completed",
    "rating": 5,
    ...
  }
}
```

**Error Responses:**

- `400 Bad Request`: Validation error (e.g., missing status)
- `403 Forbidden`: Not authorized to update this entry
- `404 Not Found`: Entry not found
- `401 Unauthorized`: Authentication required

**Example Request:**

```bash
curl -X PATCH http://localhost:3001/watchlist/clx123abc456/progress \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "watching"
  }'
```

---

### 6. Delete Watchlist Entry

Removes an entry from the watchlist. Only the owner can delete their entries.

**Endpoint:** `DELETE /watchlist/:id`

**URL Parameters:**

- `id`: Watchlist entry ID

**Response:** `200 OK`

```json
{
  "message": "Watchlist entry deleted successfully"
}
```

**Error Responses:**

- `403 Forbidden`: Not authorized to delete this entry
- `404 Not Found`: Entry not found
- `401 Unauthorized`: Authentication required

**Example Request:**

```bash
curl -X DELETE http://localhost:3001/watchlist/clx123abc456 \
  -H "Authorization: Bearer <token>"
```

---

## Business Rules

### Watch Status

The watchlist supports three status values:

- `not_watched`: Media item is in the watchlist but not yet started
- `watching`: Currently watching/in progress
- `completed`: Finished watching

Status transitions are flexible - users can move between any states. For example:

- `not_watched` → `watching` → `completed` (typical flow)
- `not_watched` → `completed` (direct completion)
- `completed` → `watching` (rewatching)

### Rating

- Rating is optional and can be set to any integer from 0 to 5 (inclusive)
- Rating can be set to `null` to remove it
- Rating is typically set when status is `completed`, but can be set at any time

### Notes

- Notes are optional text fields for personal comments
- Can be set to `null` to remove notes
- Maximum length is not enforced at the API level (database allows unlimited text)

### Media Item Management

- Media items are shared across all users (referenced by TMDB ID)
- When adding to watchlist, if the media item doesn't exist:
  - If metadata is provided, a new media item is created
  - If metadata is missing, a 400 error is returned
- When a media item already exists, it's reused
- Deleting a watchlist entry does NOT delete the media item (cascade protection)

### Ownership and Security

- Users can only view, update, and delete their own watchlist entries
- Attempting to modify another user's entry returns a 403 Forbidden error
- All endpoints require authentication

### Streaming Providers

- Streaming providers are optionally associated with media items
- When creating a media item with streaming providers, they are automatically linked
- Existing streaming providers are updated if the same provider is provided again
- Multiple streaming providers can be associated with a single media item

---

## Complete Example Workflow

```bash
# 1. Register and get access token
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
# Save the accessToken from the response

# 2. Add a movie to watchlist
curl -X POST http://localhost:3001/watchlist \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbId": 550,
    "tmdbType": "movie",
    "status": "not_watched",
    "metadata": {
      "title": "Fight Club",
      "description": "An insomniac office worker...",
      "genres": ["Drama", "Thriller"],
      "creators": ["David Fincher"]
    }
  }'
# Save the entry id from the response

# 3. Update status to watching
curl -X PATCH http://localhost:3001/watchlist/<entry_id>/progress \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "watching"
  }'

# 4. Mark as completed with rating
curl -X PATCH http://localhost:3001/watchlist/<entry_id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "rating": 5,
    "notes": "Amazing movie! A masterpiece."
  }'

# 5. Get watchlist
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/watchlist

# 6. Get stats
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/watchlist/stats

# 7. Delete entry
curl -X DELETE http://localhost:3001/watchlist/<entry_id> \
  -H "Authorization: Bearer <token>"
```

---

## Error Handling

All endpoints follow consistent error response formats:

### Validation Error (400)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 0,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "Number must be greater than or equal to 0",
      "path": ["rating"]
    }
  ]
}
```

### Authentication Error (401)

```json
{
  "error": "Access token required"
}
```

### Authorization Error (403)

```json
{
  "error": "You do not have permission to update this entry"
}
```

### Not Found Error (404)

```json
{
  "error": "Watchlist entry not found"
}
```

### Conflict Error (409)

```json
{
  "error": "This media item is already in your watchlist",
  "entryId": "clx123abc456"
}
```

---

## Data Models

### WatchlistEntry

```typescript
{
  id: string; // CUID
  userId: string; // User who owns this entry
  mediaItemId: string; // Reference to MediaItem
  status: 'not_watched' | 'watching' | 'completed';
  rating: number | null; // 0-5 stars
  notes: string | null;
  dateAdded: Date;
  dateUpdated: Date;
  mediaItem: MediaItem; // Populated in responses
}
```

### MediaItem

```typescript
{
  id: string;           // CUID
  tmdbId: number;       // Unique TMDB identifier
  tmdbType: 'movie' | 'tv';
  title: string;
  description: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: Date | null;
  rating: number | null;  // TMDB rating
  genres: string[];
  creators: string[];
  streamingProviders: StreamingProvider[];
}
```

### StreamingProvider

```typescript
{
  id: string;           // CUID
  mediaItemId: string;
  provider: string;     // e.g., "netflix", "hulu", "prime"
  url: string | null;   // Direct link to content
  regions: string[];    // Array of region codes (e.g., ["US", "CA", "GB"])
  addedAt: Date;
}
```
