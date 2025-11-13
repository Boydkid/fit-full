/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import CancelPage from '../../../pages/membership/cancel/index';
import { useRouter } from 'next/router';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('CancelPage', () => {
  const mockRouter = {
    push: jest.fn(),
    route: '/membership/cancel',
    pathname: '/membership/cancel',
    query: {},
    asPath: '/membership/cancel',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders without crashing', () => {
    render(<CancelPage />);
    expect(screen.getByText(/การชำระเงินไม่สำเร็จ/i)).toBeInTheDocument();
  });

  it('displays cancel message', () => {
    render(<CancelPage />);
    expect(screen.getByText(/คุณยกเลิกการชำระเงิน/i)).toBeInTheDocument();
  });

  it('displays session_id when provided in query', () => {
    mockRouter.query = { session_id: 'test-session-123456789' };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    render(<CancelPage />);
    expect(screen.getByText(/Session:/i)).toBeInTheDocument();
  });

  it('displays reason when provided in query', () => {
    mockRouter.query = { reason: 'user_cancelled' };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    render(<CancelPage />);
    expect(screen.getByText(/เหตุผล:/i)).toBeInTheDocument();
  });

  it('displays short session ID when session_id is long', () => {
    mockRouter.query = { session_id: 'very-long-session-id-123456789012345' };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    render(<CancelPage />);
    expect(screen.getByText(/Session:/i)).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<CancelPage />);
    expect(screen.getByText(/กลับไปเลือกแพ็กเกจ/i)).toBeInTheDocument();
    expect(screen.getByText(/กลับหน้าแรก/i)).toBeInTheDocument();
  });
});

