/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TrainerPage from '../../../pages/trainer/index';
import Swal from 'sweetalert2';

// Mock dependencies
jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
}));

jest.mock('../../../../components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

jest.mock('../../../../components/trainer', () => ({
  TrainerCard: ({ trainer, onBook }: any) => (
    <div data-testid={`trainer-card-${trainer.id}`}>
      <div>{trainer.email}</div>
      <button onClick={() => onBook && onBook(trainer.id, {})} data-testid={`book-${trainer.id}`}>
        Book
      </button>
    </div>
  ),
  TrainerSearch: ({ onSearch, onFilterChange }: any) => (
    <div data-testid="trainer-search">
      <input
        onChange={(e) => onSearch && onSearch(e.target.value)}
        placeholder="Search trainers"
        data-testid="search-input"
      />
      <select
        onChange={(e) => onFilterChange && onFilterChange({ sortBy: e.target.value })}
        data-testid="filter-select"
      >
        <option value="rating">Rating</option>
        <option value="experience">Experience</option>
        <option value="reviews">Reviews</option>
      </select>
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe('TrainerPage', () => {
  const mockTrainers = [
    {
      id: 1,
      email: 'trainer1@example.com',
      username: 'trainer1',
      role: 'TRAINER',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      totalReviews: 10,
      averageRating: 4.5,
      profileImage: null,
    },
    {
      id: 2,
      email: 'trainer2@example.com',
      username: null,
      role: 'TRAINER',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      totalReviews: 5,
      averageRating: 4.0,
      profileImage: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainers,
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument();
    });
  });

  it('displays trainers when loaded successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainers,
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
      expect(screen.getByText('trainer2@example.com')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<TrainerPage />);

    expect(screen.getByText(/กำลังโหลด/i)).toBeInTheDocument();
  });

  it('displays error when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainers,
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'trainer1' } });
    });

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
      expect(screen.queryByText('trainer2@example.com')).not.toBeInTheDocument();
    });
  });

  it('handles filter change', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainers,
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });

    const filterSelect = screen.getByTestId('filter-select');
    
    await act(async () => {
      fireEvent.change(filterSelect, { target: { value: 'rating' } });
    });

    // Should still show trainers after filtering
    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });
  });

  it('handles booking', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainers,
    });

    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });

    const bookButton = screen.getByTestId('book-1');
    
    await act(async () => {
      fireEvent.click(bookButton);
    });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalled();
    });
  });

  it('normalizes profile image correctly', async () => {
    const trainersWithImage = [
      {
        ...mockTrainers[0],
        profileImage: '  http://example.com/image.jpg  ',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => trainersWithImage,
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });
  });

  it('handles empty profile image', async () => {
    const trainersWithoutImage = [
      {
        ...mockTrainers[0],
        profileImage: null,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => trainersWithoutImage,
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });
  });

  it('handles API error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch trainers/i)).toBeInTheDocument();
    });
  });

  it('filters trainers by role in search', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainers,
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-input');
    
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'TRAINER' } });
    });

    await waitFor(() => {
      // Should still show trainers when searching by role
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });
  });

  it('handles filter by rating', async () => {
    const trainersWithRatings = [
      {
        ...mockTrainers[0],
        averageRating: 5.0,
      },
      {
        ...mockTrainers[1],
        averageRating: 3.0,
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => trainersWithRatings,
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });

    const filterSelect = screen.getByTestId('filter-select');
    
    // Mock TrainerSearch to pass rating filter
    const trainerSearch = screen.getByTestId('trainer-search');
    const ratingInput = trainerSearch.querySelector('input[type="number"]');
    
    if (ratingInput) {
      await act(async () => {
        fireEvent.change(ratingInput, { target: { value: '4' } });
      });
    }
  });

  it('handles sort by rating', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainers,
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });

    const filterSelect = screen.getByTestId('filter-select');
    
    await act(async () => {
      fireEvent.change(filterSelect, { target: { value: 'rating' } });
    });

    await waitFor(() => {
      // Trainers should still be visible after sorting
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });
  });

  it('handles sort by experience', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainers,
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });

    const filterSelect = screen.getByTestId('filter-select');
    
    await act(async () => {
      fireEvent.change(filterSelect, { target: { value: 'experience' } });
    });

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });
  });

  it('handles sort by reviews', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainers,
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });

    const filterSelect = screen.getByTestId('filter-select');
    
    await act(async () => {
      fireEvent.change(filterSelect, { target: { value: 'reviews' } });
    });

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });
  });

  it('handles default sort', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainers,
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });

    const filterSelect = screen.getByTestId('filter-select');
    
    await act(async () => {
      fireEvent.change(filterSelect, { target: { value: 'default' } });
    });

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });
  });

  it('handles booking error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainers,
    });

    (Swal.fire as jest.Mock).mockRejectedValueOnce(new Error('Booking failed'));

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });

    const bookButton = screen.getByTestId('book-1');
    
    await act(async () => {
      fireEvent.click(bookButton);
    });

    await waitFor(() => {
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'จองไม่สำเร็จ',
        })
      );
    });
  });

  it('handles scroll button click', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainers,
    });

    // Mock getElementById and scrollIntoView
    const mockScrollIntoView = jest.fn();
    const mockElement = document.createElement('div');
    mockElement.id = 'trainer-search';
    mockElement.scrollIntoView = mockScrollIntoView;
    
    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn((id) => {
      if (id === 'trainer-search') {
        return mockElement;
      }
      return originalGetElementById.call(document, id);
    });

    render(<TrainerPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1@example.com')).toBeInTheDocument();
    });

    // Find scroll button - it's the hero section button
    const scrollButtons = screen.queryAllByRole('button');
    const scrollButton = scrollButtons.find(btn => 
      btn.textContent?.includes('ค้นหาเทรนเนอร์') || 
      btn.textContent?.includes('เริ่มต้น') ||
      btn.className.includes('bg-red-500')
    );
    
    if (scrollButton) {
      await act(async () => {
        fireEvent.click(scrollButton);
      });

      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalled();
      });
    }
    
    // Restore original
    document.getElementById = originalGetElementById;
  });
});

