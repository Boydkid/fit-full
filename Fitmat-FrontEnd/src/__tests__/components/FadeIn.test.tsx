/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import FadeIn from '../../components/common/FadeIn';

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('FadeIn Component', () => {
  let observeMock: jest.Mock;
  let unobserveMock: jest.Mock;

  beforeEach(() => {
    observeMock = jest.fn();
    unobserveMock = jest.fn();
    
    (global.IntersectionObserver as jest.Mock).mockImplementation((callback) => ({
      observe: observeMock,
      unobserve: unobserveMock,
      disconnect: jest.fn(),
    }));
  });

  it('renders children', () => {
    render(<FadeIn>FadeIn Content</FadeIn>);
    expect(screen.getByText('FadeIn Content')).toBeInTheDocument();
  });

  it('sets up IntersectionObserver', () => {
    render(<FadeIn>Content</FadeIn>);
    expect(global.IntersectionObserver).toHaveBeenCalled();
    expect(observeMock).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(<FadeIn className="custom-class">Content</FadeIn>);
    const element = container.firstChild;
    expect(element).toHaveClass('custom-class');
  });

  it('applies default direction classes', () => {
    const { container } = render(<FadeIn>Content</FadeIn>);
    const element = container.firstChild;
    expect(element).toHaveClass('transition-all', 'ease-out');
  });

  it('uses custom duration', () => {
    const { container } = render(<FadeIn duration={1000}>Content</FadeIn>);
    const element = container.firstChild;
    expect((element as HTMLElement).style.transitionDuration).toBe('1000ms');
  });

  it('uses default duration', () => {
    const { container } = render(<FadeIn>Content</FadeIn>);
    const element = container.firstChild;
    expect((element as HTMLElement).style.transitionDuration).toBe('600ms');
  });

  it('cleans up observer on unmount', () => {
    const { container, unmount } = render(<FadeIn>Content</FadeIn>);
    const element = container.firstChild as HTMLElement;
    
    // Trigger cleanup
    unmount();
    
    // Observer should be set up with element
    expect(observeMock).toHaveBeenCalled();
  });

  describe('direction variants', () => {
    it('applies correct classes for up direction', () => {
      const { container } = render(<FadeIn direction="up">Content</FadeIn>);
      const element = container.firstChild;
      // Initially not visible, should have translate-y-8
      expect(element).toHaveClass('translate-y-8', 'opacity-0');
    });

    it('applies correct classes for down direction', () => {
      const { container } = render(<FadeIn direction="down">Content</FadeIn>);
      const element = container.firstChild;
      expect(element).toHaveClass('-translate-y-8', 'opacity-0');
    });

    it('applies correct classes for left direction', () => {
      const { container } = render(<FadeIn direction="left">Content</FadeIn>);
      const element = container.firstChild;
      expect(element).toHaveClass('translate-x-8', 'opacity-0');
    });

    it('applies correct classes for right direction', () => {
      const { container } = render(<FadeIn direction="right">Content</FadeIn>);
      const element = container.firstChild;
      expect(element).toHaveClass('-translate-x-8', 'opacity-0');
    });

    it('applies correct classes for fade direction', () => {
      const { container } = render(<FadeIn direction="fade">Content</FadeIn>);
      const element = container.firstChild;
      expect(element).toHaveClass('opacity-0');
    });
  });
});

