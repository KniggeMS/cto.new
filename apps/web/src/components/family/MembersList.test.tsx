import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MembersList } from './MembersList';
import type { FamilyMembership } from '@/lib/api/family';

const mockMembers: FamilyMembership[] = [
  {
    id: 'mem-1',
    userId: 'user-1',
    familyId: 'family-1',
    role: 'owner',
    joinedAt: '2023-01-01T00:00:00Z',
    user: {
      id: 'user-1',
      email: 'owner@example.com',
      name: 'Owner User',
    },
  },
  {
    id: 'mem-2',
    userId: 'user-2',
    familyId: 'family-1',
    role: 'admin',
    joinedAt: '2023-01-02T00:00:00Z',
    user: {
      id: 'user-2',
      email: 'admin@example.com',
      name: 'Admin User',
    },
  },
  {
    id: 'mem-3',
    userId: 'user-3',
    familyId: 'family-1',
    role: 'member',
    joinedAt: '2023-01-03T00:00:00Z',
    user: {
      id: 'user-3',
      email: 'member@example.com',
      name: null,
    },
  },
];

describe('MembersList', () => {
  const mockOnRemoveMember = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    render(
      <MembersList
        members={[]}
        isLoading={true}
        currentUserId="user-1"
        isOwner={true}
        onRemoveMember={mockOnRemoveMember}
      />,
    );

    expect(screen.getByText('Loading members...')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <MembersList
        members={[]}
        isLoading={false}
        currentUserId="user-1"
        isOwner={true}
        onRemoveMember={mockOnRemoveMember}
      />,
    );

    expect(screen.getByText('No members found')).toBeInTheDocument();
  });

  it('renders all members', () => {
    render(
      <MembersList
        members={mockMembers}
        isLoading={false}
        currentUserId="user-1"
        isOwner={true}
        onRemoveMember={mockOnRemoveMember}
      />,
    );

    expect(screen.getByText('Family Members (3)')).toBeInTheDocument();
    expect(screen.getByText('Owner User')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('member@example.com')).toBeInTheDocument();
  });

  it('displays role badges correctly', () => {
    render(
      <MembersList
        members={mockMembers}
        isLoading={false}
        currentUserId="user-1"
        isOwner={true}
        onRemoveMember={mockOnRemoveMember}
      />,
    );

    expect(screen.getByText('owner')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('member')).toBeInTheDocument();
  });

  it('marks current user with (You) label', () => {
    render(
      <MembersList
        members={mockMembers}
        isLoading={false}
        currentUserId="user-1"
        isOwner={true}
        onRemoveMember={mockOnRemoveMember}
      />,
    );

    expect(screen.getByText('(You)')).toBeInTheDocument();
  });

  it('shows remove button for owner on non-owner members', () => {
    render(
      <MembersList
        members={mockMembers}
        isLoading={false}
        currentUserId="user-1"
        isOwner={true}
        onRemoveMember={mockOnRemoveMember}
      />,
    );

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    expect(removeButtons).toHaveLength(2);
  });

  it('does not show remove button for non-owner users', () => {
    render(
      <MembersList
        members={mockMembers}
        isLoading={false}
        currentUserId="user-2"
        isOwner={false}
        onRemoveMember={mockOnRemoveMember}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('does not show remove button for current user', () => {
    render(
      <MembersList
        members={mockMembers}
        isLoading={false}
        currentUserId="user-1"
        isOwner={true}
        onRemoveMember={mockOnRemoveMember}
      />,
    );

    const ownerCard = screen.getByText('Owner User').closest('div');
    expect(ownerCard).not.toHaveTextContent('Remove');
  });

  it('calls onRemoveMember when remove button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MembersList
        members={mockMembers}
        isLoading={false}
        currentUserId="user-1"
        isOwner={true}
        onRemoveMember={mockOnRemoveMember}
      />,
    );

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    await user.click(removeButtons[0]);

    expect(mockOnRemoveMember).toHaveBeenCalledWith('user-2');
  });

  it('displays email as fallback when name is not available', () => {
    render(
      <MembersList
        members={mockMembers}
        isLoading={false}
        currentUserId="user-1"
        isOwner={true}
        onRemoveMember={mockOnRemoveMember}
      />,
    );

    const memberEmails = screen.getAllByText('member@example.com');
    expect(memberEmails.length).toBeGreaterThan(0);
  });
});
