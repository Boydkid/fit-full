/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomerManagementSystem from '../../pages/customermanagementsystem';
import { useRouter } from 'next/router';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../components/admin/ClassControl', () => ({
  __esModule: true,
  default: function MockClassControl({ userId, token, className }: any) {
    return <div data-testid="class-control">Class Control (User: {userId}, Token: {token})</div>;
  },
}));

jest.mock('../../../components/admin/ClassCategory', () => ({
  __esModule: true,
  default: function MockClassCategory({ userId, token, className }: any) {
    return <div data-testid="class-category">Class Category (User: {userId}, Token: {token})</div>;
  },
}));

jest.mock('../../../components/admin/ContactControl', () => ({
  __esModule: true,
  default: function MockContactControl({ userId, token }: any) {
    return <div data-testid="contact-control">Contact Control (User: {userId}, Token: {token})</div>;
  },
}));

jest.mock('../../../components/admin/ReviewControl', () => ({
  __esModule: true,
  default: function MockReviewControl({ userId, token }: any) {
    return <div data-testid="review-control">Review Control (User: {userId}, Token: {token})</div>;
  },
}));

jest.mock('../../../components/admin/TrainerControl', () => ({
  __esModule: true,
  default: function MockTrainerControl({ userId, token }: any) {
    return <div data-testid="trainer-control">Trainer Control (User: {userId}, Token: {token})</div>;
  },
}));

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

describe('CustomerManagementSystem', () => {
  const mockRouter = {
    back: jest.fn(),
    push: jest.fn(),
    route: '/customermanagementsystem',
    pathname: '/customermanagementsystem',
    query: {},
    asPath: '/customermanagementsystem',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders without crashing', () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<CustomerManagementSystem />);
    // Use getAllByText since the text appears in multiple places
    expect(screen.getAllByText(/Customer Management System/i).length).toBeGreaterThan(0);
  });

  it('shows sign in message when no token', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<CustomerManagementSystem />);
    
    await waitFor(() => {
      expect(screen.getByText(/Please sign in/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows admin dashboard when user is admin', async () => {
    // Create a valid JWT token with ADMIN role
    const payload = { id: 123, role: 'ADMIN', exp: 9999999999 };
    const base64Payload = btoa(JSON.stringify(payload));
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${base64Payload}.signature`;
    
    localStorageMock.getItem.mockReturnValue(token);

    render(<CustomerManagementSystem />);

    await waitFor(() => {
      expect(screen.getByTestId('class-control')).toBeInTheDocument();
      expect(screen.getByTestId('class-category')).toBeInTheDocument();
      expect(screen.getByTestId('trainer-control')).toBeInTheDocument();
      expect(screen.getByTestId('review-control')).toBeInTheDocument();
      expect(screen.getByTestId('contact-control')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows access denied when user is not admin', async () => {
    // Create a valid JWT token with USER role
    const payload = { id: 2, role: 'USER', exp: 9999999999 };
    const base64Payload = btoa(JSON.stringify(payload));
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${base64Payload}.signature`;
    
    localStorageMock.getItem.mockReturnValue(token);

    render(<CustomerManagementSystem />);

    await waitFor(() => {
      expect(screen.getByText(/You need administrator access/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles back button click', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<CustomerManagementSystem />);

    await waitFor(() => {
      const backButton = screen.getByLabelText(/Go back/i);
      if (backButton) {
        fireEvent.click(backButton);
        expect(mockRouter.back).toHaveBeenCalled();
      }
    }, { timeout: 2000 });
  });
});

