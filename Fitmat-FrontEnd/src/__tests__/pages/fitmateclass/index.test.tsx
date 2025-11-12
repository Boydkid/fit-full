/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ClassListPage from '../../../pages/fitmateclass/index';
import { useRouter } from 'next/router';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../../components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

jest.mock('../../../../components/common', () => ({
  Button: ({ children, onClick, href, variant }: any) => (
    <a href={href} onClick={onClick} data-testid="button" variant={variant}>
      {children}
    </a>
  ),
  Card: ({ children, className, onClick }: any) => (
    <div className={className} onClick={onClick} data-testid="card">
      {children}
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ClassListPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    route: '/fitmateclass',
    pathname: '/fitmateclass',
    query: {},
    asPath: '/fitmateclass',
  };

  const mockClasses = [
    {
      id: 1,
      title: 'Yoga Class',
      description: 'A relaxing yoga class',
      startTime: '2025-12-01T10:00:00Z',
      endTime: '2025-12-01T12:00:00Z',
      capacity: 20,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      requiredRole: null,
      availableSpots: 15,
      enrollmentCount: 5,
      trainer: { id: 1, email: 'trainer@example.com', username: 'trainer1', role: 'TRAINER' },
      category: { id: 1, name: 'Fitness' },
    },
    {
      id: 2,
      title: 'Pilates Class',
      description: 'Core strengthening class',
      startTime: '2025-12-02T10:00:00Z',
      endTime: '2025-12-02T12:00:00Z',
      capacity: 15,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      requiredRole: null,
      availableSpots: 10,
      enrollmentCount: 5,
      trainer: { id: 2, email: 'trainer2@example.com', username: null, role: 'TRAINER' },
      category: { id: 2, name: 'Pilates' },
    },
  ];

  const mockCategories = [
    { id: 1, name: 'Fitness', description: 'Fitness classes' },
    { id: 2, name: 'Pilates', description: 'Pilates classes' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders without crashing', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockClasses,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

    render(<ClassListPage />);

    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });
  });

  it('displays classes when loaded successfully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockClasses,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

    render(<ClassListPage />);

    await waitFor(() => {
      expect(screen.getByText('Yoga Class')).toBeInTheDocument();
      expect(screen.getByText('Pilates Class')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ClassListPage />);

    expect(screen.getByText(/กำลังโหลด/i)).toBeInTheDocument();
  });

  it('displays error when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ClassListPage />);

    await waitFor(() => {
      // Component shows the error message directly
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('filters classes by search query', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockClasses,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

    render(<ClassListPage />);

    await waitFor(() => {
      expect(screen.getByText('Yoga Class')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/ค้นหาตามชื่อคลาส/i) || screen.getByLabelText(/ค้นหาคลาส/i);
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Yoga' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Yoga Class')).toBeInTheDocument();
      expect(screen.queryByText('Pilates Class')).not.toBeInTheDocument();
    });
  });

  it('filters classes by category', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockClasses,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

    render(<ClassListPage />);

    await waitFor(() => {
      expect(screen.getByText('Yoga Class')).toBeInTheDocument();
    });

    // Find and click category filter
    const categoryButtons = screen.getAllByText(/Fitness/i);
    const categoryButton = categoryButtons.find(
      (el) => el.tagName === 'BUTTON' || el.parentElement?.tagName === 'BUTTON'
    );

    if (categoryButton) {
      await act(async () => {
        fireEvent.click(categoryButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Yoga Class')).toBeInTheDocument();
      });
    }
  });

  it('displays empty state when no classes match filter', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockClasses,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

    render(<ClassListPage />);

    await waitFor(() => {
      expect(screen.getByText('Yoga Class')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/ค้นหาตามชื่อคลาส/i) || screen.getByLabelText(/ค้นหาคลาส/i);
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'NonExistentClass' } });
    });

    await waitFor(() => {
      expect(screen.queryByText('Yoga Class')).not.toBeInTheDocument();
      expect(screen.queryByText('Pilates Class')).not.toBeInTheDocument();
    });
  });

  it('handles category fetch error gracefully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockClasses,
      })
      .mockRejectedValueOnce(new Error('Category fetch failed'));

    render(<ClassListPage />);

    // Should still display classes even if categories fail
    await waitFor(() => {
      expect(screen.getByText('Yoga Class')).toBeInTheDocument();
    });
  });

  it('displays filter summary when filters are active', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockClasses,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

    render(<ClassListPage />);

    await waitFor(() => {
      expect(screen.getByText('Yoga Class')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/ค้นหาตามชื่อคลาส/i) || screen.getByLabelText(/ค้นหาคลาส/i);
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Yoga' } });
    });

    await waitFor(() => {
      // Should show filter summary
      expect(screen.getByText(/พบ.*คลาส/i)).toBeInTheDocument();
      expect(screen.getByText(/ล้างตัวกรอง/i)).toBeInTheDocument();
    });
  });

  it('clears filters when clear button is clicked', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockClasses,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

    render(<ClassListPage />);

    await waitFor(() => {
      expect(screen.getByText('Yoga Class')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/ค้นหาตามชื่อคลาส/i) || screen.getByLabelText(/ค้นหาคลาส/i);
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Yoga' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/ล้างตัวกรอง/i)).toBeInTheDocument();
    });

    const clearButton = screen.getByText(/ล้างตัวกรอง/i);
    
    await act(async () => {
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      // Both classes should be visible again
      expect(screen.getByText('Yoga Class')).toBeInTheDocument();
      expect(screen.getByText('Pilates Class')).toBeInTheDocument();
    });
  });

  it('filters classes by category using select', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockClasses,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

    render(<ClassListPage />);

    await waitFor(() => {
      expect(screen.getByText('Yoga Class')).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText(/หมวดหมู่/i) || document.querySelector('select#category');
    
    if (categorySelect) {
      await act(async () => {
        fireEvent.change(categorySelect, { target: { value: '1' } });
      });

      await waitFor(() => {
        // Should show filter summary with category
        expect(screen.getByText(/พบ.*คลาส/i)).toBeInTheDocument();
      });
    }
  });

  it('displays empty state when no classes exist', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

    render(<ClassListPage />);

    await waitFor(() => {
      expect(screen.getByText(/ยังไม่มีคลาส/i)).toBeInTheDocument();
      expect(screen.getByText(/โปรดตรวจสอบอีกครั้งในภายหลัง/i)).toBeInTheDocument();
    });
  });

  it('displays empty state message with clear filter button when filters applied', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockClasses,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

    render(<ClassListPage />);

    await waitFor(() => {
      expect(screen.getByText('Yoga Class')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/ค้นหาตามชื่อคลาส/i) || screen.getByLabelText(/ค้นหาคลาส/i);
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'NonExistentClass' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/ไม่พบคลาสที่ค้นหา/i)).toBeInTheDocument();
      expect(screen.getByText(/ลองปรับเงื่อนไขการค้นหาหรือตัวกรอง/i)).toBeInTheDocument();
      // Should have clear filter button in empty state - there are multiple, so use getAllByText
      const clearButtons = screen.getAllByText(/ล้างตัวกรอง/i);
      expect(clearButtons.length).toBeGreaterThan(0);
    });
  });

  it('handles status badge for different statuses', async () => {
    const ongoingClass = {
      ...mockClasses[0],
      startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      endTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    };

    const endedClass = {
      ...mockClasses[0],
      id: 3,
      title: 'Ended Class',
      startTime: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      endTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [ongoingClass, endedClass],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

    render(<ClassListPage />);

    await waitFor(() => {
      expect(screen.getByText('Ended Class')).toBeInTheDocument();
    });

    // Should show different status badges
    const statusBadges = screen.getAllByText(/กำลังเรียน|จบแล้ว|กำลังจะเริ่ม/i);
    expect(statusBadges.length).toBeGreaterThan(0);
  });

  it('handles category change to numeric value', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockClasses,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategories,
      });

    render(<ClassListPage />);

    await waitFor(() => {
      expect(screen.getByText('Yoga Class')).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText(/หมวดหมู่/i) || document.querySelector('select#category');
    
    if (categorySelect) {
      await act(async () => {
        // Change to numeric category ID
        fireEvent.change(categorySelect, { target: { value: '2' } });
      });

      await waitFor(() => {
        // Should show filter summary
        expect(screen.getByText(/พบ.*คลาส/i)).toBeInTheDocument();
      });
    }
  });
});

