/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../../pages/register';
import { register } from '../../utils/auth';
import { useRouter } from 'next/router';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../utils/auth', () => ({
  register: jest.fn(),
}));

jest.mock('../../../components/auth/AuthForm', () => {
  return function MockAuthForm({
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
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
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          data-testid="confirm-password-input"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          data-testid="toggle-password"
        >
          Toggle Password
        </button>
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          data-testid="toggle-confirm-password"
        >
          Toggle Confirm Password
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

describe('RegisterPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    route: '/register',
    pathname: '/register',
    query: {},
    asPath: '/register',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders register form', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('auth-form')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
  });

  it('handles form submission successfully', async () => {
    const mockRegisterResponse = {
      token: 'test-token',
      user: { id: 1, email: 'newuser@example.com', role: 'USER' },
    };

    (register as jest.Mock).mockResolvedValueOnce(mockRegisterResponse);

    render(<RegisterPage />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const form = screen.getByTestId('auth-form');

    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('newuser@example.com', 'password123');
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('validates password match', async () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const form = screen.getByTestId('auth-form');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Passwords do not match.');
    });

    expect(register).not.toHaveBeenCalled();
  });

  it('handles registration errors', async () => {
    const errorMessage = 'Email already exists';
    (register as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    render(<RegisterPage />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const form = screen.getByTestId('auth-form');

    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
    });
  });

  it('shows loading state during submission', async () => {
    (register as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<RegisterPage />);

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const form = screen.getByTestId('auth-form');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });
});

