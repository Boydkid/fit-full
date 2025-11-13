/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import BookingsPage from '../../pages/bookings';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
}));

jest.mock('../../../components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

jest.mock('../../../components/booking', () => ({
  BookingCard: ({ enrollment, onCancel, onViewDetails }: any) => (
    <div data-testid={`booking-card-${enrollment.enrollmentId}`}>
      <div>{enrollment.classTitle}</div>
      <div>{enrollment.status}</div>
      <button onClick={() => onCancel(enrollment.enrollmentId)} data-testid={`cancel-${enrollment.enrollmentId}`}>
        Cancel
      </button>
      <button onClick={() => onViewDetails(enrollment.enrollmentId)} data-testid={`view-${enrollment.enrollmentId}`}>
        View Details
      </button>
    </div>
  ),
  EnrollmentDisplay: () => <div>Enrollment Display</div>,
}));

jest.mock('../../../components/common', () => ({
  Button: ({ children, href, onClick, variant }: any) => (
    <a href={href} onClick={onClick} data-testid="button">
      {children}
    </a>
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

describe('BookingsPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
  };

  // Create a properly formatted JWT token
  const mockPayload = { id: 1, email: 'test@example.com' };
  // Base64Url encode the payload (replace + with -, / with _, and remove =)
  const payloadStr = JSON.stringify(mockPayload);
  const base64Payload = btoa(payloadStr)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  const mockToken = `header.${base64Payload}.signature`;
  
  const mockEnrollments = {
    user: {
      id: 1,
      email: 'test@example.com',
      role: 'USER',
    },
    enrollments: [
      {
        enrollmentId: 1,
        enrolledAt: '2024-01-01T00:00:00Z',
        class: {
          id: 1,
          title: 'Test Class',
          description: 'Test Description',
          startTime: '2024-12-01T10:00:00Z',
          endTime: '2024-12-01T12:00:00Z',
          capacity: 20,
          requiredRole: null,
          enrollmentCount: 5,
          availableSpots: 15,
          trainer: { id: 1, email: 'trainer@example.com', role: 'TRAINER', profileImage: null },
          createdBy: { id: 1, email: 'admin@example.com', role: 'ADMIN' },
          category: { id: 1, name: 'Fitness' },
        },
        hasStarted: false,
        status: 'UPCOMING',
        startsAt: '2024-12-01T10:00:00Z',
        endsAt: '2024-12-01T12:00:00Z',
        msUntilStart: 86400000,
        msUntilEnd: 93600000,
      },
      {
        enrollmentId: 2,
        enrolledAt: '2024-01-01T00:00:00Z',
        class: {
          id: 2,
          title: 'Past Class',
          description: 'Past Description',
          startTime: '2024-01-01T10:00:00Z',
          endTime: '2024-01-01T12:00:00Z',
          capacity: 20,
          requiredRole: null,
          enrollmentCount: 10,
          availableSpots: 10,
          trainer: { id: 2, email: 'trainer2@example.com', role: 'TRAINER', profileImage: null },
          createdBy: { id: 1, email: 'admin@example.com', role: 'ADMIN' },
          category: { id: 1, name: 'Fitness' },
        },
        hasStarted: true,
        status: 'ENDED',
        startsAt: '2024-01-01T10:00:00Z',
        endsAt: '2024-01-01T12:00:00Z',
        msUntilStart: -86400000,
        msUntilEnd: -83600000,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    localStorageMock.getItem.mockReturnValue(mockToken);
    
    // Mock atob to decode base64
    global.atob = jest.fn((str) => {
      try {
        return JSON.stringify(mockPayload);
      } catch {
        return '';
      }
    });
  });

  it('renders without crashing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEnrollments,
    });

    render(<BookingsPage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });
  });

  it('shows error when token is missing', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Please sign in/i)).toBeInTheDocument();
    });
  });

  it('shows error when token is invalid', async () => {
    localStorageMock.getItem.mockReturnValue('invalid-token');

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/User info missing/i)).toBeInTheDocument();
    });
  });

  it('displays bookings when loaded successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEnrollments,
    });

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Class')).toBeInTheDocument();
      expect(screen.getByText('Past Class')).toBeInTheDocument();
    });
  });

  it('displays loading state', async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: async () => mockEnrollments }), 100))
    );

    render(<BookingsPage />);

    expect(screen.getByText(/Loading data/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Loading data/i)).not.toBeInTheDocument();
    });
  });

  it('displays error when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('filters bookings by status', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEnrollments,
    });

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Class')).toBeInTheDocument();
    });

    // Use getAllByText and find the button (not the status in the card)
    const upcomingElements = screen.getAllByText(/Upcoming/i);
    const upcomingButton = upcomingElements.find(
      (el) => el.tagName === 'BUTTON' || el.textContent?.includes('(')
    ) || upcomingElements[0];
    
    fireEvent.click(upcomingButton);

    await waitFor(() => {
      expect(screen.getByText('Test Class')).toBeInTheDocument();
      expect(screen.queryByText('Past Class')).not.toBeInTheDocument();
    });
  });

  it('handles cancel booking', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnrollments,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Class')).toBeInTheDocument();
    });

    const cancelButton = screen.getByTestId('cancel-1');
    
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        '${process.env.NEXT_PUBLIC_API_URL}/api/users/1/classes/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('handles view details', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEnrollments,
    });

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Class')).toBeInTheDocument();
    });

    const viewButton = screen.getByTestId('view-1');
    
    await act(async () => {
      fireEvent.click(viewButton);
    });

    expect(mockPush).toHaveBeenCalledWith('/fitmateclass/1');
  });

  it('displays empty state when no bookings', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: 1, email: 'test@example.com', role: 'USER' },
        enrollments: [],
      }),
    });

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/No bookings found/i)).toBeInTheDocument();
    });
  });

  it('shows filter buttons with correct counts', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEnrollments,
    });

    render(<BookingsPage />);

    await waitFor(() => {
      expect(screen.getByText(/All \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Upcoming \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Ended \(1\)/i)).toBeInTheDocument();
    });
  });
});

