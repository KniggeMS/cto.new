# Family Sharing Feature

## Overview
The family sharing feature allows users to create family groups, invite members, and share watchlists and recommendations.

## Features Implemented

### 1. Family Dashboard (`/family`)
- Lists all families the user is a member of
- Create new family groups
- Click to navigate to individual family detail pages
- Shows member count and creation info for each family

### 2. Family Detail Page (`/family/[id]`)
Comprehensive dashboard with multiple tabs:

#### Overview Tab
- Family statistics (members, pending invites, watchlist items, recommendations)
- Quick stats and recent activity

#### Shared Watchlist Tab
- View combined watchlist from all family members
- Filter by member
- Filter by status (not_watched, watching, completed)
- Shows who added each item
- Displays media posters, descriptions, genres, and ratings

#### Recommendations Tab
- View all recommendations shared between family members
- Shows from/to users
- Displays recommendation status (pending, accepted, rejected)
- Shows personal messages attached to recommendations
- Media details with posters and genres

#### Members Tab
- Lists all family members with roles (owner, admin, member)
- Owner can remove members (except themselves)
- Shows role badges and user information
- Identifies current user

#### Invitations Tab (Admin/Owner only)
- View pending and past invitations
- Resend expired or pending invitations
- Shows invitation status and expiry dates
- Separates pending from historical invitations

### 3. Invite Management
- Email-based invitations
- Shareable invitation links with tokens
- 7-day expiry on invitations
- Copy-to-clipboard functionality for invite links
- Email validation before sending

### 4. Permission System
- **Owner**: Can remove members, invite members, manage invitations
- **Admin**: Can invite members, manage invitations
- **Member**: Can view shared content, cannot manage users

## API Endpoints Created

### Backend (apps/api/src/routes/family.ts)
- `GET /family/:id/invitations` - Get all invitations for a family (admin/owner)
- `POST /family/:id/invitations/:invitationId/resend` - Resend an invitation (admin/owner)
- `DELETE /family/:id/members/:memberId` - Remove a member (owner only)
- `GET /family/:id/recommendations` - Get family recommendations

## Components

### Family Components (apps/web/src/components/family/)
1. **InviteModal.tsx** - Modal for inviting members via email
2. **MembersList.tsx** - Display and manage family members
3. **InvitationsList.tsx** - Display and manage invitations
4. **SharedWatchlist.tsx** - Display combined family watchlist with filters
5. **RecommendationsFeed.tsx** - Display family recommendations

## Tests

### Component Tests
- `InviteModal.test.tsx` - Tests invite form, validation, and shareable links
- `MembersList.test.tsx` - Tests member display, role badges, and removal
- `InvitationsList.test.tsx` - Tests invitation display, status badges, and resend
- `SharedWatchlist.test.tsx` - Tests filtering, member display, and watchlist rendering
- `RecommendationsFeed.test.tsx` - Tests recommendation display and status badges
- `page.test.tsx` - Integration tests for family detail page

### Test Coverage
- Invite submission and validation
- Shared list rendering and filtering
- Member management (add/remove)
- Permission-based UI rendering
- Loading and error states
- Tab navigation

## Usage

### Creating a Family
1. Navigate to `/family`
2. Click "Create Family"
3. Enter family name
4. Submit form

### Inviting Members
1. Navigate to family detail page
2. Click "Invite Member"
3. Enter email address
4. Copy shareable link or send email
5. Share link with invitee

### Managing Members
1. Go to Members tab
2. View all family members with roles
3. Click "Remove" to remove a member (owner only)

### Viewing Shared Content
1. **Watchlist**: Go to Shared Watchlist tab, apply filters as needed
2. **Recommendations**: Go to Recommendations tab to see what family members recommend

## Database Schema
Uses existing Prisma models:
- `Family` - Family groups
- `FamilyMembership` - User membership with roles
- `FamilyInvitation` - Token-based invitations
- `Recommendation` - User-to-user recommendations
- `WatchlistEntry` - Media watchlist entries

## Error Handling
- Email validation before sending invites
- Confirmation dialog before removing members
- Toast notifications for success/error states
- User-friendly error messages
- Network error handling with retry capability

## Future Enhancements
- Bulk invite functionality
- Family-wide notifications
- Collaborative watchlist editing
- Family activity feed
- Direct recommendation responses from feed
