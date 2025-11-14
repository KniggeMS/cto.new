import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Family Endpoints', () => {
  let user1Id: string;
  let user2Id: string;
  let user3Id: string;
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  let familyId: string;

  beforeAll(async () => {
    // Register three test users
    const registerUser1 = await request(app).post('/auth/register').send({
      email: 'family1@example.com',
      password: 'password123',
      name: 'Family User 1',
    });

    const registerUser2 = await request(app).post('/auth/register').send({
      email: 'family2@example.com',
      password: 'password123',
      name: 'Family User 2',
    });

    const registerUser3 = await request(app).post('/auth/register').send({
      email: 'family3@example.com',
      password: 'password123',
      name: 'Family User 3',
    });

    user1Id = registerUser1.body.user.id;
    user1Token = registerUser1.body.accessToken;
    user2Id = registerUser2.body.user.id;
    user2Token = registerUser2.body.accessToken;
    user3Id = registerUser3.body.user.id;
    user3Token = registerUser3.body.accessToken;
  });

  afterAll(async () => {
    // Clean up
    await prisma.familyInvitation.deleteMany();
    await prisma.familyMembership.deleteMany();
    await prisma.family.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /families', () => {
    it('should create a new family successfully', async () => {
      const response = await request(app)
        .post('/families')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Test Family',
        })
        .expect(201);

      expect(response.body.message).toBe('Family created successfully');
      expect(response.body.data.name).toBe('Test Family');
      expect(response.body.data.createdBy).toBe(user1Id);
      expect(response.body.data.members).toHaveLength(1);
      expect(response.body.data.members[0].role).toBe('owner');
      expect(response.body.data.members[0].user.id).toBe(user1Id);

      familyId = response.body.data.id;
    });

    it('should return 400 for missing family name', async () => {
      const response = await request(app)
        .post('/families')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/families')
        .send({
          name: 'Unauthorized Family',
        })
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('POST /families/:id/invite', () => {
    it('should send invitation successfully', async () => {
      const response = await request(app)
        .post(`/families/${familyId}/invite`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          email: 'family2@example.com',
        })
        .expect(201);

      expect(response.body.message).toBe('Invitation sent successfully');
      expect(response.body.data.email).toBe('family2@example.com');
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();
    });

    it('should return 403 for non-member inviting', async () => {
      const response = await request(app)
        .post(`/families/${familyId}/invite`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          email: 'family3@example.com',
        })
        .expect(403);

      expect(response.body.error).toBe('You are not a member of this family');
    });

    it('should return 403 for member without admin role trying to invite', async () => {
      // First accept the invitation for user2
      const invitations = await prisma.familyInvitation.findMany({
        where: { familyId, email: 'family2@example.com' },
      });

      const token = invitations[0].token;

      await request(app)
        .post(`/families/${familyId}/invitations/${token}/accept`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      // Now try to invite as member (without admin role)
      const response = await request(app)
        .post(`/families/${familyId}/invite`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          email: 'family3@example.com',
        })
        .expect(403);

      expect(response.body.error).toContain('at least an admin');
    });

    it('should return 409 when inviting existing member', async () => {
      const response = await request(app)
        .post(`/families/${familyId}/invite`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          email: 'family2@example.com',
        })
        .expect(409);

      expect(response.body.error).toBe('User is already a member of this family');
    });

    it('should return 404 for non-existent family', async () => {
      const response = await request(app)
        .post('/families/nonexistent/invite')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          email: 'family3@example.com',
        })
        .expect(404);

      expect(response.body.error).toBe('Family not found');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post(`/families/${familyId}/invite`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /families/:id/invitations/:token/accept', () => {
    it('should accept invitation successfully', async () => {
      // Create a new invitation for user3
      await request(app)
        .post(`/families/${familyId}/invite`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          email: 'family3@example.com',
        });

      // Get the invitation token
      const invitations = await prisma.familyInvitation.findMany({
        where: { familyId, email: 'family3@example.com', status: 'pending' },
      });

      const token = invitations[0].token;

      // Accept invitation
      const response = await request(app)
        .post(`/families/${familyId}/invitations/${token}/accept`)
        .set('Authorization', `Bearer ${user3Token}`)
        .expect(200);

      expect(response.body.message).toBe('Invitation accepted successfully');
      expect(response.body.data.role).toBe('member');
      expect(response.body.data.user.id).toBe(user3Id);

      // Verify invitation status updated
      const updatedInvitation = await prisma.familyInvitation.findUnique({
        where: { id: invitations[0].id },
      });

      expect(updatedInvitation?.status).toBe('accepted');
      expect(updatedInvitation?.acceptedAt).toBeDefined();
    });

    it('should return 404 for invalid token', async () => {
      const response = await request(app)
        .post(`/families/${familyId}/invitations/invalidtoken/accept`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);

      expect(response.body.error).toContain('Invitation not found');
    });

    it('should return 410 for expired invitation', async () => {
      // Create a new family for this test
      const newFamilyResponse = await request(app)
        .post('/families')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Expiration Test Family',
        });

      const testFamilyId = newFamilyResponse.body.data.id;

      // Create an expired invitation for user2 in the test family
      const invitationToken = 'expired-token-' + Date.now();
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // 1 day ago

      await prisma.familyInvitation.create({
        data: {
          familyId: testFamilyId,
          email: 'family2@example.com',
          token: invitationToken,
          status: 'pending',
          expiresAt: pastDate,
        },
      });

      const response = await request(app)
        .post(`/families/${testFamilyId}/invitations/${invitationToken}/accept`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(410);

      expect(response.body.error).toBe('Invitation has expired');
    });

    it('should return 409 when accepting if already member', async () => {
      // User1 is already a member, try to accept an invitation
      const newToken = 'new-token-' + Date.now();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      await prisma.familyInvitation.create({
        data: {
          familyId,
          email: 'family1@example.com',
          token: newToken,
          status: 'pending',
          expiresAt: futureDate,
        },
      });

      const response = await request(app)
        .post(`/families/${familyId}/invitations/${newToken}/accept`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(409);

      expect(response.body.error).toBe('You are already a member of this family');
    });
  });

  describe('GET /families/:id', () => {
    it('should get family details successfully', async () => {
      const response = await request(app)
        .get(`/families/${familyId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data.id).toBe(familyId);
      expect(response.body.data.name).toBe('Test Family');
      expect(response.body.data.members.length).toBeGreaterThan(0);
    });

    it('should return 403 for non-member accessing family', async () => {
      // Create another user and family
      const newUser = await request(app).post('/auth/register').send({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      });

      const response = await request(app)
        .get(`/families/${familyId}`)
        .set('Authorization', `Bearer ${newUser.body.accessToken}`)
        .expect(403);

      expect(response.body.error).toBe('You are not a member of this family');
    });

    it('should return 404 for non-existent family', async () => {
      const response = await request(app)
        .get('/families/nonexistent')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);

      expect(response.body.error).toBe('Family not found');
    });
  });

  describe('GET /families/:id/members', () => {
    it('should list family members successfully', async () => {
      const response = await request(app)
        .get(`/families/${familyId}/members`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.count).toBe(response.body.data.length);

      // Verify member structure
      const member = response.body.data[0];
      expect(member.userId).toBeDefined();
      expect(member.familyId).toBe(familyId);
      expect(member.role).toBeDefined();
      expect(member.joinedAt).toBeDefined();
      expect(member.user).toBeDefined();
    });

    it('should return 403 for non-member listing members', async () => {
      const newUser = await request(app).post('/auth/register').send({
        email: 'another@example.com',
        password: 'password123',
      });

      const response = await request(app)
        .get(`/families/${familyId}/members`)
        .set('Authorization', `Bearer ${newUser.body.accessToken}`)
        .expect(403);

      expect(response.body.error).toBe('You are not a member of this family');
    });
  });

  describe('GET /families/:id/watchlists', () => {
    beforeAll(async () => {
      // Create some media items and watchlist entries
      const uniqueId = Math.floor(Math.random() * 10000);
      const mediaItem1 = await prisma.mediaItem.upsert({
        where: { tmdbId: 50000 + uniqueId },
        update: {},
        create: {
          tmdbId: 50000 + uniqueId,
          tmdbType: 'movie',
          title: 'Fight Club',
          description: 'An underground fight club',
        },
      });

      const mediaItem2 = await prisma.mediaItem.upsert({
        where: { tmdbId: 60000 + uniqueId },
        update: {},
        create: {
          tmdbId: 60000 + uniqueId,
          tmdbType: 'movie',
          title: 'The Matrix',
          description: 'Sci-fi action film',
        },
      });

      // Add watchlist entries for user1
      await prisma.watchlistEntry.create({
        data: {
          userId: user1Id,
          mediaItemId: mediaItem1.id,
          status: 'completed',
          rating: 5,
        },
      });

      // Add watchlist entries for user2
      await prisma.watchlistEntry.create({
        data: {
          userId: user2Id,
          mediaItemId: mediaItem2.id,
          status: 'watching',
          rating: 4,
        },
      });

      // Add watchlist entries for user3
      await prisma.watchlistEntry.create({
        data: {
          userId: user3Id,
          mediaItemId: mediaItem1.id,
          status: 'not_watched',
          rating: null,
        },
      });
    });

    it('should get aggregated watchlist for all family members', async () => {
      const response = await request(app)
        .get(`/families/${familyId}/watchlists`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
      expect(response.body.familyId).toBe(familyId);

      // Verify entries include user info
      response.body.data.forEach((entry: any) => {
        expect(entry.user).toBeDefined();
        expect(entry.mediaItem).toBeDefined();
      });
    });

    it('should filter aggregated watchlist by status', async () => {
      const response = await request(app)
        .get(`/families/${familyId}/watchlists?status=completed`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((entry: any) => {
        expect(entry.status).toBe('completed');
      });
    });

    it('should return 400 for invalid status filter', async () => {
      const response = await request(app)
        .get(`/families/${familyId}/watchlists?status=invalid`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(response.body.error).toBe('Invalid status filter');
    });

    it('should sort aggregated watchlist', async () => {
      const response = await request(app)
        .get(`/families/${familyId}/watchlists?sortBy=rating&order=desc`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should return 403 for non-member accessing aggregated watchlist', async () => {
      const newUser = await request(app).post('/auth/register').send({
        email: 'outsider@example.com',
        password: 'password123',
      });

      const response = await request(app)
        .get(`/families/${familyId}/watchlists`)
        .set('Authorization', `Bearer ${newUser.body.accessToken}`)
        .expect(403);

      expect(response.body.error).toBe('You are not a member of this family');
    });
  });

  describe('PATCH /families/:id/members/:memberId', () => {
    it('should update member role successfully', async () => {
      const response = await request(app)
        .patch(`/families/${familyId}/members/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          role: 'admin',
        })
        .expect(200);

      expect(response.body.message).toBe('Member role updated successfully');
      expect(response.body.data.role).toBe('admin');
    });

    it('should return 403 for non-owner trying to update role', async () => {
      const response = await request(app)
        .patch(`/families/${familyId}/members/${user3Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          role: 'member',
        })
        .expect(403);

      expect(response.body.error).toContain('at least an owner');
    });

    it('should return 404 for non-existent member', async () => {
      const response = await request(app)
        .patch(`/families/${familyId}/members/nonexistent`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          role: 'admin',
        })
        .expect(404);

      expect(response.body.error).toBe('Member not found in this family');
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .patch(`/families/${familyId}/members/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          role: 'invalid',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should prevent changing owner role from owner', async () => {
      const response = await request(app)
        .patch(`/families/${familyId}/members/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          role: 'admin',
        })
        .expect(400);

      expect(response.body.error).toBe('Cannot change the owner role');
    });
  });

  describe('GET /families', () => {
    it('should list user families successfully', async () => {
      const response = await request(app)
        .get('/families')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThanOrEqual(1);

      // Verify at least one family matches
      const familyInList = response.body.data.find((f: any) => f.id === familyId);
      expect(familyInList).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app).get('/families').expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Invite Lifecycle', () => {
    it('should handle complete invite workflow', async () => {
      // Create a new family for this test
      const createFamilyResponse = await request(app)
        .post('/families')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Invite Workflow Family',
        })
        .expect(201);

      const workflowFamilyId = createFamilyResponse.body.data.id;

      // Create a new test user
      const newUserResponse = await request(app).post('/auth/register').send({
        email: 'invitee@example.com',
        password: 'password123',
        name: 'Invitee',
      });

      const inviteeId = newUserResponse.body.user.id;
      const inviteeToken = newUserResponse.body.accessToken;

      // Step 1: Send invitation
      const inviteResponse = await request(app)
        .post(`/families/${workflowFamilyId}/invite`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          email: 'invitee@example.com',
        })
        .expect(201);

      const inviteToken = inviteResponse.body.data.token;

      // Step 2: Accept invitation
      const acceptResponse = await request(app)
        .post(`/families/${workflowFamilyId}/invitations/${inviteToken}/accept`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);

      expect(acceptResponse.body.data.userId).toBe(inviteeId);

      // Step 3: Verify membership
      const membersResponse = await request(app)
        .get(`/families/${workflowFamilyId}/members`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);

      const inviteeMembership = membersResponse.body.data.find((m: any) => m.userId === inviteeId);
      expect(inviteeMembership).toBeDefined();
      expect(inviteeMembership.role).toBe('member');

      // Step 4: Verify can access family resources
      const familyDetailsResponse = await request(app)
        .get(`/families/${workflowFamilyId}`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);

      expect(familyDetailsResponse.body.data.id).toBe(workflowFamilyId);
    });
  });
});
