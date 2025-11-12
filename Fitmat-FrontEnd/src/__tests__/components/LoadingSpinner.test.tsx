/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders spinner', () => {
    render(<LoadingSpinner />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders text when provided', () => {
    render(<LoadingSpinner text="Loading..." />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('does not render text when not provided', () => {
    const { container } = render(<LoadingSpinner />);
    const textElement = container.querySelector('p');
    expect(textElement).not.toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender, container } = render(<LoadingSpinner size="sm" />);
    let spinner = container.querySelector('.animate-spin');
    expect(spinner?.className).toContain('w-6');
    
    rerender(<LoadingSpinner size="md" />);
    spinner = container.querySelector('.animate-spin');
    expect(spinner?.className).toContain('w-12');
    
    rerender(<LoadingSpinner size="lg" />);
    spinner = container.querySelector('.animate-spin');
    expect(spinner?.className).toContain('w-16');
  });

  it('applies correct color classes', () => {
    const { rerender, container } = render(<LoadingSpinner color="red" />);
    let spinner = container.querySelector('.animate-spin');
    expect(spinner?.className).toContain('border-red-500');
    
    rerender(<LoadingSpinner color="blue" />);
    spinner = container.querySelector('.animate-spin');
    expect(spinner?.className).toContain('border-blue-500');
    
    rerender(<LoadingSpinner color="gray" />);
    spinner = container.querySelector('.animate-spin');
    expect(spinner?.className).toContain('border-gray-500');
  });

  it('applies custom className', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('applies correct text color based on spinner color', () => {
    const { rerender } = render(
      <LoadingSpinner text="Loading" color="red" />
    );
    let text = screen.getByText('Loading');
    expect(text.className).toContain('text-red-600');
    
    rerender(<LoadingSpinner text="Loading" color="blue" />);
    text = screen.getByText('Loading');
    expect(text.className).toContain('text-blue-600');
    
    rerender(<LoadingSpinner text="Loading" color="gray" />);
    text = screen.getByText('Loading');
    expect(text.className).toContain('text-gray-600');
  });
});


