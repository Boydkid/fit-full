/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../components/common/Button';

describe('Button Component', () => {
  it('renders button with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    const button = screen.getByText('Click Me');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Click Me</Button>);
    
    const button = screen.getByText('Click Me');
    fireEvent.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<Button loading>Click Me</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Click Me')).not.toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<Button loading>Click Me</Button>);
    const button = screen.getByText('Loading...').closest('button');
    expect(button).toBeDisabled();
  });

  it('renders as anchor when href is provided', () => {
    render(<Button href="/test">Link</Button>);
    const link = screen.getByText('Link');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/test');
  });

  it('applies correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Button</Button>);
    let button = screen.getByText('Button');
    expect(button.className).toContain('from-red-600');
    
    rerender(<Button variant="secondary">Button</Button>);
    button = screen.getByText('Button');
    expect(button.className).toContain('bg-gray-900');
    
    rerender(<Button variant="outline">Button</Button>);
    button = screen.getByText('Button');
    expect(button.className).toContain('border-red-500');
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<Button size="sm">Button</Button>);
    let button = screen.getByText('Button');
    expect(button.className).toContain('text-sm');
    
    rerender(<Button size="lg">Button</Button>);
    button = screen.getByText('Button');
    expect(button.className).toContain('text-lg');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Button</Button>);
    const button = screen.getByText('Button');
    expect(button.className).toContain('custom-class');
  });

  it('uses correct type attribute', () => {
    render(<Button type="submit">Submit</Button>);
    const button = screen.getByText('Submit');
    expect(button).toHaveAttribute('type', 'submit');
  });
});


