# Recommendations API Documentation

## Overview

The Recommendations API provides personalized media suggestions to users based on their family members' watchlists. The system analyzes what family members have watched and enjoyed, then recommends items the user hasn't seen yet.

## Features

- **Intelligent Scoring Algorithm**: Combines family ratings, popularity, and TMDB metadata
- **Smart Filtering**: Excludes items already in user's watchlist
- **Performance Caching**: 15-minute in-memory cache for recommendations
- **Family Isolation**: Recommendations only come from user's families
- **Flexible Querying**: Support for family-specific and cross-family recommendations

## Endpoints

### GET /recommendations

Get personalized recommendations for the authenticated user.

**Authentication**: Required (Bearer token)

#### Query Parameters

| Parameter | Type    | Required | Description                                           |
| --------- | ------- | -------- | ----------------------------------------------------- |
| familyId  | string  | No       | Filter recommendations to a specific family           |
| limit     | number  | No       | Maximum number of recommendations to return           |
| refresh   | boolean | No       | Set to `true` to bypass cache and fetch fresh results |

#### Response

```json
{
  "data": [
    {
      "mediaItem": {
        "id": "clxyz123...",
        "tmdbId": 12345,
        "tmdbType": "movie",
        "title": "The Great Movie",
        "description": "An amazing film...",
        "posterPath": "/path/to/poster.jpg",
        "backdropPath": "/path/to/backdrop.jpg",
        "releaseDate": "2023-01-15T00:00:00.000Z",
        "rating": 8.5,
        "genres": ["Action", "Drama"],
        "creators": ["Director Name"],
        "streamingProviders": [
          {
            "provider": "netflix",
            "url": "https://netflix.com/...",
            "regions": ["US", "CA"]
          }
        ]
      },
      "score": 45.25,
      "metadata": {
        "familyAvgRating": 9.0,
        "familyWatchCount": 3,
        "tmdbRating": 8.5,
        "watchedBy": [
          {
            "userId": "clusr123...",
            "userName": "John Doe",
            "rating": 9,
            "status": "completed"
          },
          {
            "userId": "clusr456...",
            "userName": "Jane Smith",
            "rating": 10,
            "status": "completed"
          }
        ]
      }
    }
  ],
  "count": 15,
  "userId": "clusr789...",
  "familyId": "clfam123..." // Only present when familyId filter is used
}
```

#### Status Codes

- **200 OK**: Recommendations retrieved successfully
- **400 Bad Request**: Invalid query parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: User is not a member of the specified family

#### Examples

**Get all recommendations**:

```bash
curl -X GET http://localhost:3001/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get recommendations from specific family**:

```bash
curl -X GET "http://localhost:3001/recommendations?familyId=clfam123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get top 5 recommendations with fresh data**:

```bash
curl -X GET "http://localhost:3001/recommendations?limit=5&refresh=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST /recommendations/clear-cache

Clear the recommendation cache for the authenticated user.

**Authentication**: Required (Bearer token)

#### Request Body

```json
{
  "familyId": "clfam123..." // Optional: clear cache for specific family
}
```

#### Response

```json
{
  "message": "Cache cleared successfully"
}
```

#### Status Codes

- **200 OK**: Cache cleared successfully
- **400 Bad Request**: Invalid familyId parameter
- **401 Unauthorized**: Authentication required

#### Example

```bash
curl -X POST http://localhost:3001/recommendations/clear-cache \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"familyId": "clfam123..."}'
```

## Scoring Algorithm

The recommendation system uses a weighted scoring algorithm to rank media items:

### Formula

```
score = (familyAvgRating × 3) + (familyPopularity × 2) + (tmdbRating ÷ 2) + avgStatusWeight
```

### Components

1. **Family Average Rating** (Weight: 3)
   - Average of all ratings given by family members who watched the item
   - Scale: 0-10
   - Highest weight because family opinions matter most

2. **Family Popularity** (Weight: 2)
   - Number of family members who have the item in their watchlist
   - Indicates consensus within the family

3. **TMDB Rating** (Weight: 0.5)
   - Professional/public rating from The Movie Database
   - Scale: 0-10
   - Lower weight as family preferences are more personalized

4. **Status Weight**
   - Reflects how engaged family members are with the content
   - Values:
     - `completed`: 2 points (fully watched, strong signal)
     - `watching`: 1 point (currently engaging)
     - `not_watched`: 0 points (planned but not started)

### Example Calculation

For "The Great Movie" watched by 3 family members:

- Family ratings: [9, 8, 10] → avg = 9.0
- Family watch count: 3
- TMDB rating: 8.5
- Statuses: [completed, completed, completed] → avg weight = 2.0

```
score = (9.0 × 3) + (3 × 2) + (8.5 ÷ 2) + 2.0
      = 27.0 + 6.0 + 4.25 + 2.0
      = 39.25
