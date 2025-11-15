import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteModal } from './InviteModal';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('InviteModal', () => {
  const mockOnClose = jest.fn();
  const mockOnInvite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders invite form', () => {
    render(
      <InviteModal familyId="family-1" onClose={mockOnClose} onInvite={mockOnInvite} />,
    );

    expect(screen.getByText('Invite Family Member')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Invite' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('submits invitation with email', async () => {
    const user = userEvent.setup();
    mockOnInvite.mockResolvedValue({
      data: { token: 'test-token-123' },
    });

    render(
      <InviteModal familyId="family-1" onClose={mockOnClose} onInvite={mockOnInvite} />,
    );

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: 'Send Invite' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnInvite).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('displays shareable link after successful invite', async () => {
    const user = userEvent.setup();
    mockOnInvite.mockResolvedValue({
      data: { token: 'test-token-123' },
    });

    render(
      <InviteModal familyId="family-1" onClose={mockOnClose} onInvite={mockOnInvite} />,
    );

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: 'Send Invite' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invitation created!')).toBeInTheDocument();
      expect(screen.getByText('Share this link:')).toBeInTheDocument();
    });

    const linkInput = screen.getByDisplayValue(/family\/family-1\/invite\/test-token-123/);
    expect(linkInput).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <InviteModal familyId="family-1" onClose={mockOnClose} onInvite={mockOnInvite} />,
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables submit button when email is empty', () => {
    render(
      <InviteModal familyId="family-1" onClose={mockOnClose} onInvite={mockOnInvite} />,
    );

    const submitButton = screen.getByRole('button', { name: 'Send Invite' });
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    mockOnInvite.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { token: 'test' } }), 100)),
    );

    render(
      <InviteModal familyId="family-1" onClose={mockOnClose} onInvite={mockOnInvite} />,
    );

    const emailInput = screen.getByLabelText('Email Address');
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: 'Send Invite' });
    await user.click(submitButton);

    expect(screen.getByText('Sending...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Send Invite')).toBeInTheDocument();
    });
  });
});
