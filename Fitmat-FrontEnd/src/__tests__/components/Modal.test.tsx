/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../components/common/Modal';

describe('Modal Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow
    document.body.style.overflow = '';
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={mockOnClose}>
        Modal Content
      </Modal>
    );

    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('renders modal content when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        Modal Content
      </Modal>
    );

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Title">
        Content
      </Modal>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        Content
      </Modal>
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        Content
      </Modal>
    );

    const backdrop = container.querySelector('.absolute.inset-0');
    expect(backdrop).toBeInTheDocument();
    
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Title">
        Content
      </Modal>
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        Content
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('applies correct size classes', () => {
    const { rerender, container } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="sm">
        Content
      </Modal>
    );
    let modal = container.querySelector('.max-w-md');
    expect(modal).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="lg">
        Content
      </Modal>
    );
    modal = container.querySelector('.max-w-2xl');
    expect(modal).toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="xl">
        Content
      </Modal>
    );
    modal = container.querySelector('.max-w-4xl');
    expect(modal).toBeInTheDocument();
  });

  it('blocks body overflow when open', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        Content
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when closed', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        Content
      </Modal>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={mockOnClose}>
        Content
      </Modal>
    );

    expect(document.body.style.overflow).toBe('unset');
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        Content
      </Modal>
    );

    unmount();

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});

