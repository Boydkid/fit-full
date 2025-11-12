/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MembershipPage from '../../pages/membership';
import { useRouter } from 'next/router';
import { parseJwt } from '../../utils/auth';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../utils/auth', () => ({
  parseJwt: jest.fn(),
  getCurrentUser: jest.fn(() => null),
}), { virtual: true });

// Mock Layout component completely
jest.mock('../../../components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

// Mock Layout/Header separately if needed
jest.mock('../../../components/Layout/Header', () => ({
  __esModule: true,
  default: function MockHeader() {
    return <header data-testid="header">Header</header>;
  },
}));

jest.mock('../../../components/Layout/Footer', () => ({
  __esModule: true,
  default: function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  },
}));

jest.mock('../../../components/common', () => ({
  Button: ({ children, onClick, disabled, loading }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button">
      {loading ? 'Loading...' : children}
    </button>
  ),
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
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

describe('MembershipPage', () => {
  const mockRouter = {
    push: jest.fn(),
    route: '/membership',
    pathname: '/membership',
    query: {},
    asPath: '/membership',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders without crashing', () => {
    render(<MembershipPage />);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('renders membership plans', () => {
    render(<MembershipPage />);
    // Use getAllByText since plan names appear multiple times
    expect(screen.getAllByText(/Bronze/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Gold/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Platinum/i).length).toBeGreaterThan(0);
  });

  it('handles checkout when user is logged in', async () => {
    const token = 'valid-token';
    const payload = { id: 1, role: 'USER', exp: 9999999999 };
    
    localStorageMock.getItem.mockReturnValue(token);
    (parseJwt as jest.Mock).mockReturnValue(payload);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/pay/123' }),
    });

    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(<MembershipPage />);

    // Wait for component to load user data
    await waitFor(() => {
      expect(screen.getByText(/User ID/i)).toBeInTheDocument();
    });

    // Find and click the checkout button (should be "อัปเกรดตอนนี้")
    const checkoutButtons = screen.getAllByText(/อัปเกรดตอนนี้/i);
    expect(checkoutButtons.length).toBeGreaterThan(0);
    
    fireEvent.click(checkoutButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('handles checkout errors', async () => {
    const token = 'valid-token';
    const payload = { id: 1, role: 'USER', exp: 9999999999 };
    
    localStorageMock.getItem.mockReturnValue(token);
    (parseJwt as jest.Mock).mockReturnValue(payload);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Checkout failed' }),
    });

    render(<MembershipPage />);

    // Wait for component to load user data
    await waitFor(() => {
      expect(screen.getByText(/User ID/i)).toBeInTheDocument();
    });

    // Find and click the checkout button to trigger the error
    const checkoutButtons = screen.getAllByText(/อัปเกรดตอนนี้/i);
    expect(checkoutButtons.length).toBeGreaterThan(0);
    
    fireEvent.click(checkoutButtons[0]);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Checkout failed/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('auto-selects plan from query parameter', async () => {
    mockRouter.query = { plan: 'gold' };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    const token = 'valid-token';
    const payload = { id: 1, role: 'USER', exp: 9999999999 };
    
    localStorageMock.getItem.mockReturnValue(token);
    (parseJwt as jest.Mock).mockReturnValue(payload);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'https://checkout.stripe.com/pay/123' }),
    });

    delete (window as any).location;
    (window as any).location = { href: '' };

    render(<MembershipPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

