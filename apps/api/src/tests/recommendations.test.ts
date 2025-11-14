import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';
import { clearCache } from '../services/recommendationService';

const prisma = new PrismaClient();

describe('Recommendations Endpoints', () => {
  let user1Id: string;
  let user2Id: string;
  let user3Id: string;
  let user4Id: string;
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  let user4Token: string;
  let familyId: string;
  let family2Id: string;
  let mediaItem1Id: string;
  let mediaItem2Id: string;
  let mediaItem3Id: string;
  let mediaItem4Id: string;

  beforeAll(async () => {
    // Clear cache before tests
    clearCache();

    // Register four test users
    const registerUser1 = await request(app).post('/auth/register').send({
      email: 'rec1@example.com',
      password: 'password123',
      name: 'Rec User 1',
    });

    const registerUser2 = await request(app).post('/auth/register').send({
      email: 'rec2@example.com',
      password: 'password123',
      name: 'Rec User 2',
    });

    const registerUser3 = await request(app).post('/auth/register').send({
      email: 'rec3@example.com',
      password: 'password123',
      name: 'Rec User 3',
    });

    const registerUser4 = await request(app).post('/auth/register').send({
      email: 'rec4@example.com',
      password: 'password123',
      name: 'Rec User 4',
    });

    user1Id = registerUser1.body.user.id;
    user1Token = registerUser1.body.accessToken;
    user2Id = registerUser2.body.user.id;
    user2Token = registerUser2.body.accessToken;
    user3Id = registerUser3.body.user.id;
    user3Token = registerUser3.body.accessToken;
    user4Id = registerUser4.body.user.id;
    user4Token = registerUser4.body.accessToken;

    // Create a family and add members
    const familyResponse = await request(app)
      .post('/families')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'Test Family' });
    familyId = familyResponse.body.data.id;

    // Create second family for isolation tests
    const family2Response = await request(app)
      .post('/families')
      .set('Authorization', `Bearer ${user4Token}`)
      .send({ name: 'Test Family 2' });
    family2Id = family2Response.body.data.id;

    // Invite and accept for user2 and user3 to family 1
    const invite2 = await request(app)
      .post(`/families/${familyId}/invite`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ email: 'rec2@example.com' });

    await request(app)
      .post(`/families/${familyId}/invitations/${invite2.body.data.token}/accept`)
      .set('Authorization', `Bearer ${user2Token}`);

    const invite3 = await request(app)
      .post(`/families/${familyId}/invite`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ email: 'rec3@example.com' });

    await request(app)
      .post(`/families/${familyId}/invitations/${invite3.body.data.token}/accept`)
      .set('Authorization', `Bearer ${user3Token}`);

    // Create media items with TMDB data
    const media1 = await prisma.mediaItem.create({
      data: {
        tmdbId: 5001,
        tmdbType: 'movie',
        title: 'The Great Movie',
        description: 'An amazing film',
        rating: 8.5,
        genres: ['Action', 'Drama'],
        creators: ['Director A'],
      },
    });
    mediaItem1Id = media1.id;

    const media2 = await prisma.mediaItem.create({
      data: {
        tmdbId: 5002,
        tmdbType: 'tv',
        title: 'Amazing Series',
        description: 'A great show',
        rating: 9.0,
        genres: ['Comedy', 'Drama'],
        creators: ['Creator B'],
      },
    });
    mediaItem2Id = media2.id;

    const media3 = await prisma.mediaItem.create({
      data: {
        tmdbId: 5003,
        tmdbType: 'movie',
        title: 'Mediocre Film',
        description: 'An okay movie',
        rating: 6.0,
        genres: ['Action'],
        creators: ['Director C'],
      },
    });
    mediaItem3Id = media3.id;

    const media4 = await prisma.mediaItem.create({
      data: {
        tmdbId: 5004,
        tmdbType: 'movie',
        title: 'Hidden Gem',
        description: 'A hidden masterpiece',
        rating: 8.8,
        genres: ['Thriller'],
        creators: ['Director D'],
      },
    });
    mediaItem4Id = media4.id;

    // Add watchlist entries for user2 and user3
    // User2 has watched mediaItem1 and mediaItem2 with high ratings
    await prisma.watchlistEntry.create({
      data: {
        userId: user2Id,
        mediaItemId: mediaItem1Id,
        status: 'completed',
        rating: 9,
      },
    });

    await prisma.watchlistEntry.create({
      data: {
        userId: user2Id,
        mediaItemId: mediaItem2Id,
        status: 'completed',
        rating: 10,
      },
    });

    // User3 has also watched mediaItem1 with good rating and mediaItem3 with low rating
    await prisma.watchlistEntry.create({
      data: {
        userId: user3Id,
        mediaItemId: mediaItem1Id,
        status: 'completed',
        rating: 8,
      },
    });

    await prisma.watchlistEntry.create({
      data: {
        userId: user3Id,
        mediaItemId: mediaItem3Id,
        status: 'completed',
        rating: 4,
      },
    });

    // User4 (in different family) has watched mediaItem4
    await prisma.watchlistEntry.create({
      data: {
        userId: user4Id,
        mediaItemId: mediaItem4Id,
        status: 'completed',
        rating: 9,
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.watchlistEntry.deleteMany();
    await prisma.familyInvitation.deleteMany();
    await prisma.familyMembership.deleteMany();
    await prisma.family.deleteMany();
    await prisma.mediaItem.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  afterEach(() => {
    // Clear cache after each test to ensure fresh results
    clearCache();
  });

  describe('GET /recommendations', () => {
    it('should return recommendations for user1 from family members', async () => {
      const response = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
      expect(response.body.userId).toBe(user1Id);

      // Should have at least 3 recommendations (mediaItem1, mediaItem2, mediaItem3)
      expect(response.body.count).toBeGreaterThanOrEqual(3);

      // Verify structure of recommendations
      const firstRec = response.body.data[0];
      expect(firstRec).toHaveProperty('mediaItem');
      expect(firstRec).toHaveProperty('score');
      expect(firstRec).toHaveProperty('metadata');
      expect(firstRec.metadata).toHaveProperty('familyAvgRating');
      expect(firstRec.metadata).toHaveProperty('familyWatchCount');
      expect(firstRec.metadata).toHaveProperty('tmdbRating');
      expect(firstRec.metadata).toHaveProperty('watchedBy');
    });

    it('should rank mediaItem1 higher than mediaItem3 due to better ratings', async () => {
      const response = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const recommendations = response.body.data;

      // Find the positions of mediaItem1 and mediaItem3
      const media1Index = recommendations.findIndex((r: any) => r.mediaItem.id === mediaItem1Id);
      const media3Index = recommendations.findIndex((r: any) => r.mediaItem.id === mediaItem3Id);

      // mediaItem1 has avg rating of 8.5 (from user2:9, user3:8)
      // mediaItem3 has avg rating of 4 (from user3:4)
      // mediaItem1 should be ranked higher
      expect(media1Index).toBeLessThan(media3Index);

      // Check specific scoring metadata
      const media1Rec = recommendations[media1Index];
      expect(media1Rec.metadata.familyAvgRating).toBe(8.5); // (9 + 8) / 2
      expect(media1Rec.metadata.familyWatchCount).toBe(2);
    });

    it('should rank mediaItem2 highest due to perfect rating', async () => {
      const response = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const recommendations = response.body.data;

      // mediaItem2 has rating 10 from user2, and high TMDB rating (9.0)
      // It should be ranked very high or first
      const media2 = recommendations.find((r: any) => r.mediaItem.id === mediaItem2Id);

      expect(media2).toBeDefined();
      expect(media2.metadata.familyAvgRating).toBe(10);
      expect(media2.score).toBeGreaterThan(0);

      // Should be in top positions
      const media2Index = recommendations.findIndex((r: any) => r.mediaItem.id === mediaItem2Id);
      expect(media2Index).toBeLessThan(3);
    });

    it('should not include items user1 has already added to watchlist', async () => {
      // Add mediaItem1 to user1's watchlist
      await prisma.watchlistEntry.create({
        data: {
          userId: user1Id,
          mediaItemId: mediaItem1Id,
          status: 'not_watched',
        },
      });

      const response = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const recommendations = response.body.data;

      // mediaItem1 should not be in recommendations
      const media1Exists = recommendations.some((r: any) => r.mediaItem.id === mediaItem1Id);
      expect(media1Exists).toBe(false);

      // Clean up
      await prisma.watchlistEntry.delete({
        where: {
          userId_mediaItemId: {
            userId: user1Id,
            mediaItemId: mediaItem1Id,
          },
        },
      });
    });

    it('should not include items user has completed', async () => {
      // Add mediaItem2 to user1's watchlist as completed
      await prisma.watchlistEntry.create({
        data: {
          userId: user1Id,
          mediaItemId: mediaItem2Id,
          status: 'completed',
          rating: 9,
        },
      });

      const response = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const recommendations = response.body.data;

      // mediaItem2 should not be in recommendations
      const media2Exists = recommendations.some((r: any) => r.mediaItem.id === mediaItem2Id);
      expect(media2Exists).toBe(false);

      // Clean up
      await prisma.watchlistEntry.delete({
        where: {
          userId_mediaItemId: {
            userId: user1Id,
            mediaItemId: mediaItem2Id,
          },
        },
      });
    });

    it('should filter by familyId when provided', async () => {
      const response = await request(app)
        .get(`/recommendations?familyId=${familyId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.familyId).toBe(familyId);
      expect(response.body.data).toBeDefined();

      // Should only include items from family members (user2, user3)
      // Should not include mediaItem4 which is from user4 in different family
      const media4Exists = response.body.data.some((r: any) => r.mediaItem.id === mediaItem4Id);
      expect(media4Exists).toBe(false);
    });

    it('should return 403 when filtering by family user is not member of', async () => {
      const response = await request(app)
        .get(`/recommendations?familyId=${family2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(403);

      expect(response.body.error).toBe('You are not a member of this family');
    });

    it('should apply limit parameter correctly', async () => {
      const response = await request(app)
        .get('/recommendations?limit=2')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.count).toBe(response.body.data.length);
    });

    it('should return 400 for invalid limit parameter', async () => {
      const response = await request(app)
        .get('/recommendations?limit=invalid')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(response.body.error).toBe('Invalid limit parameter');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/recommendations').expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return empty array for user with no family memberships', async () => {
      // Create a new user not in any family
      const newUser = await request(app).post('/auth/register').send({
        email: 'lonely@example.com',
        password: 'password123',
        name: 'Lonely User',
      });

      const response = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${newUser.body.accessToken}`)
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);

      // Clean up
      await prisma.refreshToken.deleteMany({ where: { userId: newUser.body.user.id } });
      await prisma.user.delete({ where: { id: newUser.body.user.id } });
    });

    it('should include metadata about who watched each item', async () => {
      const response = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const media1Rec = response.body.data.find((r: any) => r.mediaItem.id === mediaItem1Id);

      expect(media1Rec).toBeDefined();
      expect(media1Rec.metadata.watchedBy).toHaveLength(2);

      // Should include both user2 and user3
      const watchedByIds = media1Rec.metadata.watchedBy.map((w: any) => w.userId);
      expect(watchedByIds).toContain(user2Id);
      expect(watchedByIds).toContain(user3Id);

      // Check structure of watchedBy entries
      const user2Entry = media1Rec.metadata.watchedBy.find((w: any) => w.userId === user2Id);
      expect(user2Entry).toHaveProperty('userName');
      expect(user2Entry).toHaveProperty('rating');
      expect(user2Entry).toHaveProperty('status');
      expect(user2Entry.rating).toBe(9);
      expect(user2Entry.status).toBe('completed');
    });

    it('should use cached results on subsequent requests', async () => {
      // First request
      const response1 = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Add a new entry that would change recommendations
      await prisma.watchlistEntry.create({
        data: {
          userId: user2Id,
          mediaItemId: mediaItem4Id,
          status: 'completed',
          rating: 10,
        },
      });

      // Second request - should return cached results (not include new entry)
      const response2 = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Results should be identical (cached)
      expect(response2.body.data).toEqual(response1.body.data);

      // Clean up
      await prisma.watchlistEntry.deleteMany({
        where: {
          userId: user2Id,
          mediaItemId: mediaItem4Id,
        },
      });
    });

    it('should bypass cache when refresh=true is passed', async () => {
      // First request to populate cache
      await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Add a new entry
      await prisma.watchlistEntry.create({
        data: {
          userId: user2Id,
          mediaItemId: mediaItem4Id,
          status: 'completed',
          rating: 10,
        },
      });

      // Request with refresh=true should get new data
      const response = await request(app)
        .get('/recommendations?refresh=true')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Should include the new entry (mediaItem4) from user2
      // Note: mediaItem4 was originally from user4 in different family, but now user2 also has it
      const media4Rec = response.body.data.find((r: any) => r.mediaItem.id === mediaItem4Id);
      expect(media4Rec).toBeDefined();

      // Clean up
      await prisma.watchlistEntry.deleteMany({
        where: {
          userId: user2Id,
          mediaItemId: mediaItem4Id,
        },
      });
    });
  });

  describe('POST /recommendations/clear-cache', () => {
    it('should clear cache successfully', async () => {
      // First request to populate cache
      await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Clear cache
      const response = await request(app)
        .post('/recommendations/clear-cache')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({})
        .expect(200);

      expect(response.body.message).toBe('Cache cleared successfully');
    });

    it('should clear cache for specific family', async () => {
      const response = await request(app)
        .post('/recommendations/clear-cache')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ familyId })
        .expect(200);

      expect(response.body.message).toBe('Cache cleared successfully');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).post('/recommendations/clear-cache').send({}).expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Scoring Algorithm Tests', () => {
    it('should prioritize items with higher family ratings', async () => {
      const response = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const recommendations = response.body.data;

      // Verify items are sorted by score descending
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].score).toBeGreaterThanOrEqual(recommendations[i + 1].score);
      }
    });

    it('should consider popularity (number of watchers)', async () => {
      const response = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const media1Rec = response.body.data.find((r: any) => r.mediaItem.id === mediaItem1Id);

      // mediaItem1 has 2 watchers
      expect(media1Rec.metadata.familyWatchCount).toBe(2);

      // Items with more watchers should get popularity boost in score
      expect(media1Rec.score).toBeGreaterThan(0);
    });

    it('should incorporate TMDB ratings in scoring', async () => {
      const response = await request(app)
        .get('/recommendations')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const media2Rec = response.body.data.find((r: any) => r.mediaItem.id === mediaItem2Id);

      // mediaItem2 has high TMDB rating (9.0)
      expect(media2Rec.metadata.tmdbRating).toBe(9.0);

      // Verify it contributes to the overall score
      expect(media2Rec.score).toBeGreaterThan(30); // Should have high score
    });

    it('should handle items with no ratings gracefully', async () => {
      // Create a media item with no ratings
      const mediaNoRating = await prisma.mediaItem.create({
        data: {
          tmdbId: 5005,
          tmdbType: 'movie',
          title: 'Unrated Film',
          description: 'No ratings yet',
          rating: null,
          genres: ['Mystery'],
          creators: ['Director E'],
        },
      });

      // Add to user2's watchlist without rating
      await prisma.watchlistEntry.create({
        data: {
          userId: user2Id,
          mediaItemId: mediaNoRating.id,
          status: 'watching',
          rating: null,
        },
      });

      const response = await request(app)
        .get('/recommendations?refresh=true')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const unratedRec = response.body.data.find((r: any) => r.mediaItem.id === mediaNoRating.id);

      if (unratedRec) {
        expect(unratedRec.metadata.familyAvgRating).toBeNull();
        expect(unratedRec.metadata.tmdbRating).toBeNull();
        // Should still have a score based on popularity and status
        expect(unratedRec.score).toBeGreaterThanOrEqual(0);
      }

      // Clean up
      await prisma.watchlistEntry.deleteMany({ where: { mediaItemId: mediaNoRating.id } });
      await prisma.mediaItem.delete({ where: { id: mediaNoRating.id } });
    });
  });
});
