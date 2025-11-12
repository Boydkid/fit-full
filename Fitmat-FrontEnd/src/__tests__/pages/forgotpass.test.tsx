/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordPage from '../../pages/forgotpass';
import { useRouter } from 'next/router';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ForgotPasswordPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    route: '/forgotpass',
    pathname: '/forgotpass',
    query: {},
    asPath: '/forgotpass',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders without crashing', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getAllByText(/ขอรีเซ็ตรหัสผ่าน/i).length).toBeGreaterThan(0);
  });

  it('renders email input', () => {
    render(<ForgotPasswordPage />);
    const emailInput = screen.getByLabelText(/อีเมล/i);
    expect(emailInput).toBeInTheDocument();
  });

  it('handles email input change', () => {
    render(<ForgotPasswordPage />);
    const emailInput = screen.getByLabelText(/อีเมล/i);
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('handles form submission successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/อีเมล/i);
    const submitButton = screen.getByText(/ส่งคำขอรีเซ็ตรหัสผ่าน/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/request-password-reset'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com' }),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/เราได้ส่งโทเคน/i)).toBeInTheDocument();
    });
  });

  it('handles form submission errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Email not found' }),
    });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/อีเมล/i);
    const submitButton = screen.getByText(/ส่งคำขอรีเซ็ตรหัสผ่าน/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Email not found/i)).toBeInTheDocument();
    });
  });

  it('shows reset password link after success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/อีเมล/i);
    const submitButton = screen.getByText(/ส่งคำขอรีเซ็ตรหัสผ่าน/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/ไปรีเซ็ตรหัสผ่าน/i)).toBeInTheDocument();
    });

    const resetButton = screen.getByText(/ไปรีเซ็ตรหัสผ่าน/i);
    fireEvent.click(resetButton);

    expect(mockPush).toHaveBeenCalledWith('/resetpass');
  });
});

