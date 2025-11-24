import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { tmdbService, SearchResult } from './tmdbService';
import { mediaPersistenceService } from './mediaPersistenceService';
import {
  rawWatchlistRowSchema,
  type RawWatchlistRow,
  type NormalizedPreviewItem,
  type BulkImportRequest,
  type ImportResult,
  type ExportedWatchlistEntry,
  type ExportResponse,
  type TmdbMatchCandidate,
} from '@infocus/shared';
import {
  normalizeWatchStatus,
  parseStreamingProviders,
  normalizeDateString,
  calculateMatchConfidence,
  normalizeRating,
} from '@infocus/shared';

export interface ImportPreviewOptions {
  skipUnmatched?: boolean;
  maxCandidates?: number;
}

export interface ImportConfirmOptions {
  skipUnmatched?: boolean;
  defaultDuplicateStrategy?: 'skip' | 'overwrite' | 'merge';
}

export class WatchlistImportService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Parse uploaded file (CSV or JSON) and extract raw watchlist rows
   */
  async parseUploadedFile(file: Express.Multer.File): Promise<RawWatchlistRow[]> {
    const content = file.buffer.toString('utf-8');
    const extension = file.originalname?.split('.').pop()?.toLowerCase();

    try {
      if (extension === 'json') {
        return this.parseJsonFile(content);
      } else if (extension === 'csv') {
        return this.parseCsvFile(content);
      } else {
        throw new Error('Unsupported file format. Please upload a CSV or JSON file.');
      }
    } catch (error) {
      throw new Error(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse JSON file content
   */
  private parseJsonFile(content: string): RawWatchlistRow[] {
    try {
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON file must contain an array of watchlist items');
      }

      return data.map((item, index) => {
        try {
          return rawWatchlistRowSchema.parse(item);
        } catch (error) {
          throw new Error(`Invalid item at index ${index}: ${error instanceof Error ? error.message : 'Invalid format'}`);
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid JSON format: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Parse CSV file content
   */
  private parseCsvFile(content: string): RawWatchlistRow[] {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    // Extract headers from first line
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: RawWatchlistRow[] = [];

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles basic quoted fields)
      const values = this.parseCsvLine(line);
      
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1} has ${values.length} values but expected ${headers.length}`);
      }

      // Map headers to values
      const rowData: any = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index] || null;
      });

      try {
        const parsedRow = rawWatchlistRowSchema.parse(rowData);
        rows.push(parsedRow);
      } catch (error) {
        throw new Error(`Invalid row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid format'}`);
      }
    }

    return rows;
  }

  /**
   * Parse a single CSV line handling quoted fields
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Generate preview items with TMDB matches and duplicate detection
   */
  async generatePreview(
    rows: RawWatchlistRow[],
    userId: string,
    options: ImportPreviewOptions = {}
  ): Promise<NormalizedPreviewItem[]> {
    const { maxCandidates = 5 } = options;
    const previewItems: NormalizedPreviewItem[] = [];

    // Get user's existing watchlist for duplicate detection
    const existingEntries = await this.prisma.watchlistEntry.findMany({
      where: { userId },
      include: { mediaItem: true },
    });

    const existingMediaMap = new Map(
      existingEntries.map(entry => [
        `${entry.mediaItem.title.toLowerCase()}|${entry.mediaItem.releaseDate?.getFullYear() || ''}`,
        entry,
      ])
    );

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Check for duplicates
        const duplicateKey = `${row.title.toLowerCase()}|${row.year || ''}`;
        const existingEntry = existingMediaMap.get(duplicateKey);

        // Search TMDB for matches
        const matchCandidates = await this.findTmdbMatches(row, maxCandidates);

        // Normalize data
        const normalizedStatus = normalizeWatchStatus(row.status);
        const normalizedProviders = parseStreamingProviders(row.streamingProviders);
        const normalizedDate = normalizeDateString(row.dateAdded);
        const normalizedRating = normalizeRating(row.rating);

        const previewItem: NormalizedPreviewItem = {
          originalTitle: row.title,
          originalYear: row.year,
          matchCandidates,
          suggestedStatus: normalizedStatus || 'not_watched',
          rating: normalizedRating,
          notes: row.notes,
          dateAdded: normalizedDate,
          streamingProviders: normalizedProviders,
          hasExistingEntry: !!existingEntry,
          existingEntryId: existingEntry?.id || null,
          shouldSkip: false,
          error: null,
        };

        previewItems.push(previewItem);
      } catch (error) {
        previewItems.push({
          originalTitle: row.title,
          originalYear: row.year,
          matchCandidates: [],
          suggestedStatus: 'not_watched',
          rating: null,
          notes: row.notes,
          dateAdded: null,
          streamingProviders: [],
          hasExistingEntry: false,
          existingEntryId: null,
          shouldSkip: true,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return previewItems;
  }

  /**
   * Find TMDB matches for a given row
   */
  private async findTmdbMatches(row: RawWatchlistRow, maxCandidates: number): Promise<TmdbMatchCandidate[]> {
    try {
      const searchResponse = await tmdbService.searchMulti(row.title, 1);
      
      const candidates: TmdbMatchCandidate[] = searchResponse.results
        .slice(0, maxCandidates * 2) // Get more to filter by confidence
        .map((result: SearchResult) => {
          const confidence = calculateMatchConfidence(
            result.title,
            result.release_date ? new Date(result.release_date).getFullYear() : null,
            row.title,
            row.year,
            !!result.poster_path
          );

          return {
            tmdbId: result.id,
            tmdbType: result.media_type,
            title: result.title,
            year: result.release_date ? new Date(result.release_date).getFullYear() : null,
            posterPath: result.poster_path,
            backdropPath: result.backdrop_path,
            overview: result.overview,
            confidence,
          };
        })
        .filter(candidate => candidate.confidence > 0.3) // Filter low-confidence matches
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, maxCandidates);

      return candidates;
    } catch (error) {
      console.warn(`TMDB search failed for "${row.title}":`, error);
      return [];
    }
  }

  /**
   * Confirm import and apply changes to database
   */
  async confirmImport(
    request: BulkImportRequest,
    userId: string,
    options: ImportConfirmOptions = {}
  ): Promise<ImportResult> {
    const { skipUnmatched = false, defaultDuplicateStrategy = 'skip' } = options;
    
    const result: ImportResult = {
      imported: 0,
      skipped: 0,
      failed: 0,
      merged: 0,
      overwritten: 0,
      errors: [],
    };

    // Create a map of resolutions by item index
    const resolutionMap = new Map(
      request.resolutions.map(res => [res.itemIndex, res])
    );

    for (let i = 0; i < request.items.length; i++) {
      const item = request.items[i];
      
      try {
        // Skip if marked to skip
        if (item.shouldSkip) {
          result.skipped++;
          continue;
        }

        // Skip unmatched if option is enabled
        if (skipUnmatched && item.matchCandidates.length === 0) {
          result.skipped++;
          continue;
        }

        // Get resolution for this item
        const resolution = resolutionMap.get(i);
        const strategy = resolution?.strategy || defaultDuplicateStrategy;

        // Handle duplicates
        if (item.hasExistingEntry && item.existingEntryId) {
          if (strategy === 'skip') {
            result.skipped++;
            continue;
          }

          if (strategy === 'overwrite' || strategy === 'merge') {
            await this.handleDuplicate(item, strategy, resolution?.mergeFields, userId);
            if (strategy === 'overwrite') {
              result.overwritten++;
            } else {
              result.merged++;
            }
            continue;
          }
        }

        // Import new item
        await this.importNewItem(item, userId);
        result.imported++;

      } catch (error) {
        result.failed++;
        result.errors.push({
          itemIndex: i,
          title: item.originalTitle,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Handle duplicate entries (overwrite or merge)
   */
  private async handleDuplicate(
    item: NormalizedPreviewItem,
    strategy: 'overwrite' | 'merge',
    mergeFields: any,
    userId: string
  ): Promise<void> {
    if (!item.existingEntryId) {
      throw new Error('Missing existing entry ID');
    }

    const existingEntry = await this.prisma.watchlistEntry.findUnique({
      where: { id: item.existingEntryId },
      include: { mediaItem: true },
    });

    if (!existingEntry || existingEntry.userId !== userId) {
      throw new Error('Existing entry not found or access denied');
    }

    if (strategy === 'overwrite') {
      // Update all fields
      const updateData: any = {
        status: item.suggestedStatus,
        rating: item.rating,
        notes: item.notes,
      };

      await this.prisma.watchlistEntry.update({
        where: { id: item.existingEntryId },
        data: updateData,
      });
    } else if (strategy === 'merge') {
      // Merge selected fields
      const updateData: any = {};

      if (mergeFields?.status) {
        updateData.status = item.suggestedStatus;
      }

      if (mergeFields?.rating) {
        updateData.rating = item.rating;
      }

      if (mergeFields?.notes && mergeFields.notes !== 'keep') {
        if (mergeFields.notes === 'append' && item.notes && existingEntry.notes) {
          updateData.notes = `${existingEntry.notes}\n\n${item.notes}`;
        } else if (mergeFields.notes === 'replace') {
          updateData.notes = item.notes;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await this.prisma.watchlistEntry.update({
          where: { id: item.existingEntryId },
          data: updateData,
        });
      }
    }
  }

  /**
   * Import a new watchlist item
   */
  private async importNewItem(item: NormalizedPreviewItem, userId: string): Promise<void> {
    // Get selected match or use first candidate
    const candidateIndex = item.selectedMatchIndex ?? 0;
    const candidate = item.matchCandidates[candidateIndex];

    if (!candidate) {
      throw new Error('No TMDB match available');
    }

    // Ensure media item exists
    const mediaResult = await mediaPersistenceService.persistMediaItem(
      candidate.tmdbId,
      candidate.tmdbType
    );

    // Create watchlist entry
    await this.prisma.watchlistEntry.create({
      data: {
        userId,
        mediaItemId: mediaResult.mediaItem.id,
        status: item.suggestedStatus,
        rating: item.rating,
        notes: item.notes,
      },
    });
  }

  /**
   * Export user's watchlist data
   */
  async exportWatchlist(userId: string): Promise<ExportResponse> {
    const watchlistEntries = await this.prisma.watchlistEntry.findMany({
      where: { userId },
      include: {
        mediaItem: {
          include: {
            streamingProviders: true,
          },
        },
      },
      orderBy: { dateAdded: 'asc' },
    });

    const entries: ExportedWatchlistEntry[] = watchlistEntries.map(entry => ({
      title: entry.mediaItem.title,
      year: entry.mediaItem.releaseDate?.getFullYear() || null,
      type: entry.mediaItem.tmdbType as 'movie' | 'tv',
      status: entry.status as 'not_watched' | 'watching' | 'completed',
      rating: entry.rating,
      notes: entry.notes,
      dateAdded: entry.dateAdded.toISOString(),
      dateWatched: entry.dateUpdated?.toISOString() || null,
      streamingProviders: entry.mediaItem.streamingProviders.map(p => p.provider),
      tmdbId: entry.mediaItem.tmdbId,
      posterPath: entry.mediaItem.posterPath,
    }));

    return {
      exportedAt: new Date().toISOString(),
      userId,
      version: '1.0',
      totalEntries: entries.length,
      entries,
    };
  }

  /**
   * Convert export data to CSV format
   */
  exportToCsv(exportData: ExportResponse): string {
    const headers = [
      'title',
      'year',
      'type',
      'status',
      'rating',
      'notes',
      'dateAdded',
      'dateWatched',
      'streamingProviders',
      'tmdbId',
      'posterPath',
    ];

    const csvLines = [headers.join(',')];

    for (const entry of exportData.entries) {
      const row = [
        `"${this.escapeCsvField(entry.title)}"`,
        entry.year || '',
        entry.type,
        entry.status,
        entry.rating || '',
        `"${this.escapeCsvField(entry.notes || '')}"`,
        entry.dateAdded,
        entry.dateWatched || '',
        `"${entry.streamingProviders.join(';')}"`,
        entry.tmdbId || '',
        `"${entry.posterPath || ''}"`,
      ];
      csvLines.push(row.join(','));
    }

    return csvLines.join('\n');
  }

  /**
   * Escape CSV fields to handle quotes and commas
   */
  private escapeCsvField(field: string): string {
    return field.replace(/"/g, '""');
  }
}

// Singleton instance
export const watchlistImportService = new WatchlistImportService(new PrismaClient());