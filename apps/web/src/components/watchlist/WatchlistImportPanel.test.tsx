import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { WatchlistImportPanel } from '../WatchlistImportPanel';
import type { NormalizedPreviewItem } from '@infocus/shared';

// Mock the toast
jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

// Mock the import hook
jest.mock('@/lib/hooks/use-watchlist', () => ({
  useWatchlistImportPreview: () => ({
    mutateAsync: jest.fn(),
    isPending: false,
  }),
}));

// Mock file for testing
const createMockFile = (name: string, type: string, size: number = 1024) => {
  const file = new File(['test content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const mockOnPreviewGenerated = jest.fn();

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

describe('WatchlistImportPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the import panel correctly', () => {
    renderWithQueryClient(
      <WatchlistImportPanel onPreviewGenerated={mockOnPreviewGenerated} />
    );

    expect(screen.getByText('Import Watchlist')).toBeInTheDocument();
    expect(screen.getByText(/Import your watchlist from a CSV or JSON file/)).toBeInTheDocument();
    expect(screen.getByText(/Drop your file here, or click to browse/)).toBeInTheDocument();
    expect(screen.getByText(/Supports CSV and JSON files up to 10MB/)).toBeInTheDocument();
  });

  it('shows file format guidelines', () => {
    renderWithQueryClient(
      <WatchlistImportPanel onPreviewGenerated={mockOnPreviewGenerated} />
    );

    expect(screen.getByText('File Format Guidelines:')).toBeInTheDocument();
    expect(screen.getByText(/CSV:/)).toBeInTheDocument();
    expect(screen.getByText(/JSON:/)).toBeInTheDocument();
    expect(screen.getByText(/Status:/)).toBeInTheDocument();
    expect(screen.getByText(/Rating:/)).toBeInTheDocument();
  });

  it('handles file selection via click', async () => {
    const fileInput = jest.fn();
    const originalInput = HTMLInputElement.prototype;
    Object.defineProperty(HTMLInputElement.prototype, 'click', {
      get() {
        return fileInput;
      },
    });

    renderWithQueryClient(
      <WatchlistImportPanel onPreviewGenerated={mockOnPreviewGenerated} />
    );

    const dropArea = screen.getByText(/Drop your file here/).closest('div');
    fireEvent.click(dropArea!);

    expect(fileInput).toHaveBeenCalled();
  });

  it('validates file types correctly', async () => {
    renderWithQueryClient(
      <WatchlistImportPanel onPreviewGenerated={mockOnPreviewGenerated} />
    );

    // Create a file with invalid type
    const invalidFile = createMockFile('test.txt', 'text/plain');

    const fileInput = screen.getByRole('button', { name: /Drop your file here/ }).querySelector('input[type="file"]');
    
    if (fileInput) {
      fireEvent.change(fileInput, {
        target: { files: [invalidFile] },
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please select a CSV or JSON file');
      });
    }
  });

  it('validates file size correctly', async () => {
    renderWithQueryClient(
      <WatchlistImportPanel onPreviewGenerated={mockOnPreviewGenerated} />
    );

    // Create a file that's too large (15MB)
    const largeFile = createMockFile('test.csv', 'text/csv', 15 * 1024 * 1024);

    const fileInput = screen.getByRole('button', { name: /Drop your file here/ }).querySelector('input[type="file"]');
    
    if (fileInput) {
      fireEvent.change(fileInput, {
        target: { files: [largeFile] },
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('File size must be less than 10MB');
      });
    }
  });

  it('accepts valid CSV file', async () => {
    renderWithQueryClient(
      <WatchlistImportPanel onPreviewGenerated={mockOnPreviewGenerated} />
    );

    const validFile = createMockFile('test.csv', 'text/csv');

    const fileInput = screen.getByRole('button', { name: /Drop your file here/ }).querySelector('input[type="file"]');
    
    if (fileInput) {
      fireEvent.change(fileInput, {
        target: { files: [validFile] },
      });

      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
        expect(screen.getByText(/1\.0 KB/)).toBeInTheDocument();
      });
    }
  });

  it('accepts valid JSON file', async () => {
    renderWithQueryClient(
      <WatchlistImportPanel onPreviewGenerated={mockOnPreviewGenerated} />
    );

    const validFile = createMockFile('test.json', 'application/json');

    const fileInput = screen.getByRole('button', { name: /Drop your file here/ }).querySelector('input[type="file"]');
    
    if (fileInput) {
      fireEvent.change(fileInput, {
        target: { files: [validFile] },
      });

      await waitFor(() => {
        expect(screen.getByText('test.json')).toBeInTheDocument();
        expect(screen.getByText(/1\.0 KB/)).toBeInTheDocument();
      });
    }
  });

  it('shows selected file info and allows removal', async () => {
    renderWithQueryClient(
      <WatchlistImportPanel onPreviewGenerated={mockOnPreviewGenerated} />
    );

    const validFile = createMockFile('test.csv', 'text/csv');

    const fileInput = screen.getByRole('button', { name: /Drop your file here/ }).querySelector('input[type="file"]');
    
    if (fileInput) {
      fireEvent.change(fileInput, {
        target: { files: [validFile] },
      });

      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });

      // Test remove button
      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
      });
    }
  });

  it('enables parse button only when file is selected', async () => {
    renderWithQueryClient(
      <WatchlistImportPanel onPreviewGenerated={mockOnPreviewGenerated} />
    );

    const parseButton = screen.getByRole('button', { name: 'Parse File' });
    expect(parseButton).toBeDisabled();

    const validFile = createMockFile('test.csv', 'text/csv');

    const fileInput = screen.getByRole('button', { name: /Drop your file here/ }).querySelector('input[type="file"]');
    
    if (fileInput) {
      fireEvent.change(fileInput, {
        target: { files: [validFile] },
      });

      await waitFor(() => {
        expect(parseButton).not.toBeDisabled();
      });
    }
  });

  it('handles drag and drop correctly', async () => {
    renderWithQueryClient(
      <WatchlistImportPanel onPreviewGenerated={mockOnPreviewGenerated} />
    );

    const dropArea = screen.getByText(/Drop your file here/).closest('div');
    
    // Test drag over
    fireEvent.dragOver(dropArea!);
    expect(dropArea).toHaveClass('border-primary-500');

    // Test drag leave
    fireEvent.dragLeave(dropArea!);
    expect(dropArea).not.toHaveClass('border-primary-500');

    // Test drop with valid file
    const validFile = createMockFile('test.csv', 'text/csv');
    fireEvent.drop(dropArea!, {
      dataTransfer: {
        files: [validFile],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });
  });
});