import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImportPreviewTable } from '../ImportPreviewTable';
import type { NormalizedPreviewItem, TmdbMatchCandidate } from '@infocus/shared';

const mockOnItemsUpdate = jest.fn();
const mockOnProceedToResolutions = jest.fn();

// Sample test data
const mockTmdbMatches: TmdbMatchCandidate[] = [
  {
    tmdbId: 27205,
    tmdbType: 'movie',
    title: 'Inception',
    year: 2010,
    posterPath: '/path/to/poster.jpg',
    backdropPath: '/path/to/backdrop.jpg',
    overview: 'A thief who steals corporate secrets...',
    confidence: 0.95,
  },
  {
    tmdbId: 12345,
    tmdbType: 'movie',
    title: 'Inception: The Dream',
    year: 2010,
    posterPath: '/path/to/poster2.jpg',
    overview: 'A different movie about dreams...',
    confidence: 0.75,
  },
];

const mockItems: NormalizedPreviewItem[] = [
  {
    originalTitle: 'Inception',
    originalYear: 2010,
    matchCandidates: mockTmdbMatches,
    selectedMatchIndex: null,
    suggestedStatus: 'completed',
    rating: 9,
    notes: 'Amazing movie!',
    dateAdded: '2024-01-15T00:00:00Z',
    streamingProviders: ['netflix'],
    hasExistingEntry: false,
    existingEntryId: null,
    shouldSkip: false,
    error: null,
  },
  {
    originalTitle: 'The Matrix',
    originalYear: 1999,
    matchCandidates: [],
    selectedMatchIndex: null,
    suggestedStatus: 'completed',
    rating: 8,
    notes: 'Mind-bending sci-fi',
    dateAdded: '2024-01-10T00:00:00Z',
    streamingProviders: [],
    hasExistingEntry: true,
    existingEntryId: 'existing-123',
    shouldSkip: false,
    error: null,
  },
  {
    originalTitle: 'Unknown Movie',
    originalYear: null,
    matchCandidates: [],
    selectedMatchIndex: null,
    suggestedStatus: 'not_watched',
    rating: null,
    notes: null,
    dateAdded: null,
    streamingProviders: [],
    hasExistingEntry: false,
    existingEntryId: null,
    shouldSkip: false,
    error: 'No TMDB matches found',
  },
];

describe('ImportPreviewTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the preview table with items', () => {
    render(
      <ImportPreviewTable
        items={mockItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    expect(screen.getByText('Import Preview')).toBeInTheDocument();
    expect(screen.getByText(/Review and select matches for 3 items/)).toBeInTheDocument();
    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('The Matrix')).toBeInTheDocument();
    expect(screen.getByText('Unknown Movie')).toBeInTheDocument();
  });

  it('displays item details correctly', () => {
    render(
      <ImportPreviewTable
        items={mockItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    // Check first item details
    expect(screen.getByText('(2010)')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('9/10')).toBeInTheDocument();
    expect(screen.getByText('Amazing movie!')).toBeInTheDocument();
  });

  it('shows duplicate and error badges', () => {
    render(
      <ImportPreviewTable
        items={mockItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    expect(screen.getByText('Duplicate')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('displays correct counts', () => {
    render(
      <ImportPreviewTable
        items={mockItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    expect(screen.getByText('Valid: 1')).toBeInTheDocument(); // Only first item has matches
    expect(screen.getByText('Skipped: 0')).toBeInTheDocument();
  });

  it('allows expanding and collapsing items', () => {
    render(
      <ImportPreviewTable
        items={mockItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    // Initially collapsed
    expect(screen.queryByText('TMDB Matches:')).not.toBeInTheDocument();

    // Click expand on first item
    const expandButtons = screen.getAllByText('Expand');
    fireEvent.click(expandButtons[0]);

    // Should show TMDB matches
    expect(screen.getByText('TMDB Matches:')).toBeInTheDocument();
    expect(screen.getByText('Inception')).toBeInTheDocument();
    expect(screen.getByText('Inception: The Dream')).toBeInTheDocument();

    // Click collapse
    const collapseButtons = screen.getAllByText('Collapse');
    fireEvent.click(collapseButtons[0]);

    // Should hide TMDB matches
    expect(screen.queryByText('TMDB Matches:')).not.toBeInTheDocument();
  });

  it('allows selecting TMDB matches', () => {
    render(
      <ImportPreviewTable
        items={mockItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    // Expand first item
    const expandButtons = screen.getAllByText('Expand');
    fireEvent.click(expandButtons[0]);

    // Click on first match
    const firstMatch = screen.getByText('Inception').closest('div');
    fireEvent.click(firstMatch!);

    expect(mockOnItemsUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          selectedMatchIndex: 0,
        }),
        mockItems[1],
        mockItems[2],
      ])
    );
  });

  it('allows skipping items', () => {
    render(
      <ImportPreviewTable
        items={mockItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    // Click skip on first item
    const skipButtons = screen.getAllByText('Skip');
    fireEvent.click(skipButtons[0]);

    expect(mockOnItemsUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          shouldSkip: true,
        }),
        mockItems[1],
        mockItems[2],
      ])
    );
  });

  it('shows no matches message for items without TMDB matches', () => {
    render(
      <ImportPreviewTable
        items={mockItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    // Expand third item (no matches)
    const expandButtons = screen.getAllByText('Expand');
    fireEvent.click(expandButtons[2]);

    expect(screen.getByText('No TMDB matches found')).toBeInTheDocument();
    expect(screen.getByText(/This item will be skipped/)).toBeInTheDocument();
  });

  it('shows confidence scores with correct colors', () => {
    render(
      <ImportPreviewTable
        items={mockItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    // Expand first item
    const expandButtons = screen.getAllByText('Expand');
    fireEvent.click(expandButtons[0]);

    // Check confidence scores
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows TMDB link when match is selected', () => {
    render(
      <ImportPreviewTable
        items={mockItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    // Expand first item
    const expandButtons = screen.getAllByText('Expand');
    fireEvent.click(expandButtons[0]);

    // Select first match
    const firstMatch = screen.getByText('Inception').closest('div');
    fireEvent.click(firstMatch!);

    // Should show TMDB link
    expect(screen.getByText('View on TMDB')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View on TMDB/ })).toHaveAttribute(
      'href',
      'https://www.themoviedb.org/movie/27205'
    );
  });

  it('disables proceed button when no valid items', () => {
    const allSkippedItems = mockItems.map(item => ({ ...item, shouldSkip: true }));

    render(
      <ImportPreviewTable
        items={allSkippedItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    const proceedButton = screen.getByRole('button', { name: /Review Duplicates \(0 items\)/ });
    expect(proceedButton).toBeDisabled();
  });

  it('enables proceed button when valid items exist', () => {
    render(
      <ImportPreviewTable
        items={mockItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    const proceedButton = screen.getByRole('button', { name: /Review Duplicates \(1 items\)/ });
    expect(proceedButton).not.toBeDisabled();
  });

  it('calls onProceedToResolutions when proceed button is clicked', () => {
    render(
      <ImportPreviewTable
        items={mockItems}
        onItemsUpdate={mockOnItemsUpdate}
        onProceedToResolutions={mockOnProceedToResolutions}
      />
    );

    const proceedButton = screen.getByRole('button', { name: /Review Duplicates/ });
    fireEvent.click(proceedButton);

    expect(mockOnProceedToResolutions).toHaveBeenCalled();
  });
});