/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ResetPasswordPage from '../../pages/resetpass';
import { useRouter } from 'next/router';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('ResetPasswordPage', () => {
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
    route: '/resetpass',
    pathname: '/resetpass',
    query: {},
    asPath: '/resetpass',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<ResetPasswordPage />);
    expect(screen.getAllByText(/รีเซ็ตรหัสผ่าน/i).length).toBeGreaterThan(0);
  });

  it('renders verify token form initially', () => {
    render(<ResetPasswordPage />);
    const tokenInput = screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i) || 
                      screen.getAllByRole('textbox')[0];
    expect(tokenInput).toBeInTheDocument();
  });

  it('handles token verification successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ email: 'test@example.com' }),
    });

    render(<ResetPasswordPage />);

    const tokenInput = screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i) || 
                      screen.getAllByRole('textbox')[0];
    const verifyButton = screen.getAllByText(/ยืนยันโทเคน/i).find(btn => 
      btn.tagName === 'BUTTON'
    ) || screen.getByRole('button', { name: /ยืนยันโทเคน/i });

    fireEvent.change(tokenInput, { target: { value: 'test-token-123' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/verify-reset-token'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resetToken: 'test-token-123' }),
        })
      );
    });

    jest.advanceTimersByTime(1600);

      await waitFor(() => {
        const passwordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i) || 
                             screen.getAllByRole('textbox').find(input => 
                               (input as HTMLInputElement).type === 'password'
                             );
        expect(passwordInput).toBeInTheDocument();
      });
  });

  it('validates empty token', async () => {
    render(<ResetPasswordPage />);

    const verifyButton = screen.getAllByText(/ยืนยันโทเคน/i).find(btn => 
      btn.tagName === 'BUTTON'
    ) || screen.getByRole('button', { name: /ยืนยันโทเคน/i });
    
    // Submit form with empty token
    const form = verifyButton?.closest('form');
    if (form) {
      fireEvent.submit(form);
    } else {
      fireEvent.click(verifyButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/กรุณากรอกโทเคน/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles password reset successfully', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<ResetPasswordPage />);

    // Step 1: Verify token
    const tokenInput = screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i) || 
                      screen.getAllByRole('textbox')[0];
    const verifyButton = screen.getAllByText(/ยืนยันโทเคน/i).find(btn => 
      btn.tagName === 'BUTTON'
    ) || screen.getByRole('button', { name: /ยืนยันโทเคน/i });

    fireEvent.change(tokenInput, { target: { value: 'test-token-123' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(1600);

    // Step 2: Reset password
    await waitFor(() => {
      const newPasswordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i) || 
                              screen.getAllByRole('textbox').find(input => 
                                (input as HTMLInputElement).type === 'password'
                              ) || screen.getAllByRole('textbox')[0];
      expect(newPasswordInput).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i) || 
                            screen.getAllByRole('textbox').find(input => 
                              (input as HTMLInputElement).type === 'password'
                            ) || screen.getAllByRole('textbox')[0];
    const confirmPasswordInput = screen.getByPlaceholderText(/ยืนยันรหัสผ่านใหม่/i) || 
                                screen.getAllByRole('textbox').find((input, idx) => 
                                  (input as HTMLInputElement).type === 'password' && input !== newPasswordInput
                                ) || screen.getAllByRole('textbox')[1];
    const resetButton = screen.getAllByText(/รีเซ็ตรหัสผ่าน/i).find(btn => 
      btn.tagName === 'BUTTON' && (btn as HTMLButtonElement).type === 'submit'
    ) || screen.getByRole('button', { name: /รีเซ็ตรหัสผ่าน/i });

    fireEvent.change(newPasswordInput as HTMLInputElement, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmPasswordInput as HTMLInputElement, { target: { value: 'newpassword123' } });
    fireEvent.click(resetButton as HTMLElement);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reset-password'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    jest.advanceTimersByTime(2100);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('validates password match', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ email: 'test@example.com' }),
    });

    render(<ResetPasswordPage />);

    // Verify token first
    const tokenInput = screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i) || 
                      screen.getAllByRole('textbox')[0];
    const verifyButton = screen.getAllByText(/ยืนยันโทเคน/i).find(btn => 
      btn.tagName === 'BUTTON'
    ) || screen.getByRole('button', { name: /ยืนยันโทเคน/i });

    fireEvent.change(tokenInput, { target: { value: 'test-token' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(1600);

    await waitFor(() => {
      const newPasswordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i) || 
                              screen.getAllByRole('textbox').find(input => 
                                (input as HTMLInputElement).type === 'password'
                              );
      expect(newPasswordInput).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i) || 
                            screen.getAllByRole('textbox').find(input => 
                              (input as HTMLInputElement).type === 'password'
                            );
    const confirmPasswordInput = screen.getByPlaceholderText(/ยืนยันรหัสผ่านใหม่/i) || 
                                screen.getAllByRole('textbox').find((input, idx) => 
                                  (input as HTMLInputElement).type === 'password' && input !== newPasswordInput
                                );
    const resetButton = screen.getAllByText(/รีเซ็ตรหัสผ่าน/i).find(btn => 
      btn.tagName === 'BUTTON' && (btn as HTMLButtonElement).type === 'submit'
    );

    fireEvent.change(newPasswordInput as HTMLInputElement, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput as HTMLInputElement, { target: { value: 'differentpassword' } });
    fireEvent.click(resetButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText(/รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน/i)).toBeInTheDocument();
    });
  });

  it('validates password length', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ email: 'test@example.com' }),
    });

    render(<ResetPasswordPage />);

    // Verify token first
    const tokenInput = screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i) || 
                      screen.getAllByRole('textbox')[0];
    const verifyButton = screen.getAllByText(/ยืนยันโทเคน/i).find(btn => 
      btn.tagName === 'BUTTON'
    ) || screen.getByRole('button', { name: /ยืนยันโทเคน/i });

    fireEvent.change(tokenInput, { target: { value: 'test-token' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(1600);

    await waitFor(() => {
      const newPasswordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i) || 
                              screen.getAllByRole('textbox').find(input => 
                                (input as HTMLInputElement).type === 'password'
                              );
      expect(newPasswordInput).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i) || 
                            screen.getAllByRole('textbox').find(input => 
                              (input as HTMLInputElement).type === 'password'
                            );
    const confirmPasswordInput = screen.getByPlaceholderText(/ยืนยันรหัสผ่านใหม่/i) || 
                                screen.getAllByRole('textbox').find((input, idx) => 
                                  (input as HTMLInputElement).type === 'password' && input !== newPasswordInput
                                );
    const resetButton = screen.getAllByText(/รีเซ็ตรหัสผ่าน/i).find(btn => 
      btn.tagName === 'BUTTON' && (btn as HTMLButtonElement).type === 'submit'
    );

    fireEvent.change(newPasswordInput as HTMLInputElement, { target: { value: '12345' } }); // Too short
    fireEvent.change(confirmPasswordInput as HTMLInputElement, { target: { value: '12345' } });
    fireEvent.click(resetButton as HTMLElement);

           await waitFor(() => {
             expect(screen.getAllByText(/รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร/i).length).toBeGreaterThan(0);
           });
  });

  it('handles token verification error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ResetPasswordPage />);

    const tokenInput = screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i) || 
                      screen.getAllByRole('textbox')[0];
    const verifyButton = screen.getAllByText(/ยืนยันโทเคน/i).find(btn => 
      btn.tagName === 'BUTTON'
    ) || screen.getByRole('button', { name: /ยืนยันโทเคน/i });

    fireEvent.change(tokenInput, { target: { value: 'test-token' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('handles token verification API error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid token' }),
    });

    render(<ResetPasswordPage />);

    const tokenInput = screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i) || 
                      screen.getAllByRole('textbox')[0];
    const verifyButton = screen.getAllByText(/ยืนยันโทเคน/i).find(btn => 
      btn.tagName === 'BUTTON'
    ) || screen.getByRole('button', { name: /ยืนยันโทเคน/i });

    fireEvent.change(tokenInput, { target: { value: 'invalid-token' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid token/i)).toBeInTheDocument();
    });
  });

  it('handles password reset error', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      })
      .mockRejectedValueOnce(new Error('Network error'));

    render(<ResetPasswordPage />);

    // Step 1: Verify token
    const tokenInput = screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i) || 
                      screen.getAllByRole('textbox')[0];
    const verifyButton = screen.getAllByText(/ยืนยันโทเคน/i).find(btn => 
      btn.tagName === 'BUTTON'
    ) || screen.getByRole('button', { name: /ยืนยันโทเคน/i });

    fireEvent.change(tokenInput, { target: { value: 'test-token' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(1600);

    // Step 2: Reset password with error
    await waitFor(() => {
      const newPasswordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i);
      expect(newPasswordInput).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/ยืนยันรหัสผ่านใหม่/i);
    const resetButton = screen.getAllByText(/รีเซ็ตรหัสผ่าน/i).find(btn => 
      btn.tagName === 'BUTTON' && (btn as HTMLButtonElement).type === 'submit'
    );

    fireEvent.change(newPasswordInput as HTMLInputElement, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput as HTMLInputElement, { target: { value: 'newpass123' } });
    fireEvent.click(resetButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('handles password reset API error', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ email: 'test@example.com' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Reset failed' }),
      });

    render(<ResetPasswordPage />);

    // Step 1: Verify token
    const tokenInput = screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i) || 
                      screen.getAllByRole('textbox')[0];
    const verifyButton = screen.getAllByText(/ยืนยันโทเคน/i).find(btn => 
      btn.tagName === 'BUTTON'
    ) || screen.getByRole('button', { name: /ยืนยันโทเคน/i });

    fireEvent.change(tokenInput, { target: { value: 'test-token' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(1600);

    // Step 2: Reset password
    await waitFor(() => {
      const newPasswordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i);
      expect(newPasswordInput).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/ยืนยันรหัสผ่านใหม่/i);
    const resetButton = screen.getAllByText(/รีเซ็ตรหัสผ่าน/i).find(btn => 
      btn.tagName === 'BUTTON' && (btn as HTMLButtonElement).type === 'submit'
    );

    fireEvent.change(newPasswordInput as HTMLInputElement, { target: { value: 'newpass123' } });
    fireEvent.change(confirmPasswordInput as HTMLInputElement, { target: { value: 'newpass123' } });
    fireEvent.click(resetButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText(/Reset failed/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility for new password', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ email: 'test@example.com' }),
    });

    render(<ResetPasswordPage />);

    // Verify token first
    const tokenInput = screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i) || 
                      screen.getAllByRole('textbox')[0];
    const verifyButton = screen.getAllByText(/ยืนยันโทเคน/i).find(btn => 
      btn.tagName === 'BUTTON'
    ) || screen.getByRole('button', { name: /ยืนยันโทเคน/i });

    fireEvent.change(tokenInput, { target: { value: 'test-token' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(1600);

    await waitFor(() => {
      const newPasswordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i);
      expect(newPasswordInput).toBeInTheDocument();
    });

    const newPasswordInput = screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i) as HTMLInputElement;
    const toggleButton = newPasswordInput.parentElement?.querySelector('button');
    
    if (toggleButton) {
      expect(newPasswordInput.type).toBe('password');
      
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(newPasswordInput.type).toBe('text');
      });

      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(newPasswordInput.type).toBe('password');
      });
    }
  });

  it('toggles password visibility for confirm password', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ email: 'test@example.com' }),
    });

    render(<ResetPasswordPage />);

    // Verify token first
    const tokenInput = screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i) || 
                      screen.getAllByRole('textbox')[0];
    const verifyButton = screen.getAllByText(/ยืนยันโทเคน/i).find(btn => 
      btn.tagName === 'BUTTON'
    ) || screen.getByRole('button', { name: /ยืนยันโทเคน/i });

    fireEvent.change(tokenInput, { target: { value: 'test-token' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(1600);

    await waitFor(() => {
      const confirmPasswordInput = screen.getByPlaceholderText(/ยืนยันรหัสผ่านใหม่/i);
      expect(confirmPasswordInput).toBeInTheDocument();
    });

    const confirmPasswordInput = screen.getByPlaceholderText(/ยืนยันรหัสผ่านใหม่/i) as HTMLInputElement;
    const toggleButton = confirmPasswordInput.parentElement?.querySelector('button');
    
    if (toggleButton) {
      expect(confirmPasswordInput.type).toBe('password');
      
      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(confirmPasswordInput.type).toBe('text');
      });

      fireEvent.click(toggleButton);
      
      await waitFor(() => {
        expect(confirmPasswordInput.type).toBe('password');
      });
    }
  });

  it('handles back button to verify step', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ email: 'test@example.com' }),
    });

    render(<ResetPasswordPage />);

    // Verify token first
    const tokenInput = screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i) || 
                      screen.getAllByRole('textbox')[0];
    const verifyButton = screen.getAllByText(/ยืนยันโทเคน/i).find(btn => 
      btn.tagName === 'BUTTON'
    ) || screen.getByRole('button', { name: /ยืนยันโทเคน/i });

    fireEvent.change(tokenInput, { target: { value: 'test-token' } });
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    jest.advanceTimersByTime(1600);

    // Should be on reset step
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ใส่รหัสผ่านใหม่/i)).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByText(/กลับไปกรอกโทเคนใหม่/i);
    
    await act(async () => {
      fireEvent.click(backButton);
    });

    await waitFor(() => {
      // Should be back on verify step
      expect(screen.getByPlaceholderText(/ใส่โทเคนที่ได้รับจากอีเมล/i)).toBeInTheDocument();
    });
  });
});

