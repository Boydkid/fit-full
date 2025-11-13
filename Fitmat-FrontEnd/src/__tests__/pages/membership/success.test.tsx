/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SuccessPage from '../../../pages/membership/success/index';
import { useRouter } from 'next/router';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.location.reload
Object.defineProperty(window, 'location', {
  value: {
    reload: jest.fn(),
  },
  writable: true,
});

describe('SuccessPage', () => {
  const mockRouter = {
    push: jest.fn(),
    route: '/membership/success',
    pathname: '/membership/success',
    query: {},
    asPath: '/membership/success',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders without crashing', () => {
    render(<SuccessPage />);
    expect(screen.getByText(/ชำระเงินสำเร็จ/i)).toBeInTheDocument();
  });

  it('displays missing session_id message when no session_id', () => {
    render(<SuccessPage />);
    expect(screen.getByText(/ไม่พบ session_id/i)).toBeInTheDocument();
  });

  it('displays session_id when provided in query', async () => {
    mockRouter.query = { session_id: 'test-session-123' };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        sessionId: 'test-session-123',
        purchase: { id: 'purchase-1', status: 'PAID' },
      }),
    });

    render(<SuccessPage />);

    await waitFor(() => {
      expect(screen.getByText(/Session:/i)).toBeInTheDocument();
    });
  });

  it('verifies payment on mount when session_id exists', async () => {
    mockRouter.query = { session_id: 'test-session-123' };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        sessionId: 'test-session-123',
        purchase: { id: 'purchase-1', status: 'PAID' },
        user: { id: 1, role: 'PREMIUM' },
      }),
    });

    render(<SuccessPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/stripe/verify?session_id=test-session-123')
      );
    });
  });

  it('handles verification errors', async () => {
    mockRouter.query = { session_id: 'test-session-123' };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Verification failed' }),
    });

    render(<SuccessPage />);

    await waitFor(() => {
      expect(screen.getByText(/ไม่สามารถตรวจสอบคำสั่งซื้อได้/i)).toBeInTheDocument();
    });
  });

  it('saves user role to localStorage after verification', async () => {
    mockRouter.query = { session_id: 'test-session-123' };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        sessionId: 'test-session-123',
        purchase: { id: 'purchase-1', status: 'PAID' },
        user: { id: 1, role: 'PREMIUM' },
      }),
    });

    render(<SuccessPage />);

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('role', 'PREMIUM');
    });
  });

  it('handles reissue token button click', async () => {
    mockRouter.query = { session_id: 'test-session-123' };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    localStorageMock.getItem.mockReturnValue('test-token');

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          sessionId: 'test-session-123',
          purchase: { id: 'purchase-1', status: 'PAID' },
          user: { id: 1, role: 'PREMIUM' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'new-token',
          user: { id: 1, role: 'PREMIUM' },
        }),
      });

    render(<SuccessPage />);

    await waitFor(() => {
      const reissueButton = screen.getByText(/รับสิทธิ์ทันที/i);
      fireEvent.click(reissueButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/reissue-token'),
        expect.objectContaining({
          method: 'POST',
          headers: { Authorization: 'Bearer test-token' },
        })
      );
    });
  });
});

