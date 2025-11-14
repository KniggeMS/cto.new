import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Watchlist Endpoints', () => {
  let accessToken: string;
  let userId: string;
  let otherAccessToken: string;
  let otherUserId: string;

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.watchlistEntry.deleteMany();
    await prisma.streamingProvider.deleteMany();
    await prisma.mediaItem.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // Create test user and get access token
    const registerResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'watchlist@example.com',
        password: 'password123',
        name: 'Watchlist User'
      });

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Create another test user for unauthorized access tests
    const otherRegisterResponse = await request(app)
      .post('/auth/register')
      .send({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User'
      });

    otherAccessToken = otherRegisterResponse.body.accessToken;
    otherUserId = otherRegisterResponse.body.user.id;
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.watchlistEntry.deleteMany();
    await prisma.streamingProvider.deleteMany();
    await prisma.mediaItem.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /watchlist', () => {
    it('should add a new media item to watchlist with metadata', async () => {
      const watchlistData = {
        tmdbId: 550,
        tmdbType: 'movie',
        status: 'not_watched',
        metadata: {
          title: 'Fight Club',
          description: 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club...',
          posterPath: '/p64JHd3bGjH8qSEp0gyS1BFrP4V.jpg',
          rating: 8.8,
          genres: ['Drama', 'Thriller'],
          creators: ['David Fincher']
        }
      };

      const response = await request(app)
        .post('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(watchlistData)
        .expect(201);

      expect(response.body.message).toBe('Added to watchlist successfully');
      expect(response.body.data.status).toBe('not_watched');
      expect(response.body.data.mediaItem.title).toBe('Fight Club');
      expect(response.body.data.mediaItem.tmdbId).toBe(550);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should add with rating and notes', async () => {
      const watchlistData = {
        tmdbId: 278,
        tmdbType: 'movie',
        status: 'completed',
        rating: 5,
        notes: 'Amazing movie!',
        metadata: {
          title: 'The Shawshank Redemption',
          genres: ['Drama']
        }
      };

      const response = await request(app)
        .post('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(watchlistData)
        .expect(201);

      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.rating).toBe(5);
      expect(response.body.data.notes).toBe('Amazing movie!');
    });

    it('should persist streaming providers when metadata includes them', async () => {
      const watchlistData = {
        tmdbId: 123456,
        tmdbType: 'movie',
        metadata: {
          title: 'Provider Test Movie',
          streamingProviders: [
            {
              provider: 'netflix',
              url: 'https://www.netflix.com/title/123456',
              regions: ['US', 'CA']
            }
          ]
        }
      };

      const response = await request(app)
        .post('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(watchlistData)
        .expect(201);

      expect(response.body.data.mediaItem.streamingProviders).toHaveLength(1);
      expect(response.body.data.mediaItem.streamingProviders[0].provider).toBe('netflix');
      expect(response.body.data.mediaItem.streamingProviders[0].regions).toEqual(['US', 'CA']);

      const mediaItemId = response.body.data.mediaItem.id;
      const providersInDb = await prisma.streamingProvider.findMany({
        where: { mediaItemId }
      });
      expect(providersInDb).toHaveLength(1);
      expect(providersInDb[0].provider).toBe('netflix');
    });

    it('should reuse existing media item if it exists', async () => {
      // Create media item first
      await prisma.mediaItem.create({
        data: {
          tmdbId: 1399,
          tmdbType: 'tv',
          title: 'Breaking Bad',
          genres: ['Crime', 'Drama']
        }
      });

      const watchlistData = {
        tmdbId: 1399,
        tmdbType: 'tv',
        status: 'watching'
      };

      const response = await request(app)
        .post('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(watchlistData)
        .expect(201);

      expect(response.body.data.mediaItem.title).toBe('Breaking Bad');
      
      // Check that only one media item exists
      const mediaCount = await prisma.mediaItem.count({ where: { tmdbId: 1399 } });
      expect(mediaCount).toBe(1);
    });

    it('should return 400 if media item does not exist and no metadata provided', async () => {
      const watchlistData = {
        tmdbId: 999999,
        tmdbType: 'movie',
        status: 'not_watched'
      };

      const response = await request(app)
        .post('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(watchlistData)
        .expect(400);

      expect(response.body.error).toBe('Media item not found. Please provide metadata to create it.');
    });

    it('should return 409 if media already in watchlist', async () => {
      const watchlistData = {
        tmdbId: 550,
        tmdbType: 'movie',
        metadata: {
          title: 'Fight Club'
        }
      };

      // Add first time
      await request(app)
        .post('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(watchlistData)
        .expect(201);

      // Try to add again
      const response = await request(app)
        .post('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(watchlistData)
        .expect(409);

      expect(response.body.error).toBe('This media item is already in your watchlist');
    });

    it('should return 400 for invalid rating', async () => {
      const watchlistData = {
        tmdbId: 550,
        tmdbType: 'movie',
        rating: 10, // Should be 0-5
        metadata: {
          title: 'Fight Club'
        }
      };

      const response = await request(app)
        .post('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(watchlistData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid tmdbType', async () => {
      const watchlistData = {
        tmdbId: 550,
        tmdbType: 'series', // Should be 'movie' or 'tv'
        metadata: {
          title: 'Fight Club'
        }
      };

      const response = await request(app)
        .post('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(watchlistData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 401 without authentication', async () => {
      const watchlistData = {
        tmdbId: 550,
        tmdbType: 'movie',
        metadata: {
          title: 'Fight Club'
        }
      };

      const response = await request(app)
        .post('/watchlist')
        .send(watchlistData)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /watchlist', () => {
    beforeEach(async () => {
      // Create some media items and watchlist entries
      const movie1 = await prisma.mediaItem.create({
        data: {
          tmdbId: 550,
          tmdbType: 'movie',
          title: 'Fight Club',
          genres: ['Drama']
        }
      });

      const movie2 = await prisma.mediaItem.create({
        data: {
          tmdbId: 278,
          tmdbType: 'movie',
          title: 'The Shawshank Redemption',
          genres: ['Drama']
        }
      });

      const tvShow = await prisma.mediaItem.create({
        data: {
          tmdbId: 1399,
          tmdbType: 'tv',
          title: 'Breaking Bad',
          genres: ['Crime', 'Drama']
        }
      });

      await prisma.watchlistEntry.create({
        data: {
          userId,
          mediaItemId: movie1.id,
          status: 'completed',
          rating: 5,
          notes: 'Great movie!'
        }
      });

      await prisma.watchlistEntry.create({
        data: {
          userId,
          mediaItemId: movie2.id,
          status: 'not_watched'
        }
      });

      await prisma.watchlistEntry.create({
        data: {
          userId,
          mediaItemId: tvShow.id,
          status: 'watching',
          notes: 'On season 3'
        }
      });
    });

    it('should retrieve all watchlist entries for authenticated user', async () => {
      const response = await request(app)
        .get('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0].mediaItem).toBeDefined();
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/watchlist?status=watching')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('watching');
      expect(response.body.data[0].mediaItem.title).toBe('Breaking Bad');
    });

    it('should sort entries', async () => {
      const response = await request(app)
        .get('/watchlist?sortBy=dateAdded&order=asc')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      // Check that entries are sorted
      const dates = response.body.data.map((e: any) => new Date(e.dateAdded).getTime());
      expect(dates[0]).toBeLessThanOrEqual(dates[1]);
      expect(dates[1]).toBeLessThanOrEqual(dates[2]);
    });

    it('should return empty array for user with no entries', async () => {
      const response = await request(app)
        .get('/watchlist')
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/watchlist')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('GET /watchlist/stats', () => {
    beforeEach(async () => {
      // Create media items
      const movie1 = await prisma.mediaItem.create({
        data: { tmdbId: 1, tmdbType: 'movie', title: 'Movie 1', genres: [] }
      });
      const movie2 = await prisma.mediaItem.create({
        data: { tmdbId: 2, tmdbType: 'movie', title: 'Movie 2', genres: [] }
      });
      const movie3 = await prisma.mediaItem.create({
        data: { tmdbId: 3, tmdbType: 'movie', title: 'Movie 3', genres: [] }
      });
      const movie4 = await prisma.mediaItem.create({
        data: { tmdbId: 4, tmdbType: 'movie', title: 'Movie 4', genres: [] }
      });
      const movie5 = await prisma.mediaItem.create({
        data: { tmdbId: 5, tmdbType: 'movie', title: 'Movie 5', genres: [] }
      });

      // Create entries with different statuses
      await prisma.watchlistEntry.create({
        data: { userId, mediaItemId: movie1.id, status: 'completed' }
      });
      await prisma.watchlistEntry.create({
        data: { userId, mediaItemId: movie2.id, status: 'completed' }
      });
      await prisma.watchlistEntry.create({
        data: { userId, mediaItemId: movie3.id, status: 'watching' }
      });
      await prisma.watchlistEntry.create({
        data: { userId, mediaItemId: movie4.id, status: 'not_watched' }
      });
      await prisma.watchlistEntry.create({
        data: { userId, mediaItemId: movie5.id, status: 'not_watched' }
      });
    });

    it('should return aggregated status counts', async () => {
      const response = await request(app)
        .get('/watchlist/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.total).toBe(5);
      expect(response.body.completed).toBe(2);
      expect(response.body.watching).toBe(1);
      expect(response.body.not_watched).toBe(2);
    });

    it('should return zeros for user with no entries', async () => {
      const response = await request(app)
        .get('/watchlist/stats')
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(200);

      expect(response.body.total).toBe(0);
      expect(response.body.completed).toBe(0);
      expect(response.body.watching).toBe(0);
      expect(response.body.not_watched).toBe(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/watchlist/stats')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('PATCH /watchlist/:id', () => {
    let entryId: string;

    beforeEach(async () => {
      // Create a watchlist entry
      const movie = await prisma.mediaItem.create({
        data: {
          tmdbId: 550,
          tmdbType: 'movie',
          title: 'Fight Club',
          genres: ['Drama']
        }
      });

      const entry = await prisma.watchlistEntry.create({
        data: {
          userId,
          mediaItemId: movie.id,
          status: 'not_watched'
        }
      });

      entryId = entry.id;
    });

    it('should update status', async () => {
      const updateData = {
        status: 'watching'
      };

      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Watchlist entry updated successfully');
      expect(response.body.data.status).toBe('watching');
    });

    it('should update rating and notes', async () => {
      const updateData = {
        status: 'completed',
        rating: 4,
        notes: 'Really good!'
      };

      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.rating).toBe(4);
      expect(response.body.data.notes).toBe('Really good!');
    });

    it('should update only specified fields', async () => {
      const updateData = {
        rating: 3
      };

      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.rating).toBe(3);
      expect(response.body.data.status).toBe('not_watched'); // unchanged
    });

    it('should allow setting rating to null', async () => {
      // First set a rating
      await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: 5 })
        .expect(200);

      // Then remove it
      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: null })
        .expect(200);

      expect(response.body.data.rating).toBeNull();
    });

    it('should return 404 for non-existent entry', async () => {
      const response = await request(app)
        .patch('/watchlist/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'watching' })
        .expect(404);

      expect(response.body.error).toBe('Watchlist entry not found');
    });

    it('should return 403 when trying to update another user\'s entry', async () => {
      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({ status: 'watching' })
        .expect(403);

      expect(response.body.error).toBe('You do not have permission to update this entry');
    });

    it('should return 400 for invalid rating', async () => {
      const updateData = {
        rating: 10 // Should be 0-5
      };

      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for invalid status', async () => {
      const updateData = {
        status: 'invalid_status'
      };

      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .send({ status: 'watching' })
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('DELETE /watchlist/:id', () => {
    let entryId: string;

    beforeEach(async () => {
      // Create a watchlist entry
      const movie = await prisma.mediaItem.create({
        data: {
          tmdbId: 550,
          tmdbType: 'movie',
          title: 'Fight Club',
          genres: ['Drama']
        }
      });

      const entry = await prisma.watchlistEntry.create({
        data: {
          userId,
          mediaItemId: movie.id,
          status: 'not_watched'
        }
      });

      entryId = entry.id;
    });

    it('should delete watchlist entry', async () => {
      const response = await request(app)
        .delete(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Watchlist entry deleted successfully');

      // Verify entry is deleted
      const deletedEntry = await prisma.watchlistEntry.findUnique({
        where: { id: entryId }
      });
      expect(deletedEntry).toBeNull();
    });

    it('should return 404 for non-existent entry', async () => {
      const response = await request(app)
        .delete('/watchlist/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.error).toBe('Watchlist entry not found');
    });

    it('should return 403 when trying to delete another user\'s entry', async () => {
      const response = await request(app)
        .delete(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(403);

      expect(response.body.error).toBe('You do not have permission to delete this entry');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/watchlist/${entryId}`)
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('PATCH /watchlist/:id/progress', () => {
    let entryId: string;

    beforeEach(async () => {
      const movie = await prisma.mediaItem.create({
        data: {
          tmdbId: 550,
          tmdbType: 'movie',
          title: 'Fight Club',
          genres: ['Drama']
        }
      });

      const entry = await prisma.watchlistEntry.create({
        data: {
          userId,
          mediaItemId: movie.id,
          status: 'not_watched'
        }
      });

      entryId = entry.id;
    });

    it('should update progress status', async () => {
      const response = await request(app)
        .patch(`/watchlist/${entryId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'watching' })
        .expect(200);

      expect(response.body.message).toBe('Watch progress updated successfully');
      expect(response.body.data.status).toBe('watching');
    });

    it('should update progress with status and rating', async () => {
      const response = await request(app)
        .patch(`/watchlist/${entryId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'completed', rating: 5 })
        .expect(200);

      expect(response.body.data.status).toBe('completed');
      expect(response.body.data.rating).toBe(5);
    });

    it('should return 400 if status is not provided', async () => {
      const response = await request(app)
        .patch(`/watchlist/${entryId}/progress`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: 4 })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .patch(`/watchlist/${entryId}/progress`)
        .send({ status: 'completed' })
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Business Rules and Status Transitions', () => {
    let entryId: string;

    beforeEach(async () => {
      const movie = await prisma.mediaItem.create({
        data: {
          tmdbId: 550,
          tmdbType: 'movie',
          title: 'Fight Club',
          genres: ['Drama']
        }
      });

      const entry = await prisma.watchlistEntry.create({
        data: {
          userId,
          mediaItemId: movie.id,
          status: 'not_watched'
        }
      });

      entryId = entry.id;
    });

    it('should allow transition from not_watched to watching', async () => {
      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'watching' })
        .expect(200);

      expect(response.body.data.status).toBe('watching');
    });

    it('should allow transition from watching to completed', async () => {
      await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'watching' });

      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.data.status).toBe('completed');
    });

    it('should allow direct transition from not_watched to completed', async () => {
      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'completed' })
        .expect(200);

      expect(response.body.data.status).toBe('completed');
    });

    it('should allow setting rating from 0 to 5', async () => {
      for (let rating = 0; rating <= 5; rating++) {
        const response = await request(app)
          .patch(`/watchlist/${entryId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ rating })
          .expect(200);

        expect(response.body.data.rating).toBe(rating);
      }
    });

    it('should reject negative rating', async () => {
      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: -1 })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject rating greater than 5', async () => {
      const response = await request(app)
        .patch(`/watchlist/${entryId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ rating: 6 })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });
});
