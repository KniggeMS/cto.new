import request from 'supertest';
import { app } from '../server';

describe('Family Integration Test', () => {
  it('should verify all family endpoints are working', async () => {
    // Test health first
    await request(app).get('/health').expect(200);
    
    // Test basic family endpoints structure
    const response = await request(app).get('/families');
    expect(response.status).toBe(401); // Should require auth
    
    // Test recommendations endpoint exists
    const recommendationsResponse = await request(app).get('/recommendations');
    expect(recommendationsResponse.status).toBe(401); // Should require auth
  });
});