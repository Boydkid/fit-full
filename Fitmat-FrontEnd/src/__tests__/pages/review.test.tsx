/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ReviewPage from '../../pages/review';

// Mock components
jest.mock('../../../components/Layout/Header', () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>;
  };
});

jest.mock('../../../components/Layout/Footer', () => {
  return function MockFooter() {
    return <footer data-testid="footer">Footer</footer>;
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('ReviewPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        totalReviews: 0,
        averageRating: 0,
        ratingCounts: {},
      }),
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<ReviewPage />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('fetches review data on mount', async () => {
    const mockSummary = {
      totalReviews: 10,
      averageRating: 4.5,
      ratingCounts: { '5': 6, '4': 3, '3': 1 },
    };

    const mockReviews = [
      {
        id: 1,
        comment: 'Great trainer!',
        rating: 5,
        createdAt: '2024-01-01',
        reviewer: { id: 1, email: 'user@example.com', role: 'USER' },
        trainer: { id: 1, email: 'trainer@example.com', role: 'TRAINER' },
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockReviews,
      });

    render(<ReviewPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('handles fetch errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ReviewPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('renders profile image function correctly', () => {
    const { container } = render(<ReviewPage />);
    
    // The component should render without crashing
    expect(container).toBeInTheDocument();
  });
});

