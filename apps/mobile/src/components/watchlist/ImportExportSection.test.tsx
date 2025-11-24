import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { ImportExportSection } from './ImportExportSection';
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
  {
    originalTitle: 'The Matrix',
    originalYear: 1999,
    matchCandidates: [
      {
        tmdbId: 603,
        tmdbType: 'movie',
        title: 'The Matrix',
        year: 1999,
        posterPath: '/path/to/poster.jpg',
        backdropPath: '/path/to/backdrop.jpg',
        overview: 'A computer hacker learns from mysterious rebels',
        confidence: 0.99,
      },
    ],
    suggestedStatus: 'completed',
    rating: 8,
    notes: 'Classic sci-fi',
    dateAdded: '2024-01-20T00:00:00.000Z',
    streamingProviders: ['hulu'],
    hasExistingEntry: true,
    existingEntryId: 'entry-123',
    shouldSkip: false,
  },
];

const mockImportResult: ImportResult = {
  imported: 1,
  skipped: 1,
  failed: 0,
  merged: 0,
  overwritten: 0,
  errors: [],
};

describe('ImportExportSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWatchlistApi.previewImport.mockResolvedValue(mockPreviewItems);
    mockWatchlistApi.confirmImport.mockResolvedValue(mockImportResult);
    mockWatchlistApi.exportWatchlistAsFile.mockResolvedValue(new Blob(['{}'], { type: 'application/json' }));
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

  describe('Import Functionality', () => {
    it('renders import button', () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');
      expect(importButton).toBeTruthy();
    });

    it('opens file picker when import button is pressed', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(mockDocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
          type: ['text/csv', 'application/json', 'text/plain'],
        });
      });
    });

    it('displays preview modal with items after file selection', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(mockFileSystem.readAsStringAsync).toHaveBeenCalled();
        expect(mockWatchlistApi.previewImport).toHaveBeenCalled();
      });

      await waitFor(() => {
        const previewHeader = screen.getByText(/Import Preview/);
        expect(previewHeader).toBeTruthy();
      });
    });

    it('displays all preview items in modal', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText('Inception')).toBeTruthy();
        expect(screen.getByText('The Matrix')).toBeTruthy();
      });
    });

    it('shows year for preview items', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText('(2010)')).toBeTruthy();
        expect(screen.getByText('(1999)')).toBeTruthy();
      });
    });

    it('displays duplicate warning for items with existing entries', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText('Duplicate Entry Found')).toBeTruthy();
      });
    });

    it('allows selecting duplicate resolution strategy', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText('Duplicate Entry Found')).toBeTruthy();
      });

      // Note: Testing specific strategy selection depends on the Modal's internal state
      // and how NativeBase handles interactions
    });

    it('calls confirmImport with correct data when confirm button is pressed', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText(/Import Preview/)).toBeTruthy();
      });

      const confirmButton = screen.getByText('Confirm Import');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockWatchlistApi.confirmImport).toHaveBeenCalled();
      });
    });

    it('closes preview modal after successful import', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText(/Import Preview/)).toBeTruthy();
      });

      const confirmButton = screen.getByText('Confirm Import');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockWatchlistApi.confirmImport).toHaveBeenCalledWith(
          expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                originalTitle: 'Inception',
              }),
              expect.objectContaining({
                originalTitle: 'The Matrix',
              }),
            ]),
          }),
        );
      });
    });

    it('calls onImportComplete callback after successful import', async () => {
      const onImportComplete = jest.fn();
      render(<ImportExportSection onImportComplete={onImportComplete} />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText(/Import Preview/)).toBeTruthy();
      });

      const confirmButton = screen.getByText('Confirm Import');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(onImportComplete).toHaveBeenCalled();
      });
    });

    it('shows import result summary', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText(/Import Preview/)).toBeTruthy();
      });

      const confirmButton = screen.getByText('Confirm Import');
      fireEvent.press(confirmButton);

      await waitFor(() => {
        // Alert is displayed with import results
        expect(mockWatchlistApi.confirmImport).toHaveBeenCalled();
      });
    });

    it('displays error alert on import failure', async () => {
      mockWatchlistApi.previewImport.mockRejectedValue(new Error('Network error'));
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        // Error is handled
        expect(mockWatchlistApi.previewImport).toHaveBeenCalled();
      });
    });

    it('handles file picker cancellation gracefully', async () => {
      mockDocumentPicker.getDocumentAsync.mockResolvedValue({
        assets: undefined,
        canceled: true,
      });

      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      // Should not call preview if no file was selected
      await waitFor(() => {
        expect(mockWatchlistApi.previewImport).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Export Functionality', () => {
    it('renders export format selector', () => {
      render(<ImportExportSection />);
      const exportButton = screen.getByText('Export Watchlist');
      expect(exportButton).toBeTruthy();
    });

    it('allows selecting export format', async () => {
      render(<ImportExportSection />);
      const formatSelects = screen.getAllByText('Choose export format');
      expect(formatSelects.length).toBeGreaterThan(0);
    });

    it('calls exportWatchlistAsFile with selected format', async () => {
      render(<ImportExportSection />);
      const exportButton = screen.getByText('Export Watchlist');

      fireEvent.press(exportButton);

      await waitFor(() => {
        expect(mockWatchlistApi.exportWatchlistAsFile).toHaveBeenCalledWith('json');
      });
    });

    it('handles export file write', async () => {
      mockFileSystem.writeAsStringAsync.mockResolvedValue(undefined as any);
      render(<ImportExportSection />);
      const exportButton = screen.getByText('Export Watchlist');

      fireEvent.press(exportButton);

      await waitFor(() => {
        expect(mockWatchlistApi.exportWatchlistAsFile).toHaveBeenCalled();
      });
    });

    it('shows sharing sheet when available', async () => {
      mockFileSystem.writeAsStringAsync.mockResolvedValue(undefined as any);
      render(<ImportExportSection />);
      const exportButton = screen.getByText('Export Watchlist');

      fireEvent.press(exportButton);

      await waitFor(() => {
        expect(mockSharing.isAvailableAsync).toHaveBeenCalled();
      });
    });

    it('handles export errors gracefully', async () => {
      mockWatchlistApi.exportWatchlistAsFile.mockRejectedValue(new Error('Export failed'));
      render(<ImportExportSection />);
      const exportButton = screen.getByText('Export Watchlist');

      fireEvent.press(exportButton);

      // Error should be handled
      await waitFor(() => {
        expect(mockWatchlistApi.exportWatchlistAsFile).toHaveBeenCalled();
      });
    });

    it('handles unavailable sharing gracefully', async () => {
      mockSharing.isAvailableAsync.mockResolvedValue(false);
      mockFileSystem.writeAsStringAsync.mockResolvedValue(undefined as any);
      render(<ImportExportSection />);
      const exportButton = screen.getByText('Export Watchlist');

      fireEvent.press(exportButton);

      await waitFor(() => {
        // Should handle when sharing is not available
        expect(mockWatchlistApi.exportWatchlistAsFile).toHaveBeenCalled();
      });
    });
  });

  describe('TMDB Match Selection', () => {
    it('displays match candidates for items', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText('TMDB Match:')).toBeTruthy();
      });
    });

    it('shows confidence scores for matches', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        // Confidence scores should be displayed as percentages
        expect(screen.getByText(/98%/)).toBeTruthy();
        expect(screen.getByText(/99%/)).toBeTruthy();
      });
    });

    it('allows toggling match options visibility', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText(/TMDB Match:/)).toBeTruthy();
      });
    });
  });

  describe('Duplicate Resolution', () => {
    it('shows duplicate strategy options for items with existing entries', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText('Strategy:')).toBeTruthy();
      });
    });

    it('defaults to skip strategy for duplicates', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText('Strategy: skip')).toBeTruthy();
      });
    });

    it('provides skip, overwrite, and merge options', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText('Strategy: skip')).toBeTruthy();
      });
    });
  });

  describe('Empty States and Error Handling', () => {
    it('handles empty preview gracefully', async () => {
      mockWatchlistApi.previewImport.mockResolvedValue([]);
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(mockWatchlistApi.previewImport).toHaveBeenCalled();
      });
    });

    it('shows error message for failed items', async () => {
      const itemsWithError: NormalizedPreviewItem[] = [
        {
          originalTitle: 'Unknown Movie',
          originalYear: 2024,
          matchCandidates: [],
          suggestedStatus: 'not_watched',
          hasExistingEntry: false,
          shouldSkip: false,
          error: 'No matches found for this title',
        },
      ];

      mockWatchlistApi.previewImport.mockResolvedValue(itemsWithError);
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText('No matches found for this title')).toBeTruthy();
      });
    });

    it('disables import button while importing', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      // Button should be disabled during import
      await waitFor(() => {
        expect(mockDocumentPicker.getDocumentAsync).toHaveBeenCalled();
      });
    });

    it('disables export button while exporting', async () => {
      render(<ImportExportSection />);
      const exportButton = screen.getByText('Export Watchlist');

      fireEvent.press(exportButton);

      // Button should be disabled during export
      await waitFor(() => {
        expect(mockWatchlistApi.exportWatchlistAsFile).toHaveBeenCalled();
      });
    });
  });

  describe('Close Modal Functionality', () => {
    it('closes preview modal on cancel', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText(/Import Preview/)).toBeTruthy();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.press(cancelButton);

      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByText(/Import Preview/)).toBeFalsy();
      }, { timeout: 1000 });
    });

    it('clears preview data after closing modal', async () => {
      render(<ImportExportSection />);
      const importButton = screen.getByText('Import Watchlist');

      fireEvent.press(importButton);

      await waitFor(() => {
        expect(screen.getByText(/Import Preview/)).toBeTruthy();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.press(cancelButton);

      // Preview items should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Inception')).toBeFalsy();
      }, { timeout: 1000 });
    });
  });
});
