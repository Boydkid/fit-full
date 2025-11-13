import express from 'express';
import stripeRoutes from '../routes/stripe.routes';

describe('Stripe Routes', () => {
  it('should export router', () => {
    expect(stripeRoutes).toBeDefined();
  });

  it('should be an express router', () => {
    const app = express();
    app.use('/api/stripe', stripeRoutes);
    expect(app).toBeDefined();
  });
});


