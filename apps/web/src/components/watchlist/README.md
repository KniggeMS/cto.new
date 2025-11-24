# Watchlist Import/Export Components

This directory contains components for importing and exporting watchlist data in the InFocus web application.

## Components

### WatchlistImportPanel

A panel component that handles file upload for importing watchlist data.

**Features:**
- Drag and drop file upload
- File type validation (CSV, JSON, TXT)
- File size validation (10MB limit)
- Progress indicators
- Format instructions

**Props:**
- `onPreviewGenerated: (items: NormalizedPreviewItem[]) => void` - Callback when file is successfully parsed

**Usage:**
```tsx
<WatchlistImportPanel onPreviewGenerated={handlePreviewGenerated} />
```

### ImportPreviewTable

A table component that displays parsed import data and allows users to select TMDB matches.

**Features:**
- Expandable rows to view TMDB match candidates
- Confidence scoring with color coding
- Duplicate detection and badges
- Skip functionality for unwanted items
- TMDB links for selected matches

**Props:**
- `items: NormalizedPreviewItem[]` - The parsed import items
- `onItemsUpdate: (items: NormalizedPreviewItem[]) => void` - Callback when items are modified
- `onProceedToResolutions: () => void` - Callback to proceed to duplicate resolution

**Usage:**
```tsx
<ImportPreviewTable
  items={importPreview}
  onItemsUpdate={setImportPreview}
  onProceedToResolutions={handleProceedToResolutions}
/>
```

### DuplicateResolutionDialog

A modal dialog for handling duplicate entries during import.

**Features:**
- Focus trap for accessibility
- Keyboard navigation (Escape to close, Tab to navigate)
- Multiple resolution strategies (skip, overwrite, merge)
- Merge configuration options
- Side-by-side comparison of existing vs incoming data

**Props:**
- `items: NormalizedPreviewItem[]` - Items with duplicates
- `existingEntries: WatchlistEntry[]` - Current watchlist entries
- `onConfirm: (resolutions: DuplicateResolution[]) => void` - Callback when resolutions are confirmed
- `onCancel: () => void` - Callback to cancel the dialog

**Usage:**
```tsx
<DuplicateResolutionDialog
  items={duplicateItems}
  existingEntries={watchlist}
  onConfirm={handleDuplicateResolution}
  onCancel={handleCancelImport}
/>
```

### ExportPanel

A panel component for exporting watchlist data.

**Features:**
- Format selection (CSV, JSON)
- Watchlist summary display
- Format descriptions and guidelines
- Automatic filename generation with timestamps
- Download functionality

**Props:**
None (uses hooks internally)

**Usage:**
```tsx
<ExportPanel />
```

## Hooks

### useWatchlistImportPreview

Mutation hook for uploading and parsing import files.

**Returns:**
- `mutateAsync: (file: File) => Promise<NormalizedPreviewItem[]>`
- `isPending: boolean`
- `error: Error | null`

### useConfirmWatchlistImport

Mutation hook for confirming and executing the import.

**Returns:**
- `mutateAsync: (request: BulkImportRequest) => Promise<ImportResult>`
- `isPending: boolean`
- `error: Error | null`

### useWatchlistExport

Mutation hook for exporting watchlist data.

**Returns:**
- `mutateAsync: (format: 'csv' | 'json') => Promise<Blob>`
- `isPending: boolean`
- `error: Error | null`

## Utilities

### File Utilities (`/lib/utils/file.ts`)

- `downloadBlob(blob: Blob, filename: string): void` - Downloads a blob as a file
- `generateTimestampedFilename(baseName: string, extension: string): string` - Generates timestamped filenames
- `formatFileSize(bytes: number): string` - Formats file size in human readable format
- `isValidImportFile(file: File): boolean` - Validates file type for import
- `isValidFileSize(file: File, maxSize?: number): boolean` - Validates file size for import

### Accessibility Utilities (`/lib/utils/accessibility.ts`)

- `createFocusTrap(container: HTMLElement): () => void` - Creates focus trap within a container
- `isElementVisible(element: HTMLElement): boolean` - Checks if element is visible
- `getFocusableElements(container: HTMLElement): HTMLElement[]` - Gets all focusable elements

## File Formats

### Import Formats

#### CSV
- Required columns: `title`
- Optional columns: `year`, `status`, `rating`, `notes`, `dateAdded`, `streamingProviders`
- Status values: `not_watched`, `watching`, `completed` (various aliases accepted)
- Rating scale: 0-10
- Date format: ISO 8601 or YYYY-MM-DD

#### JSON
- Array of objects with same fields as CSV
- Example:
```json
[
  {
    "title": "Inception",
    "year": 2010,
    "status": "completed",
    "rating": 9,
    "notes": "Amazing movie!",
    "dateAdded": "2024-01-15T00:00:00Z",
    "streamingProviders": ["netflix", "hulu"]
  }
]
```

### Export Formats

#### CSV
- Standard CSV format with headers
- Compatible with Excel, Google Sheets
- Includes all watchlist data

#### JSON
- Structured JSON array
- Includes TMDB IDs for re-importing
- Machine-readable format

## Testing

All components include comprehensive Jest tests covering:
- User interactions
- File handling
- Error states
- Accessibility
- Integration scenarios

Run tests with:
```bash
npm test -- --testPathPattern=watchlist
```

## Accessibility

All components follow WCAG guidelines:
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- High contrast support
- Focus traps in modals