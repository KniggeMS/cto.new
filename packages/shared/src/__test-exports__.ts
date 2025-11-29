// This file is used to verify that all exports are correctly set up
// It should not be included in the build

import type {
  RawWatchlistRow,
  TmdbMatchCandidate,
  NormalizedPreviewItem,
  DuplicateResolutionStrategy,
  MergeFields,
  DuplicateResolution,
  BulkImportRequest,
  ImportResult,
  ExportedWatchlistEntry,
  ExportResponse,
} from './types';

import {
  rawWatchlistRowSchema,
  tmdbMatchCandidateSchema,
  normalizedPreviewItemSchema,
  duplicateResolutionStrategySchema,
  mergeFieldsSchema,
  duplicateResolutionSchema,
  bulkImportRequestSchema,
  importResultSchema,
  exportedWatchlistEntrySchema,
  exportResponseSchema,
} from './schemas';

import {
  normalizeWatchStatus,
  parseStreamingProviders,
  normalizeDateString,
  calculateMatchConfidence,
  normalizeRating,
} from './utils';

// Type assertions to ensure imports work
const _rawRow: RawWatchlistRow = {
  title: '',
  status: '',
  rating: undefined,
  notes: '',
  dateWatched: '',
};
const _match: TmdbMatchCandidate = {
  tmdbId: 0,
  title: '',
  matchConfidence: 0,
};
const _preview: NormalizedPreviewItem = {
  title: '',
  status: '',
};
const _strategy: DuplicateResolutionStrategy = 'skip';
const _mergeFields: MergeFields = {};
const _resolution: DuplicateResolution = {
  mediaTitle: '',
  strategy: 'skip',
};
const _bulkRequest: BulkImportRequest = {
  previewItems: [],
  resolutions: [],
};
const _importResult: ImportResult = {
  imported: 0,
  skipped: 0,
  merged: 0,
};
const _exportedEntry: ExportedWatchlistEntry = {
  title: '',
  status: '',
};
const _exportResponse: ExportResponse = {
  entries: [],
};

// Schema assertions
const _schemas = [
  rawWatchlistRowSchema,
  tmdbMatchCandidateSchema,
  normalizedPreviewItemSchema,
  duplicateResolutionStrategySchema,
  mergeFieldsSchema,
  duplicateResolutionSchema,
  bulkImportRequestSchema,
  importResultSchema,
  exportedWatchlistEntrySchema,
  exportResponseSchema,
];

// Utility assertions
const _utils = [
  normalizeWatchStatus,
  parseStreamingProviders,
  normalizeDateString,
  calculateMatchConfidence,
  normalizeRating,
];

// Export for verification (no console.log in production)
export const exportVerification = {
  types: [
    _rawRow,
    _match,
    _preview,
    _strategy,
    _mergeFields,
    _resolution,
    _bulkRequest,
    _importResult,
    _exportedEntry,
    _exportResponse,
  ],
  schemas: _schemas.length,
  utils: _utils.length,
};