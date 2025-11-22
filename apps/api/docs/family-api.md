# Family Sharing API Documentation

The Family Sharing API enables users to create family groups, invite members, manage roles, and view shared watchlists across family members.

## Overview

### Key Features

- **Family Creation**: Users can create family groups
- **Member Invitations**: Invite members via email with time-limited tokens (7-day expiration)
- **Role-Based Permissions**: Support for owner, admin, and member roles
- **Shared Watchlists**: View aggregated watchlist entries from all family members
- **Permission Management**: Owners can manage member roles and permissions

### Core Concepts

- **Family**: A group of users who can share media tracking and recommendations
- **Membership**: A user's membership in a family with an assigned role
- **Invitation**: A time-limited token-based invitation to join a family
- **Role Hierarchy**:
  - **Owner**: Full permissions (create family, manage members, accept invitations)
  - **Admin**: Can invite members and manage content
  - **Member**: Can view shared watchlists and manage own entries

## API Endpoints

### 1. Create Family

**Endpoint:** `POST /families`

**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "name": "My Family"
}
```

**Parameters:**

- `name` (string, required): Family name (1-100 characters)

**Response (201 Created):**

```json
{
  "message": "Family created successfully",
  "data": {
    "id": "clx123abc456",
    "name": "My Family",
    "createdBy": "clx123user001",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "members": [
      {
        "id": "clx123membership001",
        "userId": "clx123user001",
        "familyId": "clx123abc456",
        "role": "owner",
        "joinedAt": "2024-01-15T10:30:00Z",
        "user": {
          "id": "clx123user001",
          "email": "owner@example.com",
          "name": "John Doe"
        }
      }
    ],
    "creator": {
      "id": "clx123user001",
      "email": "owner@example.com",
      "name": "John Doe"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid family name
- `401 Unauthorized`: Missing or invalid access token

---

### 2. Invite Member to Family

**Endpoint:** `POST /families/:id/invite`

**Authentication:** Required (Bearer token, must be owner or admin)

**URL Parameters:**

- `id` (string, required): Family ID

**Request Body:**

```json
{
  "email": "newmember@example.com"
}
```

**Parameters:**

- `email` (string, required): Email of person to invite

**Response (201 Created):**

```json
{
  "message": "Invitation sent successfully",
  "data": {
    "id": "clx123invitation001",
    "familyId": "clx123abc456",
    "email": "newmember@example.com",
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "status": "pending",
    "expiresAt": "2024-01-22T10:30:00Z",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid email format
- `403 Forbidden`: User is not a member or doesn't have admin/owner role
- `404 Not Found`: Family not found
- `409 Conflict`: User is already a member

**Notes:**

- Users with the "admin" or "owner" role can send invitations
- If an invitation already exists for this email, it will be regenerated
- Invitations expire after 7 days
- The token is included in the response for testing purposes; in production, this would typically be sent to the user's email

---

### 3. Accept Family Invitation

**Endpoint:** `POST /families/:id/invitations/:token/accept`

**Authentication:** Required (Bearer token)

**URL Parameters:**

- `id` (string, required): Family ID
- `token` (string, required): Invitation token

**Response (200 OK):**

```json
{
  "message": "Invitation accepted successfully",
  "data": {
    "id": "clx123membership002",
    "userId": "clx123user002",
    "familyId": "clx123abc456",
    "role": "member",
    "joinedAt": "2024-01-15T10:35:00Z",
    "user": {
      "id": "clx123user002",
      "email": "newmember@example.com",
      "name": "Jane Doe"
    }
  }
}
```

**Error Responses:**

- `404 Not Found`: Invitation not found or already processed
- `409 Conflict`: User is already a member of the family
- `410 Gone`: Invitation has expired
- `401 Unauthorized`: Missing or invalid access token

**Notes:**

- User accepting must match the email on the invitation
- Accepted members are added with the "member" role
- The invitation status is marked as "accepted" with a timestamp

---

### 4. Get Family Details

**Endpoint:** `GET /families/:id`

**Authentication:** Required (Bearer token, must be a family member)

**URL Parameters:**

- `id` (string, required): Family ID

**Response (200 OK):**

```json
{
  "data": {
    "id": "clx123abc456",
    "name": "My Family",
    "createdBy": "clx123user001",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "members": [
      {
        "id": "clx123membership001",
        "userId": "clx123user001",
        "familyId": "clx123abc456",
        "role": "owner",
        "joinedAt": "2024-01-15T10:30:00Z",
        "user": {
          "id": "clx123user001",
          "email": "owner@example.com",
          "name": "John Doe"
        }
      },
      {
        "id": "clx123membership002",
        "userId": "clx123user002",
        "familyId": "clx123abc456",
        "role": "member",
        "joinedAt": "2024-01-15T10:35:00Z",
        "user": {
          "id": "clx123user002",
          "email": "member@example.com",
          "name": "Jane Doe"
        }
      }
    ],
    "creator": {
      "id": "clx123user001",
      "email": "owner@example.com",
      "name": "John Doe"
    }
  }
}
```

**Error Responses:**

- `403 Forbidden`: User is not a member of the family
- `404 Not Found`: Family not found

---

### 5. List Family Members

**Endpoint:** `GET /families/:id/members`

**Authentication:** Required (Bearer token, must be a family member)

**URL Parameters:**

- `id` (string, required): Family ID

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "clx123membership001",
      "userId": "clx123user001",
      "familyId": "clx123abc456",
      "role": "owner",
      "joinedAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": "clx123user001",
        "email": "owner@example.com",
        "name": "John Doe",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    },
    {
      "id": "clx123membership002",
      "userId": "clx123user002",
      "familyId": "clx123abc456",
      "role": "member",
      "joinedAt": "2024-01-15T10:35:00Z",
      "user": {
        "id": "clx123user002",
        "email": "member@example.com",
        "name": "Jane Doe",
        "createdAt": "2024-01-15T10:05:00Z"
      }
    }
  ],
  "count": 2
}
```

**Error Responses:**

- `403 Forbidden`: User is not a member of the family

---

### 6. Get Family Watchlists (Aggregated)

**Endpoint:** `GET /families/:id/watchlists`

**Authentication:** Required (Bearer token, must be a family member)

**URL Parameters:**

- `id` (string, required): Family ID

**Query Parameters:**

- `status` (string, optional): Filter by watch status (`not_watched`, `watching`, `completed`)
- `sortBy` (string, optional): Sort field (`dateAdded`, `dateUpdated`, `status`, `rating`). Default: `dateAdded`
- `order` (string, optional): Sort order (`asc` or `desc`). Default: `desc`

**Request Examples:**

```bash
# Get all family watchlist entries
GET /families/clx123abc456/watchlists

# Get only completed entries
GET /families/clx123abc456/watchlists?status=completed

# Sort by rating descending
GET /families/clx123abc456/watchlists?sortBy=rating&order=desc

# Get watching entries sorted by date added ascending
GET /families/clx123abc456/watchlists?status=watching&sortBy=dateAdded&order=asc
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "clx123entry001",
      "userId": "clx123user001",
      "mediaItemId": "clx123media001",
      "status": "completed",
      "rating": 5,
      "notes": "Great movie!",
      "dateAdded": "2024-01-14T15:30:00Z",
      "dateUpdated": "2024-01-15T09:00:00Z",
      "user": {
        "id": "clx123user001",
        "email": "owner@example.com",
        "name": "John Doe"
      },
      "mediaItem": {
        "id": "clx123media001",
        "tmdbId": 550,
        "tmdbType": "movie",
        "title": "Fight Club",
        "description": "An underground fight club",
        "posterPath": "/path/to/poster.jpg",
        "backdropPath": "/path/to/backdrop.jpg",
        "releaseDate": "1999-10-15T00:00:00Z",
        "rating": 8.8,
        "genres": ["Drama", "Thriller"],
        "creators": ["David Fincher"],
        "createdAt": "2024-01-10T00:00:00Z",
        "updatedAt": "2024-01-10T00:00:00Z",
        "streamingProviders": [
          {
            "id": "clx123provider001",
            "mediaItemId": "clx123media001",
            "provider": "netflix",
            "url": "https://www.netflix.com/...",
            "regions": ["US", "CA"],
            "addedAt": "2024-01-10T00:00:00Z"
          }
        ]
      }
    }
  ],
  "count": 1,
  "familyId": "clx123abc456"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid status filter
- `403 Forbidden`: User is not a member of the family

**Notes:**

- Returns watchlist entries from all family members
- Results include user information to show who added each entry
- Entries can be filtered by watch status
- Results are sorted by dateAdded (newest first) by default

---

### 7. Update Member Role

**Endpoint:** `PATCH /families/:id/members/:memberId`

**Authentication:** Required (Bearer token, must be family owner)

**URL Parameters:**

- `id` (string, required): Family ID
- `memberId` (string, required): User ID of member to update

**Request Body:**

```json
{
  "role": "admin"
}
```

**Parameters:**

- `role` (string, required): New role (`owner`, `admin`, or `member`)

**Response (200 OK):**

```json
{
  "message": "Member role updated successfully",
  "data": {
    "id": "clx123membership002",
    "userId": "clx123user002",
    "familyId": "clx123abc456",
    "role": "admin",
    "joinedAt": "2024-01-15T10:35:00Z",
    "user": {
      "id": "clx123user002",
      "email": "member@example.com",
      "name": "Jane Doe"
    }
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid role value or attempting to change owner role
- `403 Forbidden`: User is not the family owner
- `404 Not Found`: Member not found in the family

**Notes:**

- Only the family owner can update member roles
- The owner role cannot be changed (to prevent loss of family ownership)
- Promoted members can then invite other members (if role is admin)

---

### 8. List User's Families

**Endpoint:** `GET /families`

**Authentication:** Required (Bearer token)

**Query Parameters:**
None

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "clx123abc456",
      "name": "My Family",
      "createdBy": "clx123user001",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "members": [
        {
          "id": "clx123membership001",
          "userId": "clx123user001",
          "familyId": "clx123abc456",
          "role": "owner",
          "joinedAt": "2024-01-15T10:30:00Z",
          "user": {
            "id": "clx123user001",
            "email": "owner@example.com",
            "name": "John Doe"
          }
        }
      ],
      "creator": {
        "id": "clx123user001",
        "email": "owner@example.com",
        "name": "John Doe"
      }
    }
  ],
  "count": 1
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid access token

---

## Workflows

### Complete Invite Workflow

This workflow demonstrates the complete process of inviting and accepting a family invitation.

#### Step 1: User A Creates a Family

```bash
curl -X POST http://localhost:3001/families \
  -H "Authorization: Bearer USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smith Family"
  }'
```

**Response:**

```json
{
  "message": "Family created successfully",
  "data": {
    "id": "family_123",
    "name": "Smith Family",
    "members": [
      {
        "userId": "user_a_id",
        "role": "owner"
      }
    ]
  }
}
```

#### Step 2: User A Invites User B

```bash
curl -X POST http://localhost:3001/families/family_123/invite \
  -H "Authorization: Bearer USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "userb@example.com"
  }'
```

**Response:**

```json
{
  "message": "Invitation sent successfully",
  "data": {
    "id": "invite_123",
    "email": "userb@example.com",
    "token": "a1b2c3d4e5f6...",
    "status": "pending",
    "expiresAt": "2024-01-22T10:30:00Z"
  }
}
```

#### Step 3: User B Accepts the Invitation

User B receives the invite token (via email in production, returned in response for testing).

```bash
curl -X POST http://localhost:3001/families/family_123/invitations/a1b2c3d4e5f6.../accept \
  -H "Authorization: Bearer USER_B_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "message": "Invitation accepted successfully",
  "data": {
    "userId": "user_b_id",
    "familyId": "family_123",
    "role": "member",
    "joinedAt": "2024-01-15T10:35:00Z"
  }
}
```

#### Step 4: User B Can Now Access Family Resources

```bash
curl -X GET http://localhost:3001/families/family_123 \
  -H "Authorization: Bearer USER_B_TOKEN"
```

**Response:**

```json
{
  "data": {
    "id": "family_123",
    "name": "Smith Family",
    "members": [
      {
        "userId": "user_a_id",
        "role": "owner"
      },
      {
        "userId": "user_b_id",
        "role": "member"
      }
    ]
  }
}
```

---

## Permission Matrix

| Action                 | Owner | Admin | Member |
| ---------------------- | ----- | ----- | ------ |
| Create Family          | ✓     | ✗     | ✗      |
| Invite Members         | ✓     | ✓     | ✗      |
| Accept Invitations     | ✓     | ✓     | ✓      |
| View Family            | ✓     | ✓     | ✓      |
| List Members           | ✓     | ✓     | ✓      |
| View Shared Watchlists | ✓     | ✓     | ✓      |
| Update Member Roles    | ✓     | ✗     | ✗      |

---

## Error Handling

### Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource successfully created
- `400 Bad Request`: Invalid input or validation failed
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Authenticated but lacks permission
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `410 Gone`: Resource expired (e.g., expired invitation)
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00Z",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "number",
      "path": ["name"],
      "message": "Expected string, received number"
    }
  ]
}
```

---

## Rate Limiting

Currently, no rate limiting is applied. In production, consider implementing:

- Invitation rate limiting (max 10 per minute)
- Family creation limiting (max 5 per day)
- Watchlist query limiting

---

## Security Considerations

1. **Token Expiration**: Invitation tokens expire after 7 days
2. **Role-Based Access**: Permissions are enforced at the endpoint level
3. **Email Verification**: Invitations are email-specific (in production, send via email)
4. **Unique Constraints**: Prevents duplicate invitations and memberships
5. **Transaction Safety**: Multi-step operations use database transactions

---

## Testing

Run tests with:

```bash
npm test -- src/tests/family.test.ts
```

Tests cover:

- Family creation with validation
- Invitation lifecycle (create, accept, expire)
- Permission checks for all endpoints
- Aggregated watchlist retrieval
- Member role management
- Error scenarios
