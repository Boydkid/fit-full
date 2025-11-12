/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../../pages/login';
import { login, setAuth } from '../../utils/auth';
import { useRouter } from 'next/router';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../utils/auth', () => ({
  login: jest.fn(),
  setAuth: jest.fn(),
}));

jest.mock('../../../components/auth/AuthForm', () => {
  return function MockAuthForm({
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    error,
    onSubmit,
  }: any) {
    return (
      <form onSubmit={onSubmit} data-testid="auth-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="email-input"
        />
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="password-input"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          data-testid="toggle-password"
        >
          Toggle
        </button>
        {error && <div data-testid="error">{error}</div>}
        {loading && <div data-testid="loading">Loading...</div>}
        <button type="submit" disabled={loading}>
          Submit
        </button>
      </form>
    );
  };
});

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    route: '/login',
    pathname: '/login',
    query: {},
    asPath: '/login',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('auth-form')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    const mockLoginResponse = {
      token: 'test-token',
      user: { id: 1, email: 'test@example.com', role: 'USER' },
    };

    (login as jest.Mock).mockResolvedValueOnce(mockLoginResponse);

    render(<LoginPage />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const form = screen.getByTestId('auth-form');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    await waitFor(() => {
      expect(setAuth).toHaveBeenCalledWith('test-token', 'USER');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('handles login errors', async () => {
    const errorMessage = 'Invalid credentials';
    (login as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    render(<LoginPage />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const form = screen.getByTestId('auth-form');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
    });
  });

  it('shows loading state during submission', async () => {
    (login as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<LoginPage />);

    const form = screen.getByTestId('auth-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });
});

