/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../../components/common/Input';

describe('Input Component', () => {
  it('renders input with value', () => {
    render(
      <Input
        value="test value"
        onChange={() => {}}
      />
    );
    
    const input = screen.getByDisplayValue('test value');
    expect(input).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(
      <Input
        label="Email"
        value=""
        onChange={() => {}}
      />
    );
    
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = jest.fn();
    render(
      <Input
        value=""
        onChange={handleChange}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('shows error message when error is provided', () => {
    render(
      <Input
        value=""
        onChange={() => {}}
        error="This field is required"
      />
    );
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies error styling when error exists', () => {
    render(
      <Input
        value=""
        onChange={() => {}}
        error="Error message"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('border-red-300');
  });

  it('renders password toggle button when showPasswordToggle is true', () => {
    const handleToggle = jest.fn();
    render(
      <Input
        type="password"
        value=""
        onChange={() => {}}
        showPasswordToggle
        onTogglePassword={handleToggle}
        showPassword={false}
      />
    );
    
    const toggleButton = screen.getByLabelText('Show password');
    expect(toggleButton).toBeInTheDocument();
  });

  it('calls onTogglePassword when toggle button is clicked', () => {
    const handleToggle = jest.fn();
    render(
      <Input
        type="password"
        value=""
        onChange={() => {}}
        showPasswordToggle
        onTogglePassword={handleToggle}
        showPassword={false}
      />
    );
    
    const toggleButton = screen.getByLabelText('Show password');
    fireEvent.click(toggleButton);
    
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('shows correct label for password toggle', () => {
    const { rerender } = render(
      <Input
        type="password"
        value=""
        onChange={() => {}}
        showPasswordToggle
        onTogglePassword={() => {}}
        showPassword={false}
      />
    );
    
    expect(screen.getByLabelText('Show password')).toBeInTheDocument();
    
    rerender(
      <Input
        type="password"
        value=""
        onChange={() => {}}
        showPasswordToggle
        onTogglePassword={() => {}}
        showPassword={true}
      />
    );
    
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
  });

  it('uses correct input type', () => {
    render(
      <Input
        type="email"
        value=""
        onChange={() => {}}
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('applies required attribute when required is true', () => {
    render(
      <Input
        value=""
        onChange={() => {}}
        required
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('applies placeholder', () => {
    render(
      <Input
        value=""
        onChange={() => {}}
        placeholder="Enter your email"
      />
    );
    
    const input = screen.getByPlaceholderText('Enter your email');
    expect(input).toBeInTheDocument();
  });
});


