/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../../pages/index';

// Mock components
jest.mock('../../../components/Layout/Layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>;
  };
});

jest.mock('../../../components/home', () => ({
  HeroSection: () => <div data-testid="hero-section">Hero Section</div>,
  ExpertSection: () => <div data-testid="expert-section">Expert Section</div>,
  ReviewsSection: () => <div data-testid="reviews-section">Reviews Section</div>,
  PricingSection: () => <div data-testid="pricing-section">Pricing Section</div>,
  CTASection: () => <div data-testid="cta-section">CTA Section</div>,
}));

jest.mock('../../../components/common', () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="fade-in">{children}</div>
  ),
}));

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  it('renders all sections', () => {
    render(<Home />);
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('expert-section')).toBeInTheDocument();
    expect(screen.getByTestId('reviews-section')).toBeInTheDocument();
    expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
    expect(screen.getByTestId('cta-section')).toBeInTheDocument();
  });

  it('wraps sections in FadeIn components', () => {
    const { container } = render(<Home />);
    const fadeIns = container.querySelectorAll('[data-testid="fade-in"]');
    expect(fadeIns.length).toBeGreaterThan(0);
  });
});

