/**
 * @jest-environment node
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../pages/api/hello';

describe('/api/hello', () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('should return 200 with name', async () => {
    await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ name: 'John Doe' });
  });
});


