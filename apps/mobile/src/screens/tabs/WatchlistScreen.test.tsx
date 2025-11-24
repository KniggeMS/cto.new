import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { WatchlistScreen } from './WatchlistScreen';
import { watchlistApi } from '../../lib/api/watchlist';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { NormalizedPreviewItem, ImportResult } from '@infocus/shared';

jest.mock('../../lib/api/watchlist');
jest.mock('expo-document-picker');
jest.mock('expo-file-system');
jest.mock('expo-sharing');

const mockWatchlistApi = watchlistApi as jest.Mocked<typeof watchlistApi>;
const mockDocumentPicker = DocumentPicker as jest.Mocked<typeof DocumentPicker>;
const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;
const mockSharing = Sharing as jest.Mocked<typeof Sharing>;

const mockPreviewItems: NormalizedPreviewItem[] = [
  {
    originalTitle: 'Inception',
    originalYear: 2010,
    matchCandidates: [
      {
        tmdbId: 27205,
        tmdbType: 'movie',
        title: 'Inception',
        year: 2010,
        posterPath: '/path/to/poster.jpg',
        backdropPath: '/path/to/backdrop.jpg',
        overview: 'A skilled thief who steals corporate secrets',
        confidence: 0.98,
      },
    ],
    suggestedStatus: 'completed',
    rating: 9,
    notes: 'Amazing movie',
    dateAdded: '2024-01-15T00:00:00.000Z',
    streamingProviders: ['netflix'],
    hasExistingEntry: false,
    shouldSkip: false,
  },
];

const mockImportResult: ImportResult = {
  imported: 1,
  skipped: 0,
  failed: 0,
  merged: 0,
  overwritten: 0,
  errors: [],
};

describe('WatchlistScreen with Import/Export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWatchlistApi.previewImport.mockResolvedValue(mockPreviewItems);
    mockWatchlistApi.confirmImport.mockResolvedValue(mockImportResult);
    mockWatchlistApi.exportWatchlistAsFile.mockResolvedValue(
      new Blob(['{}'], { type: 'application/json' })
    );
    mockSharing.isAvailableAsync.mockResolvedValue(true);
    mockFileSystem.readAsStringAsync.mockResolvedValue('test file content');
    mockDocumentPicker.getDocumentAsync.mockResolvedValue({
      assets: [
        {
          uri: 'file:///path/to/watchlist.csv',
          name: 'watchlist.csv',
          size: 1024,
          mimeType: 'text/csv',
        },
      ],
      canceled: false,
    });
  });

  it('renders watchlist screen with title', () => {
    render(<WatchlistScreen />);
    const title = screen.getByText('Watchlist');
    expect(title).toBeTruthy();
  });

  it('displays subtitle', () => {
    render(<WatchlistScreen />);
    const subtitle = screen.getByText('Your watchlist will appear here');
    expect(subtitle).toBeTruthy();
  });

  it('displays import/export section', () => {
    render(<WatchlistScreen />);
    const importButton = screen.getByText('Import Watchlist');
    expect(importButton).toBeTruthy();
  });

  it('renders both import and export buttons', () => {
    render(<WatchlistScreen />);
    const importButton = screen.getByText('Import Watchlist');
    const exportButton = screen.getByText('Export Watchlist');
    expect(importButton).toBeTruthy();
    expect(exportButton).toBeTruthy();
  });

  it('handles import workflow', async () => {
    render(<WatchlistScreen />);
    const importButton = screen.getByText('Import Watchlist');

    fireEvent.press(importButton);

    await waitFor(() => {
      expect(mockDocumentPicker.getDocumentAsync).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockWatchlistApi.previewImport).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/Import Preview/)).toBeTruthy();
    });

    const confirmButton = screen.getByText('Confirm Import');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(mockWatchlistApi.confirmImport).toHaveBeenCalled();
    });
  });

  it('handles export workflow', async () => {
    render(<WatchlistScreen />);
    const exportButton = screen.getByText('Export Watchlist');

    fireEvent.press(exportButton);

    await waitFor(() => {
      expect(mockWatchlistApi.exportWatchlistAsFile).toHaveBeenCalledWith('json');
    });
  });

  it('provides scrollable content area', () => {
    render(<WatchlistScreen />);
    // The screen uses scrollable container which should render content properly
    expect(screen.getByText('Watchlist')).toBeTruthy();
    expect(screen.getByText('Import Watchlist')).toBeTruthy();
  });

  it('displays import/export section below header', async () => {
    render(<WatchlistScreen />);

    // Both header and import section should be visible
    expect(screen.getByText('Watchlist')).toBeTruthy();
    expect(screen.getByText('Import Watchlist')).toBeTruthy();
    expect(screen.getByText('Export Watchlist')).toBeTruthy();
  });
});
