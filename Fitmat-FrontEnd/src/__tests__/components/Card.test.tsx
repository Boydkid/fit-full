/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Card from '../../../components/common/Card';

describe('Card Component', () => {
  it('renders children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies base classes', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white', 'rounded-2xl');
  });

  it('applies shadow by default', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('shadow-lg');
  });

  it('does not apply shadow when shadow is false', () => {
    const { container } = render(<Card shadow={false}>Content</Card>);
    const card = container.firstChild;
    expect(card).not.toHaveClass('shadow-lg');
  });

  it('applies hover classes when hover is true', () => {
    const { container } = render(<Card hover>Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('hover:scale-105', 'transition-transform', 'duration-300');
  });

  it('does not apply hover classes when hover is false', () => {
    const { container } = render(<Card hover={false}>Content</Card>);
    const card = container.firstChild;
    expect(card).not.toHaveClass('hover:scale-105');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });
});


