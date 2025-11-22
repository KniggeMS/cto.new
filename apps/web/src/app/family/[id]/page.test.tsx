import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FamilyDetailPage from './page';
import * as familyHooks from '@/lib/hooks/use-family';
import * as authContext from '@/lib/context/auth-context';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(() => ({ id: 'family-123' })),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/hooks/use-family');
jest.mock('@/lib/context/auth-context');

const mockFamily = {
  id: 'family-123',
  name: 'Test Family',
  createdBy: 'user-1',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  members: [
    {
      id: 'mem-1',
      userId: 'user-1',
      familyId: 'family-123',
      role: 'owner' as const,
      joinedAt: '2023-01-01T00:00:00Z',
      user: { id: 'user-1', email: 'owner@example.com', name: 'Owner' },
    },
  ],
  creator: { id: 'user-1', email: 'owner@example.com', name: 'Owner' },
};

describe('FamilyDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-1', email: 'owner@example.com' },
    });

    (familyHooks.useFamily as jest.Mock).mockReturnValue({
      data: mockFamily,
      isLoading: false,
    });

    (familyHooks.useFamilyMembers as jest.Mock).mockReturnValue({
      data: mockFamily.members,
      isLoading: false,
    });

    (familyHooks.useFamilyInvitations as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    (familyHooks.useFamilyWatchlists as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    (familyHooks.useFamilyRecommendations as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    (familyHooks.useInviteToFamily as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (familyHooks.useResendInvitation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (familyHooks.useRemoveMember as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
  });

  it('renders family dashboard with family name', () => {
    render(<FamilyDetailPage />);
    expect(screen.getByText('Test Family')).toBeInTheDocument();
  });

  it('shows loading state when family is loading', () => {
    (familyHooks.useFamily as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<FamilyDetailPage />);
    expect(screen.getByText('Loading family details...')).toBeInTheDocument();
  });

  it('displays all tabs', () => {
    render(<FamilyDetailPage />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Shared Watchlist')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Invitations')).toBeInTheDocument();
  });

  it('shows invite button for admins and owners', () => {
    render(<FamilyDetailPage />);
    expect(screen.getByRole('button', { name: 'Invite Member' })).toBeInTheDocument();
  });

  it('does not show invitations tab for non-admin members', () => {
    (familyHooks.useFamilyMembers as jest.Mock).mockReturnValue({
      data: [
        {
          id: 'mem-1',
          userId: 'user-2',
          familyId: 'family-123',
          role: 'member' as const,
          joinedAt: '2023-01-01T00:00:00Z',
          user: { id: 'user-2', email: 'member@example.com', name: 'Member' },
        },
      ],
      isLoading: false,
    });

    (authContext.useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user-2', email: 'member@example.com' },
    });

    render(<FamilyDetailPage />);
    expect(screen.queryByText('Invitations')).not.toBeInTheDocument();
  });

  it('switches between tabs', async () => {
    const user = userEvent.setup();
    render(<FamilyDetailPage />);

    const watchlistTab = screen.getByRole('button', { name: 'Shared Watchlist' });
    await user.click(watchlistTab);

    expect(screen.getByText('Filter by Member')).toBeInTheDocument();
  });

  it('displays family stats in overview tab', () => {
    render(<FamilyDetailPage />);

    expect(screen.getByText('Family Stats')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Pending Invites')).toBeInTheDocument();
  });
});
