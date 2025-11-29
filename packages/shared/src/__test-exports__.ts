/**
 * Test exports for shared package schemas, types, and utilities.
 * This file is used internally for testing and should not be imported in production code.
 */

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

// Schema assertions to ensure imports work
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

// Export for verification
export const exportVerification = {
  schemas: _schemas.length,
  utils: _utils.length,
};