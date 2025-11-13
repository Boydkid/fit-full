/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MyClassesPage from '../../pages/my-classes';
import { useRouter } from 'next/router';
import { parseJwt } from '../../utils/auth';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../utils/auth', () => ({
  parseJwt: jest.fn(),
}));

jest.mock('../../../components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

jest.mock('../../../components/common', () => ({
  Card: ({ children, className, onClick }: any) => (
    <div className={className} onClick={onClick} data-testid="card">
      {children}
    </div>
  ),
  Button: ({ children, onClick, variant, className }: any) => (
    <button onClick={onClick} variant={variant} className={className} data-testid="button">
      {children}
    </button>
  ),
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

// Mock fetch
global.fetch = jest.fn();

describe('MyClassesPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    route: '/my-classes',
    pathname: '/my-classes',
    query: {},
    asPath: '/my-classes',
  };

  const mockToken = 'test-token';
  const mockPayload = { id: 1, email: 'trainer@example.com', role: 'TRAINER', exp: 9999999999 };

  const mockClassesResponse = {
    trainer: {
      id: 1,
      email: 'trainer@example.com',
    },
    classes: [
      {
        id: 1,
        title: 'Future Class',
        description: 'A future class',
        startTime: '2025-12-01T10:00:00Z',
        endTime: '2025-12-01T12:00:00Z',
        capacity: 20,
        requiredRole: null,
        enrollmentCount: 5,
        availableSpots: 15,
        category: { id: 1, name: 'Fitness' },
      },
      {
        id: 2,
        title: 'Past Class',
        description: 'A past class',
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T12:00:00Z',
        capacity: 20,
        requiredRole: null,
        enrollmentCount: 10,
        availableSpots: 10,
        category: { id: 1, name: 'Fitness' },
      },
      {
        id: 3,
        title: 'Ongoing Class',
        description: 'An ongoing class',
        startTime: '2024-01-01T08:00:00Z',
        endTime: '2024-12-31T20:00:00Z',
        capacity: 30,
        requiredRole: null,
        enrollmentCount: 15,
        availableSpots: 15,
        category: { id: 2, name: 'Yoga' },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    localStorageMock.getItem.mockReturnValue(mockToken);
    (parseJwt as jest.Mock).mockReturnValue(mockPayload);
  });

  it('renders without crashing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClassesResponse,
    });

    render(<MyClassesPage />);

    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });
  });

  it('shows error when token is missing', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<MyClassesPage />);

    await waitFor(() => {
      expect(screen.getByText(/กรุณาเข้าสู่ระบบก่อน/i)).toBeInTheDocument();
    });
  });

  it('shows error when user is not a trainer', async () => {
    (parseJwt as jest.Mock).mockReturnValue({ id: 1, email: 'user@example.com', role: 'USER', exp: 9999999999 });

    render(<MyClassesPage />);

    await waitFor(() => {
      expect(screen.getByText(/หน้านี้สำหรับเทรนเนอร์เท่านั้น/i)).toBeInTheDocument();
    });
  });

  it('displays classes when loaded successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClassesResponse,
    });

    render(<MyClassesPage />);

    await waitFor(() => {
      expect(screen.getByText('Future Class')).toBeInTheDocument();
      expect(screen.getByText('Past Class')).toBeInTheDocument();
      expect(screen.getByText('Ongoing Class')).toBeInTheDocument();
    });
  });

  it('displays loading state', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => mockClassesResponse }), 100))
    );

    render(<MyClassesPage />);

    expect(screen.getByText(/กำลังโหลดข้อมูล/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/กำลังโหลดข้อมูล/i)).not.toBeInTheDocument();
    });
  });

  it('displays error when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<MyClassesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('filters classes by status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClassesResponse,
    });

    render(<MyClassesPage />);

    await waitFor(() => {
      expect(screen.getByText('Future Class')).toBeInTheDocument();
    });

    // Use getAllByText and find the button (not the status badge in the card)
    const upcomingButtons = screen.getAllByText(/กำลังจะเริ่ม/i);
    const upcomingButton = upcomingButtons.find(
      (el) => el.tagName === 'BUTTON' || (el.parentElement?.tagName === 'BUTTON')
    ) || upcomingButtons[0];
    
    fireEvent.click(upcomingButton);

    await waitFor(() => {
      expect(screen.getByText('Future Class')).toBeInTheDocument();
      expect(screen.queryByText('Past Class')).not.toBeInTheDocument();
    });
  });

  it('shows filter buttons with correct counts', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClassesResponse,
    });

    render(<MyClassesPage />);

    await waitFor(() => {
      expect(screen.getByText(/ทั้งหมด \(3\)/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no classes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        trainer: { id: 1, email: 'trainer@example.com' },
        classes: [],
      }),
    });

    render(<MyClassesPage />);

    // Use getAllByText and check for the heading specifically
    await waitFor(() => {
      const emptyStateTexts = screen.getAllByText(/ยังไม่มีคลาส/i);
      expect(emptyStateTexts.length).toBeGreaterThan(0);
      // Check that it's in the heading (h3)
      const heading = emptyStateTexts.find((el) => el.tagName === 'H3');
      expect(heading).toBeInTheDocument();
    });
  });

  it('handles view details button click', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockClassesResponse,
    });

    render(<MyClassesPage />);

    await waitFor(() => {
      expect(screen.getByText('Future Class')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText(/ดูรายละเอียด/i);
    
    await act(async () => {
      fireEvent.click(viewButtons[0]);
    });

    expect(mockPush).toHaveBeenCalledWith('/fitmateclass/1');
  });

  it('handles API error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });

    render(<MyClassesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Unauthorized/i)).toBeInTheDocument();
    });
  });
});

