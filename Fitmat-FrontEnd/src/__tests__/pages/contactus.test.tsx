/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Contact from '../../pages/contactus';

// Mock components
jest.mock('../../../components/Layout/Header', () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>;
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('Contact Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Contact />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
  });

  it('renders contact form', () => {
    render(<Contact />);
    expect(screen.getByPlaceholderText(/Please enter your full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your phone number/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add subject here/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe your message here/i)).toBeInTheDocument();
  });

  it('handles form input changes', () => {
    render(<Contact />);
    
    const nameInput = screen.getByPlaceholderText(/Please enter your full name/i) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(/Enter your email address/i) as HTMLInputElement;
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    
    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
  });

  it('handles form submission successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(<Contact />);

    const nameInput = screen.getByPlaceholderText(/Please enter your full name/i) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(/Enter your email address/i) as HTMLInputElement;
    const phoneInput = screen.getByPlaceholderText(/Enter your phone number/i) as HTMLInputElement;
    const subjectInput = screen.getByPlaceholderText(/Add subject here/i) as HTMLInputElement;
    const messageInput = screen.getByPlaceholderText(/Describe your message here/i) as HTMLTextAreaElement;
    const submitButton = screen.getByText('Send Message');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(messageInput, { target: { value: 'Test Message' } });
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/✅ ส่งข้อความเรียบร้อยแล้ว/i)).toBeInTheDocument();
    });
  });

  it('handles form submission errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Failed to send message' }),
    });

    render(<Contact />);

    const nameInput = screen.getByPlaceholderText(/Please enter your full name/i) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(/Enter your email address/i) as HTMLInputElement;
    const phoneInput = screen.getByPlaceholderText(/Enter your phone number/i) as HTMLInputElement;
    const subjectInput = screen.getByPlaceholderText(/Add subject here/i) as HTMLInputElement;
    const messageInput = screen.getByPlaceholderText(/Describe your message here/i) as HTMLTextAreaElement;
    const submitButton = screen.getByText('Send Message');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(subjectInput, { target: { value: 'Test Subject' } });
    fireEvent.change(messageInput, { target: { value: 'Test Message' } });
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to send message/i)).toBeInTheDocument();
    });
  });
});

