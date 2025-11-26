import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvitationsList } from './InvationsList';
import type { FamilyInvitation } from '@/lib/api/family';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('InvitationsList', () => {
  const mockOnResend = jest.fn();
  const mockInvitations: FamilyInvitation[] = [
    {
      id: '1',
      familyId: 'family-1',
      email: 'test@example.com',
      token: 'token-1',
      status: 'pending',
      createdAt: '2024-01-01T00:00:00.000Z',
      expiresAt: '2024-01-08T00:00:00.000Z',
      acceptedAt: null,
    },
    {
      id: '2',
      familyId: 'family-1',
      email: 'expired@example.com',
      token: 'token-2',
      status: 'pending',
      createdAt: '2024-01-01T00:00:00.000Z',
      expiresAt: '2024-01-01T00:00:00.000Z', // Expired
      acceptedAt: null,
    },
    {
      id: '3',
      familyId: 'family-1',
      email: 'accepted@example.com',
      token: 'token-3',
      status: 'accepted',
      createdAt: '2024-01-01T00:00:00.000Z',
      expiresAt: '2024-01-08T00:00:00.000Z',
      acceptedAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    render(<InvitationsList invitations={[]} isLoading={true} onResend={mockOnResend} />);
    
    expect(screen.getByText('Loading invitations...')).toBeInTheDocument();
    expect(screen.getByRole('status', { hidden: true })).toHaveClass('animate-spin');
  });

  it('renders empty state', () => {
    render(<InvitationsList invitations={[]} isLoading={false} onResend={mockOnResend} />);
    
    expect(screen.getByText('No invitations found')).toBeInTheDocument();
  });

  it('renders pending and previous invitations', () => {
    render(<InvitationsList invitations={mockInvitations} isLoading={false} onResend={mockOnResend} />);
    
    // Pending invitations section
    expect(screen.getByText('Pending Invitations (1)')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Sent 1/1/2024 • Expires 1/8/2024')).toBeInTheDocument();
    expect(screen.getByText('Resend')).toBeInTheDocument();
    
    // Previous invitations section
    expect(screen.getByText('Previous Invitations')).toBeInTheDocument();
    expect(screen.getByText('expired@example.com')).toBeInTheDocument();
    expect(screen.getByText('accepted@example.com')).toBeInTheDocument();
    expect(screen.getByText('Accepted 1/2/2024')).toBeInTheDocument();
  });

  it('handles resend invitation click', async () => {
    render(<InvitationsList invitations={mockInvitations} isLoading={false} onResend={mockOnResend} />);
    
    const resendButton = screen.getByText('Resend');
    await userEvent.click(resendButton);
    
    expect(mockOnResend).toHaveBeenCalledWith('1');
  });

  it('displays correct status badges', () => {
    render(<InvitationsList invitations={mockInvitations} isLoading={false} onResend={mockOnResend} />);
    
    // Pending badge
    const pendingBadge = screen.getByText('Pending');
    expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    
    // Expired badge
    const expiredBadge = screen.getByText('Expired');
    expect(expiredBadge).toHaveClass('bg-gray-100', 'text-gray-800');
    
    // Accepted badge
    const acceptedBadge = screen.getByText('Accepted');
    expect(acceptedBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders only pending invitations when no previous ones', () => {
    const pendingOnly = mockInvitations.filter(inv => inv.status === 'pending' && new Date(inv.expiresAt) > new Date());
    render(<InvitationsList invitations={pendingOnly} isLoading={false} onResend={mockOnResend} />);
    
    expect(screen.getByText('Pending Invitations (1)')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.queryByText('Previous Invitations')).not.toBeInTheDocument();
  });

  it('renders only previous invitations when no pending ones', () => {
    const previousOnly = mockInvitations.filter(inv => inv.status !== 'pending' || new Date(inv.expiresAt) <= new Date());
    render(<InvitationsList invitations={previousOnly} isLoading={false} onResend={mockOnResend} />);
    
    expect(screen.queryByText('Pending Invitations')).not.toBeInTheDocument();
    expect(screen.getByText('Previous Invitations')).toBeInTheDocument();
    expect(screen.getByText('expired@example.com')).toBeInTheDocument();
    expect(screen.getByText('accepted@example.com')).toBeInTheDocument();
  });
});