```

## Filtering Rules

### Included Items

- Media items in watchlists of users who share at least one family with the requesting user
- Items with any watch status (not_watched, watching, completed)
- Items with or without ratings

### Excluded Items

- Items already in the requesting user's watchlist (any status)
- Items from users not in any shared family
- Duplicate entries (same media item counted once per unique family member)

## Caching Behavior

### Cache Strategy

- **Type**: In-memory cache with per-user/family keys
- **TTL**: 15 minutes
- **Key Format**: `{userId}:{familyId?}`
- **Invalidation**: Automatic after TTL, or manual via clear-cache endpoint

### Cache Keys

- User-wide recommendations: `userId`
- Family-specific recommendations: `userId:familyId`

### When to Refresh

The cache should be refreshed when:

- A family member adds a new watchlist entry
- A family member updates ratings
- A user joins or leaves a family
- Real-time accuracy is needed (use `refresh=true`)

### Performance Benefits

- Reduces database queries by ~95% for repeat requests
- Sub-millisecond response time for cached results
- Automatic cleanup prevents memory bloat

## Use Cases

### Typical Workflows

#### 1. Movie Night Planning

```
1. User opens app
2. GET /recommendations?limit=10
3. View top 10 recommendations with family ratings
4. Add selected movie to watchlist
5. Watch and rate the movie
```

#### 2. Family-Specific Discovery

```
1. User has multiple families
2. GET /recommendations?familyId=clfam123&limit=20
3. See what immediate family recommends
4. Switch to another family
5. GET /recommendations?familyId=clfam456&limit=20
```

#### 3. Post-Watch Updates

```
1. User completes a movie and rates it
2. POST /recommendations/clear-cache
3. Other family members' recommendations refresh
4. They see updated ratings in their recommendations
```

## Integration Examples

### React/Frontend Integration

```javascript
// Fetch recommendations
async function getRecommendations(familyId, limit = 20) {
  const queryParams = new URLSearchParams();
  if (familyId) queryParams.append('familyId', familyId);
  if (limit) queryParams.append('limit', limit.toString());

  const response = await fetch(`http://localhost:3001/recommendations?${queryParams}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

// Clear cache after user action
async function clearRecommendationsCache(familyId) {
  await fetch('http://localhost:3001/recommendations/clear-cache', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ familyId }),
  });
}
```

### Node.js Backend Integration

```javascript
const axios = require('axios');

// Get recommendations for a user
async function getUserRecommendations(userId, accessToken, options = {}) {
  const { familyId, limit, refresh } = options;

  const response = await axios.get('http://localhost:3001/recommendations', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      familyId,
      limit,
      refresh,
    },
  });

  return response.data;
}

// Clear cache after watchlist update
async function invalidateRecommendations(userId, accessToken, familyId) {
  await axios.post(
    'http://localhost:3001/recommendations/clear-cache',
    { familyId },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );
}
```

## Best Practices

### For API Consumers

1. **Use Caching Wisely**: Don't set `refresh=true` on every request
2. **Set Reasonable Limits**: Default to 20-50 recommendations for pagination
3. **Clear Cache Strategically**: Only after actions that affect recommendations
4. **Handle Empty Results**: Users with no families will get empty arrays
5. **Show Metadata**: Display who watched each item and their ratings

### For Backend Development

1. **Monitor Cache Hit Rate**: Should be >90% in production
2. **Consider Cache Warming**: Pre-populate cache for active users
3. **Add Analytics**: Track which recommendations users act on
4. **Extend Scoring**: Add user preference matching in future iterations
5. **Database Indexing**: Ensure watchlist queries are optimized

## Troubleshooting

### Common Issues

#### No Recommendations Returned

**Possible Causes**:

- User is not in any families
- Family members haven't added any watchlist items
- All family items are already in user's watchlist

**Solution**: Check family memberships and watchlist entries

#### Stale Recommendations

**Possible Causes**:

- Cache hasn't expired yet
- Cache wasn't cleared after watchlist update

**Solution**: Use `refresh=true` or call clear-cache endpoint

#### Unexpected Rankings

**Possible Causes**:

- Understanding of scoring algorithm
- Missing TMDB ratings affecting scores

**Solution**: Review metadata field to understand score components

## Future Enhancements

Potential improvements for future versions:

1. **Genre Matching**: Boost scores for genres user prefers
2. **Collaborative Filtering**: Use ML to find similar taste profiles
3. **Time-Based Weighting**: Prioritize recently watched items
4. **Mood/Context**: Filter by runtime, mood tags, or time of day
5. **Persistent Cache**: Redis for distributed systems
6. **Real-Time Updates**: WebSocket notifications for new recommendations
7. **A/B Testing**: Experiment with different scoring weights

## Related Documentation

- [Family API Documentation](./family-api.md)
- [Watchlist API Documentation](./WATCHLIST_API.md)
- [OpenAPI Specification](./openapi.yaml)
