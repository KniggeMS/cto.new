import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ExportPanel } from '../ExportPanel';

// Mock the toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock the hooks
jest.mock('@/lib/hooks/use-watchlist', () => ({
  useWatchlist: () => ({
    data: [
      {
        id: '1',
        title: 'Inception',
        status: 'completed',
        rating: 9,
        notes: 'Amazing movie',
        dateAdded: '2024-01-15T00:00:00Z',
      },
      {
        id: '2',
        title: 'The Matrix',
        status: 'watching',
        rating: 8,
        notes: null,
        dateAdded: '2024-01-10T00:00:00Z',
      },
    ],
    isLoading: false,
    error: null,
  }),
  useWatchlistExport: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock createElement and appendChild/removeChild
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ExportPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock link element
    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
    };
    mockCreateElement.mockReturnValue(mockLink);
  });

  it('renders the export panel correctly', () => {
    renderWithQueryClient(<ExportPanel />);

    expect(screen.getByText('Export Watchlist')).toBeInTheDocument();
    expect(screen.getByText(/Download your watchlist for backup/)).toBeInTheDocument();
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('JSON')).toBeInTheDocument();
  });

  it('displays watchlist summary when items exist', () => {
    renderWithQueryClient(<ExportPanel />);

    expect(screen.getByText('2 items')).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('shows format descriptions correctly', () => {
    renderWithQueryClient(<ExportPanel />);

    expect(screen.getByText('Comma-separated values, easy to open in Excel or Google Sheets')).toBeInTheDocument();
    expect(screen.getByText('Structured data format, ideal for developers and backups')).toBeInTheDocument();
  });

  it('allows format selection', () => {
    renderWithQueryClient(<ExportPanel />);

    // CSV should be selected by default
    const csvButton = screen.getByText('CSV').closest('button');
    expect(csvButton).toHaveClass('border-primary-500');

    // Click JSON
    const jsonButton = screen.getByText('JSON').closest('button');
    fireEvent.click(jsonButton!);

    expect(jsonButton).toHaveClass('border-primary-500');
    expect(csvButton).not.toHaveClass('border-primary-500');
  });

  it('shows format guidelines', () => {
    renderWithQueryClient(<ExportPanel />);

    expect(screen.getByText('What\'s included:')).toBeInTheDocument();
    expect(screen.getByText(/Title, year, and media type/)).toBeInTheDocument();
    expect(screen.getByText(/Watch status, rating, and personal notes/)).toBeInTheDocument();
    expect(screen.getByText(/Date added and completion date/)).toBeInTheDocument();
    expect(screen.getByText(/TMDB IDs for easy re-importing/)).toBeInTheDocument();
    expect(screen.getByText(/Streaming provider information/)).toBeInTheDocument();
  });

  it('enables export button when watchlist has items', () => {
    renderWithQueryClient(<ExportPanel />);

    const exportButton = screen.getByRole('button', { name: 'Export Watchlist' });
    expect(exportButton).not.toBeDisabled();
  });

  it('handles CSV export correctly', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(new Blob(['csv,data']));
    jest.mocked(require('@/lib/hooks/use-watchlist').useWatchlistExport).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    renderWithQueryClient(<ExportPanel />);

    const exportButton = screen.getByRole('button', { name: 'Export Watchlist' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('csv');
    });

    // Check that download link was created and clicked
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();

    // Check filename format
    const mockLink = mockCreateElement.mock.results[0].value;
    expect(mockLink.download).toMatch(/^watchlist-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(mockLink.href).toBe('mock-url');

    // Check success toast
    expect(toast.success).toHaveBeenCalledWith('Exported 2 items as CSV');
  });

  it('handles JSON export correctly', async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(new Blob(['{"data": "json"}']));
    jest.mocked(require('@/lib/hooks/use-watchlist').useWatchlistExport).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    renderWithQueryClient(<ExportPanel />);

    // Select JSON format
    const jsonButton = screen.getByText('JSON').closest('button');
    fireEvent.click(jsonButton!);

    const exportButton = screen.getByRole('button', { name: 'Export Watchlist' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('json');
    });

    // Check filename format
    const mockLink = mockCreateElement.mock.results[0].value;
    expect(mockLink.download).toMatch(/^watchlist-\d{4}-\d{2}-\d{2}\.json$/);

    // Check success toast
    expect(toast.success).toHaveBeenCalledWith('Exported 2 items as JSON');
  });

  it('shows loading state during export', () => {
    jest.mocked(require('@/lib/hooks/use-watchlist').useWatchlistExport).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    renderWithQueryClient(<ExportPanel />);

    const exportButton = screen.getByRole('button', { name: 'Exporting...' });
    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveAttribute('disabled');
  });

  it('handles export error correctly', async () => {
    const mockMutateAsync = jest.fn().mockRejectedValue(new Error('Export failed'));
    jest.mocked(require('@/lib/hooks/use-watchlist').useWatchlistExport).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    renderWithQueryClient(<ExportPanel />);

    const exportButton = screen.getByRole('button', { name: 'Export Watchlist' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Export failed');
    });
  });

  it('handles API error response correctly', async () => {
    const mockMutateAsync = jest.fn().mockRejectedValue({
      response: {
        data: {
          message: 'Server error occurred',
        },
      },
    });
    jest.mocked(require('@/lib/hooks/use-watchlist').useWatchlistExport).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });

    renderWithQueryClient(<ExportPanel />);

    const exportButton = screen.getByRole('button', { name: 'Export Watchlist' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error occurred');
    });
  });

  it('shows empty state when watchlist is empty', () => {
    jest.mocked(require('@/lib/hooks/use-watchlist').useWatchlist).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<ExportPanel />);

    expect(screen.getByText('No items to export')).toBeInTheDocument();
    expect(screen.getByText(/Add some movies and TV shows to your watchlist first/)).toBeInTheDocument();

    const exportButton = screen.getByRole('button', { name: 'Export Watchlist' });
    expect(exportButton).toBeDisabled();
  });

  it('shows error toast when trying to export empty watchlist', () => {
    jest.mocked(require('@/lib/hooks/use-watchlist').useWatchlist).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<ExportPanel />);

    const exportButton = screen.getByRole('button', { name: 'Export Watchlist' });
    fireEvent.click(exportButton);

    expect(toast.error).toHaveBeenCalledWith('Your watchlist is empty');
  });

  it('generates correct timestamp in filename', () => {
    const fixedDate = new Date('2024-03-15T00:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => fixedDate as any);

    renderWithQueryClient(<ExportPanel />);

    const exportButton = screen.getByRole('button', { name: 'Export Watchlist' });
    fireEvent.click(exportButton);

    const mockLink = mockCreateElement.mock.results[0].value;
    expect(mockLink.download).toBe('watchlist-2024-03-15.csv');

    jest.restoreAllMocks();
  });
});