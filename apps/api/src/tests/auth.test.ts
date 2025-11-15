import request from 'supertest';
import { app } from '../server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Authentication Endpoints', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app).post('/auth/register').send(userData).expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken');
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
      };

      const response = await request(app).post('/auth/register').send(userData).expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for short password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      };

      const response = await request(app).post('/auth/register').send(userData).expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      // Create first user
      await request(app).post('/auth/register').send(userData).expect(201);

      // Try to create duplicate
      const response = await request(app).post('/auth/register').send(userData).expect(409);

      expect(response.body.error).toBe('User with this email already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const uniqueEmail = `login-${Date.now()}-${Math.random()}@example.com`;
      
      // First register a user
      await request(app)
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          password: 'password123',
          name: 'Login User'
        });

      const loginData = {
        email: uniqueEmail,
        password: 'password123'
      };

      const response = await request(app).post('/auth/login').send(loginData).expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refreshToken');
    });

    it('should return 401 for invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123',
      };

      const response = await request(app).post('/auth/login').send(loginData).expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const uniqueEmail = `login-${Date.now()}@example.com`;
      
      // First register a user
      await request(app)
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          password: 'password123',
          name: 'Login User'
        });

      const loginData = {
        email: uniqueEmail,
        password: 'wrongpassword'
      };

      const response = await request(app).post('/auth/login').send(loginData).expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app).post('/auth/login').send({}).expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get tokens
      const registerResponse = await request(app).post('/auth/register').send({
        email: 'refresh@example.com',
        password: 'password123',
        name: 'Refresh User',
      });

      accessToken = registerResponse.body.accessToken;

      // Extract refresh token from cookies
      const cookies = registerResponse.headers['set-cookie'];
      refreshToken =
        cookies
          ?.find((cookie: string) => cookie.startsWith('refreshToken='))
          ?.split('=')[1]
          ?.split(';')[0] || '';
    });

    it('should refresh access token successfully', async () => {
      // Add a small delay to ensure different JWT issue time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.accessToken).toBeDefined();
      // Access token should be different since it has a new issue time
      expect(response.body.accessToken).not.toBe(accessToken);
    });

    it('should return 401 for missing refresh token', async () => {
      const response = await request(app).post('/auth/refresh').expect(401);

      expect(response.body.error).toBe('Refresh token required');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid refresh token');
    });

    it('should work with refresh token in request body', async () => {
      const response = await request(app).post('/auth/refresh').send({ refreshToken }).expect(200);

      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.accessToken).toBeDefined();
    });
  });

  describe('POST /auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get refresh token
      const registerResponse = await request(app).post('/auth/register').send({
        email: 'logout@example.com',
        password: 'password123',
        name: 'Logout User',
      });

      // Extract refresh token from cookies
      const cookies = registerResponse.headers['set-cookie'];
      refreshToken =
        cookies
          ?.find((cookie: string) => cookie.startsWith('refreshToken='))
          ?.split('=')[1]
          ?.split(';')[0] || '';
    });

    it('should logout successfully with cookie', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');

      // Check that refresh token cookie is cleared
      const setCookieHeaders = response.headers['set-cookie'];
      if (setCookieHeaders) {
        const clearedCookie = setCookieHeaders.find((cookie: string) =>
          cookie.includes('refreshToken=;'),
        );
        expect(clearedCookie).toBeDefined();
      }
    });

    it('should logout successfully with refresh token in body', async () => {
      const response = await request(app).post('/auth/logout').send({ refreshToken }).expect(200);

      expect(response.body.message).toBe('Logout successful');
    });

    it('should handle logout without token gracefully', async () => {
      const response = await request(app).post('/auth/logout').expect(200);

      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('Authentication Middleware', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      const registerResponse = await request(app).post('/auth/register').send({
        email: 'middleware@example.com',
        password: 'password123',
        name: 'Middleware User',
      });

      accessToken = registerResponse.body.accessToken;
    });

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.user.email).toBe('middleware@example.com');
      expect(response.body.user.name).toBe('Middleware User');
    });

    it('should reject access without token', async () => {
      const response = await request(app).get('/api/profile').expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid or expired access token');
    });

    it('should reject access with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});
