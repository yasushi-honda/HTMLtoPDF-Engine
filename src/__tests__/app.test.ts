import request from 'supertest';
import { app } from '../app';

describe('App', () => {
  it('should have CORS enabled', async () => {
    const response = await request(app)
      .options('/api/pdf')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers['access-control-allow-origin']).toBeDefined();
    expect(response.headers['access-control-allow-methods']).toBeDefined();
  });

  it('should have security headers enabled', async () => {
    const response = await request(app).get('/api/pdf');
    
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBeDefined();
  });
});
