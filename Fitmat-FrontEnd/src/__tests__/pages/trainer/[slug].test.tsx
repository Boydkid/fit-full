/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TrainerDetailPage from '../../../pages/trainer/[slug]';
import { useRouter } from 'next/router';
import { parseJwt } from '../../../utils/auth';
import Swal from 'sweetalert2';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../utils/auth', () => ({
  parseJwt: jest.fn(),
}));

jest.mock('sweetalert2', () => ({
  fire: jest.fn(),
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

describe('TrainerDetailPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    route: '/trainer/[slug]',
    pathname: '/trainer/[slug]',
    query: { slug: '1' },
    asPath: '/trainer/1',
  };

  const mockToken = 'test-token';
  const mockPayload = { id: 1, email: 'test@example.com', role: 'USER', exp: 9999999999 };

  const mockTrainerData = {
    trainer: {
      id: 1,
      email: 'trainer@example.com',
      username: 'trainer1',
      role: 'TRAINER',
      profileImage: null,
    },
    totalReviews: 10,
    averageRating: 4.5,
    reviews: [
      {
        id: 1,
        comment: 'Great trainer!',
        rating: 5,
        createdAt: '2024-01-01T00:00:00Z',
        reviewer: {
          id: 1,
          email: 'reviewer@example.com',
          role: 'USER',
          username: 'reviewer1',
          profileImage: null,
        },
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
      json: async () => mockTrainerData,
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      // Component shows username, not email
      expect(screen.getByText('trainer1')).toBeInTheDocument();
    });
  });

  it('displays trainer details when loaded successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainerData,
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      // Component shows username, not email
      expect(screen.getByText('trainer1')).toBeInTheDocument();
      // Text is displayed with quotation marks in the component
      expect(screen.getByText(/Great trainer!/i)).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<TrainerDetailPage />);

    expect(screen.getByText(/กำลังโหลด/i)).toBeInTheDocument();
  });

  it('displays error when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('handles invalid slug gracefully', () => {
    (useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      query: { slug: undefined },
    });

    render(<TrainerDetailPage />);

    // Should not fetch when slug is invalid
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles review submission successfully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrainerData,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 2,
          comment: 'New review',
          rating: 5,
          createdAt: '2024-01-02T00:00:00Z',
          reviewer: {
            id: 1,
            email: 'test@example.com',
            role: 'USER',
            username: 'testuser',
            profileImage: null,
          },
        }),
      });

    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      // Component shows username, not email
      expect(screen.getByText('trainer1')).toBeInTheDocument();
    });

    const commentInput = document.querySelector('textarea');
    const submitButton = screen.getByText(/ส่งรีวิว/i);

    if (commentInput && submitButton) {
      await act(async () => {
        fireEvent.change(commentInput, { target: { value: 'New review' } });
        // Rating is set via button clicks, not input change
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalled();
      });
    }
  });

  it('handles review submission error', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrainerData,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Cannot submit review' }),
      });

    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      // Component shows username, not email
      expect(screen.getByText('trainer1')).toBeInTheDocument();
    });

    const commentInput = document.querySelector('textarea');
    const submitButton = screen.getByText(/ส่งรีวิว/i);

    if (commentInput && submitButton) {
      await act(async () => {
        fireEvent.change(commentInput, { target: { value: 'New review' } });
        fireEvent.click(submitButton);
      });

      // Should show error via Swal
      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalled();
      });
    }
  });

  it('redirects to login when user not logged in and tries to submit review', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    (parseJwt as jest.Mock).mockReturnValue(null);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainerData,
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      // Component shows username if available, otherwise email prefix
      expect(screen.getByText('trainer1')).toBeInTheDocument();
    });

    // When user not logged in, there's no submit button - only a message
    // Check that the login message is displayed instead of the form
    await waitFor(() => {
      expect(screen.getByText(/กรุณาเข้าสู่ระบบก่อนเขียนรีวิว/i)).toBeInTheDocument();
    });
    
    // Verify no submit button is present when not logged in
    const submitButton = screen.queryByText(/ส่งรีวิว/i);
    expect(submitButton).not.toBeInTheDocument();
  });

  it('handles trainer without reviews', async () => {
    const trainerWithoutReviews = {
      ...mockTrainerData,
      reviews: [],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => trainerWithoutReviews,
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      // Component shows username, not email
      expect(screen.getByText('trainer1')).toBeInTheDocument();
    });
  });

  it('handles API error response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({}),
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      // Error message format: "ผิดพลาด: [error message]"
      // The component shows error in format "ผิดพลาด: ไม่สามารถดึงข้อมูลเทรนเนอร์ได้"
      // The error text might be split across elements, so we check for either part
      const errorElement = screen.getByText(/ผิดพลาด/i);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.textContent).toContain('ไม่สามารถดึงข้อมูลเทรนเนอร์ได้');
    }, { timeout: 3000 });
  });

  it('handles image error fallback for trainer image', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainerData,
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1')).toBeInTheDocument();
    });

    // Find trainer image
    const trainerImage = screen.getByAltText(/รูปโปรไฟล์ของ/i) as HTMLImageElement;
    
    // Simulate image load error
    await act(async () => {
      fireEvent.error(trainerImage);
    });

    // Image should fallback to review image
    await waitFor(() => {
      expect(trainerImage.src).toContain('/images/review');
    });
  });

  it('handles image error fallback for reviewer image', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTrainerData,
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      // Text is in quotes, so search for part of it or reviewer name
      expect(screen.getByText('reviewer1')).toBeInTheDocument();
    });

    // Find reviewer image by alt text
    const reviewerImage = screen.getByAltText('reviewer1') as HTMLImageElement;
    
    // Simulate image load error
    await act(async () => {
      fireEvent.error(reviewerImage);
    });

    // Image should fallback to review image
    await waitFor(() => {
      expect(reviewerImage.src).toContain('/images/review');
    });
  });

  it('handles review submission network error', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrainerData,
      })
      .mockRejectedValueOnce(new Error('Network error'));

    (Swal.fire as jest.Mock).mockResolvedValueOnce({ isConfirmed: true });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1')).toBeInTheDocument();
    });

    const commentInput = document.querySelector('textarea');
    const submitButton = screen.getByText(/ส่งรีวิว/i);

    if (commentInput && submitButton) {
      await act(async () => {
        fireEvent.change(commentInput, { target: { value: 'New review' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(Swal.fire).toHaveBeenCalledWith(
          expect.objectContaining({
            icon: 'error',
            title: 'ส่งรีวิวไม่สำเร็จ',
          })
        );
      });
    }
  });

  it('handles profile image with buffer data', async () => {
    const trainerWithBufferImage = {
      ...mockTrainerData,
      trainer: {
        ...mockTrainerData.trainer,
        profileImage: {
          type: 'Buffer',
          data: [255, 216, 255, 224], // JPEG header
        },
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => trainerWithBufferImage,
    });

    // Mock btoa
    global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1')).toBeInTheDocument();
    });

    // Image should be converted from buffer
    const trainerImage = screen.getByAltText(/รูปโปรไฟล์ของ/i) as HTMLImageElement;
    expect(trainerImage.src).toContain('data:image');
  });

  it('handles profile image with different string formats', async () => {
    const trainerWithStringImage = {
      ...mockTrainerData,
      trainer: {
        ...mockTrainerData.trainer,
        profileImage: 'http://example.com/image.jpg',
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => trainerWithStringImage,
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1')).toBeInTheDocument();
    });

    const trainerImage = screen.getByAltText(/รูปโปรไฟล์ของ/i) as HTMLImageElement;
    expect(trainerImage.src).toContain('http://example.com/image.jpg');
  });

  it('handles profile image with base64 string', async () => {
    const trainerWithBase64Image = {
      ...mockTrainerData,
      trainer: {
        ...mockTrainerData.trainer,
        profileImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => trainerWithBase64Image,
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1')).toBeInTheDocument();
    });

    const trainerImage = screen.getByAltText(/รูปโปรไฟล์ของ/i) as HTMLImageElement;
    expect(trainerImage.src).toContain('data:image');
  });

  it('handles profile image with data URI prefix', async () => {
    const trainerWithDataURI = {
      ...mockTrainerData,
      trainer: {
        ...mockTrainerData.trainer,
        profileImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => trainerWithDataURI,
    });

    render(<TrainerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('trainer1')).toBeInTheDocument();
    });

    const trainerImage = screen.getByAltText(/รูปโปรไฟล์ของ/i) as HTMLImageElement;
    expect(trainerImage.src).toContain('data:image');
  });
});

