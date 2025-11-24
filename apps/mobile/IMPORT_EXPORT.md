# Mobile Import/Export Feature

This document describes the import/export functionality added to the InFocus mobile app.

## Overview

The mobile app now supports importing watchlist data from CSV and JSON files, and exporting the user's watchlist in multiple formats.

## Features

### Import Functionality

Users can import their watchlist by:

1. Tapping the "Import Watchlist" button on the Watchlist screen
2. Selecting a CSV or JSON file from their device
3. Reviewing the import preview with:
   - Original titles and years from the file
   - TMDB match candidates with confidence scores
   - Duplicate detection for items already in the watchlist
4. Selecting TMDB matches for items (if multiple options are available)
5. Choosing how to handle duplicates (skip, overwrite, or merge)
6. Confirming the import

### Export Functionality

Users can export their watchlist by:

1. Selecting the desired format (JSON or CSV)
2. Tapping the "Export Watchlist" button
3. Choosing to save or share the exported file

## Implementation Details

### Dependencies

The feature uses the following Expo modules:

- **expo-document-picker** (~11.9.0) - For file selection
- **expo-file-system** (~16.0.0) - For reading and writing files
- **expo-sharing** (~14.0.0) - For sharing files via the OS share sheet

### API Integration

The mobile app uses the same import/export API endpoints as the web app:

- `POST /watchlist/import/preview` - Get preview of import with TMDB matches
- `POST /watchlist/import/confirm` - Confirm and execute import
- `GET /watchlist/export` - Export watchlist in desired format

### Components

#### ImportExportSection

Main component providing import/export UI:

```typescript
<ImportExportSection 
  onImportComplete={() => {
    // Refresh watchlist after successful import
  }}
/>
```

Props:
- `onImportComplete` (optional) - Callback fired after successful import

Located in: `src/components/watchlist/ImportExportSection.tsx`

#### Nested Components

- **PreviewModal** - Shows import preview with match selection
- **PreviewItem** - Individual import item with duplicate/match options
- **DuplicateStrategyOption** - Clickable strategy selector

### File Handling

#### Import

1. File selected via `expo-document-picker`
2. File content read via `expo-file-system.readAsStringAsync()`
3. Content sent to backend for TMDB matching
4. Preview displayed for user confirmation

#### Export

1. Export data fetched from backend as Blob
2. Converted to base64 using FileReader
3. Written to device storage via `expo-file-system.writeAsStringAsync()`
4. Shared via `expo-sharing.shareAsync()`

### State Management

The component manages:

- `isImporting` - File selection and preview loading state
- `isExporting` - Export operation state
- `exportFormat` - Selected export format (json/csv)
- `previewItems` - Items to be imported with TMDB matches
- `showPreviewModal` - Preview modal visibility
- `selectedMatchIndices` - User-selected TMDB matches
- `duplicateStrategies` - User-selected duplicate resolution strategy
- `isConfirmingImport` - Import confirmation state

### Shared Types

The feature uses types from `@infocus/shared`:

```typescript
import type {
  NormalizedPreviewItem,
  BulkImportRequest,
  DuplicateResolution,
  ImportResult,
  ExportResponse,
} from '@infocus/shared';
```

### Error Handling

The component handles errors gracefully:

- Missing files display an alert
- Network errors are caught and logged
- File system errors prevent app crashes
- Sharing unavailability is handled with fallback

### Styling

The UI follows the existing design system:

- Consistent color palette (Tailwind-compatible)
- Typography hierarchy with native-base
- Spacing and padding conventions
- Responsive layout for different screen sizes

## Testing

Comprehensive tests are provided:

### ImportExportSection.test.tsx

Tests for the main component covering:

- Import file selection
- Preview modal display
- TMDB match display
- Duplicate detection and handling
- Export format selection
- File operations
- Error handling

### WatchlistScreen.test.tsx

Integration tests covering:

- Screen rendering
- Component integration
- Full import/export workflows

Run tests with:

```bash
npm test
```

## Usage Example

```typescript
import { ImportExportSection } from '@/components/watchlist/ImportExportSection';
import { WatchlistScreen } from '@/screens/tabs/WatchlistScreen';

// In WatchlistScreen
export const WatchlistScreen: React.FC = () => {
  const handleImportComplete = () => {
    // Refresh watchlist data
  };

  return (
    <Container scrollable>
      <Text>Your Watchlist</Text>
      <ImportExportSection onImportComplete={handleImportComplete} />
    </Container>
  );
};
```

## API Contract

### Import Preview Request/Response

```typescript
// Request
POST /watchlist/import/preview
Content-Type: multipart/form-data

{
  file: File // CSV or JSON
}

// Response
{
  data: NormalizedPreviewItem[]
  // or
  items: NormalizedPreviewItem[]
}
```

### Import Confirm Request/Response

```typescript
// Request
POST /watchlist/import/confirm
Content-Type: application/json

{
  items: NormalizedPreviewItem[],
  resolutions: DuplicateResolution[],
  skipUnmatched: boolean,
  defaultDuplicateStrategy: 'skip' | 'overwrite' | 'merge'
}

// Response
{
  imported: number,
  skipped: number,
  failed: number,
  merged: number,
  overwritten: number,
  errors: Array<{ itemIndex: number, title: string, error: string }>
}
```

### Export Request/Response

```typescript
// Request
GET /watchlist/export?format=json|csv

// Response
{
  exportedAt: string (ISO 8601),
  userId: string (CUID),
  version: string,
  totalEntries: number,
  entries: ExportedWatchlistEntry[]
}
```

## Browser Compatibility

The feature is designed for React Native and works on:

- iOS 13+
- Android 6+

It uses native APIs for file handling and sharing, providing a seamless experience on both platforms.

## Known Limitations

- Large files (>50MB) may experience performance issues
- File picker supports CSV, JSON, and plain text files
- Export formats are limited to JSON and CSV
- Importing overwrites matching entries based on TMDB ID

## Future Enhancements

- Support for XML export format
- Bulk duplicate resolution with same-for-all option
- Import history/progress tracking
- Scheduled exports
- Cloud backup integration
