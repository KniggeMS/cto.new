'use client';

import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FilterControls } from '@/components/ui/FilterControls';
import { WatchlistGroup } from '@/components/watchlist/WatchlistGroup';
import { WatchlistDetailDrawer } from '@/components/watchlist/WatchlistDetailDrawer';
import { WatchlistImportPanel } from '@/components/watchlist/WatchlistImportPanel';
import { ImportPreviewTable } from '@/components/watchlist/ImportPreviewTable';
import { DuplicateResolutionDialog } from '@/components/watchlist/DuplicateResolutionDialog';
import { ExportPanel } from '@/components/watchlist/ExportPanel';
import {
  useWatchlist,
  useRemoveFromWatchlist,
  useConfirmWatchlistImport,
} from '@/lib/hooks/use-watchlist';
import {
  filterAndSortWatchlist,
  groupWatchlistByStatus,
} from '@/lib/utils/watchlist-utils';
import { PlayCircle, CheckCircle, Clock, Plus, Download, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { WatchlistEntry } from '@/lib/api/watchlist';
import type { StatusFilter, SortOption } from '@/lib/utils/watchlist-utils';
import type { NormalizedPreviewItem, DuplicateResolution } from '@infocus/shared';

export default function WatchlistPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded_desc');
  const [selectedEntry, setSelectedEntry] = useState<WatchlistEntry | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Import/Export state
  const [activeView, setActiveView] = useState<'watchlist' | 'import' | 'export'>('watchlist');
  const [importPreview, setImportPreview] = useState<NormalizedPreviewItem[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const { data: watchlist, isLoading, error } = useWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const confirmImportMutation = useConfirmWatchlistImport();

  // Filter and sort the watchlist
  const filteredAndSorted = watchlist
    ? filterAndSortWatchlist(watchlist, { statusFilter, sortBy })
    : [];

  // Group by status if showing all, otherwise use filtered results
  const groups =
    statusFilter === 'all'
      ? groupWatchlistByStatus(filteredAndSorted)
      : {
          not_watched: statusFilter === 'not_watched' ? filteredAndSorted : [],
          watching: statusFilter === 'watching' ? filteredAndSorted : [],
          completed: statusFilter === 'completed' ? filteredAndSorted : [],
        };

  const handleEditEntry = (entry: WatchlistEntry) => {
    setSelectedEntry(entry);
    setIsDetailDrawerOpen(true);
  };

  const handleRemoveEntry = async (entry: WatchlistEntry) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${entry.mediaItem.title}" from your watchlist?`,
    );
    if (!confirmed) return;

    try {
      await removeMutation.mutateAsync(entry.id);
      toast.success('Removed from watchlist');
    } catch (error) {
      toast.error('Failed to remove from watchlist');
    }
  };

  const handleCloseDetailDrawer = () => {
    setIsDetailDrawerOpen(false);
    setSelectedEntry(null);
  };

  // Import/Export handlers
  const handlePreviewGenerated = (items: NormalizedPreviewItem[]) => {
    setImportPreview(items);
    setActiveView('import');
  };

  const handleProceedToResolutions = () => {
    setShowDuplicateDialog(true);
  };

  const handleDuplicateResolution = async (resolutions: DuplicateResolution[]) => {
    try {
      // Create bulk import request
      const bulkRequest = {
        items: importPreview,
        resolutions,
        skipUnmatched: true,
        defaultDuplicateStrategy: 'skip' as const,
      };

      const result = await confirmImportMutation.mutateAsync(bulkRequest);

      toast.success(
        `Import completed: ${result.imported} imported, ${result.skipped} skipped, ${result.merged} merged`,
      );

      // Reset import state
      setImportPreview([]);
      setShowDuplicateDialog(false);
      setActiveView('watchlist');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Import failed';
      toast.error(errorMessage);
    }
  };

  const handleCancelImport = () => {
    setImportPreview([]);
    setShowDuplicateDialog(false);
    setActiveView('watchlist');
  };

  if (isLoading) {
    return (
      <PageShell
        title="My Watchlist"
        description="Track what you're watching, completed, and plan to watch"
      >
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="mt-4 text-gray-600">Loading watchlist...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="My Watchlist">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">Failed to load watchlist. Please try again.</p>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const hasContent =
    groups.not_watched.length > 0 || groups.watching.length > 0 || groups.completed.length > 0;

  return (
    <PageShell
      title="My Watchlist"
      description="Track what you're watching, completed, and plan to watch"
    >
      {/* Import/Export Navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveView('watchlist')}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${
                  activeView === 'watchlist'
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              My Watchlist
            </button>
            <button
              onClick={() => setActiveView('import')}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2
                ${
                  activeView === 'import'
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <Upload className="h-4 w-4" />
              <span>Import</span>
            </button>
            <button
              onClick={() => setActiveView('export')}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2
                ${
                  activeView === 'export'
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Watchlist View */}
      {activeView === 'watchlist' && (
        <>
          {/* Filter Controls */}
          <div className="mb-6">
            <FilterControls
              statusFilter={statusFilter}
              sortBy={sortBy}
              onStatusChange={setStatusFilter}
              onSortChange={setSortBy}
            />
          </div>
        </>
      )}

      {/* Content based on active view */}
      {activeView === 'watchlist' && (
        <>
          {/* Empty State */}
          {!hasContent ? (
            <Card>
              <CardContent className="py-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {statusFilter === 'all'
                    ? 'Your watchlist is empty'
                    : `No ${statusFilter.replace('_', ' ')} items`}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {statusFilter === 'all'
                    ? 'Start by searching for movies and TV shows to add to your watchlist, or import an existing watchlist.'
                    : 'Try changing the filters to see more items.'}
                </p>
                {statusFilter === 'all' && (
                  <div className="mt-6 flex space-x-3 justify-center">
                    <Button onClick={() => (window.location.href = '/search')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Browse Content
                    </Button>
                    <Button variant="outline" onClick={() => setActiveView('import')}>
                      <Upload className="w-4 h-4 mr-2" />
                      Import Watchlist
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Not Watched */}
              {(statusFilter === 'all' || statusFilter === 'not_watched') && (
                <WatchlistGroup
                  title="Not Watched"
                  entries={groups.not_watched}
                  onEditEntry={handleEditEntry}
                  onRemoveEntry={handleRemoveEntry}
                  emptyMessage="No items not watched"
                  icon={<Clock className="w-5 h-5 text-gray-600" />}
                />
              )}

              {/* Currently Watching */}
              {(statusFilter === 'all' || statusFilter === 'watching') && (
                <WatchlistGroup
                  title="Currently Watching"
                  entries={groups.watching}
                  onEditEntry={handleEditEntry}
                  onRemoveEntry={handleRemoveEntry}
                  emptyMessage="No items currently being watched"
                  icon={<PlayCircle className="w-5 h-5 text-blue-600" />}
                />
              )}

              {/* Completed */}
              {(statusFilter === 'all' || statusFilter === 'completed') && (
                <WatchlistGroup
                  title="Completed"
                  entries={groups.completed}
                  onEditEntry={handleEditEntry}
                  onRemoveEntry={handleRemoveEntry}
                  emptyMessage="No completed items"
                  icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Import View */}
      {activeView === 'import' && (
        <div className="space-y-6">
          {importPreview.length === 0 ? (
            <WatchlistImportPanel onPreviewGenerated={handlePreviewGenerated} />
          ) : (
            <ImportPreviewTable
              items={importPreview}
              onItemsUpdate={setImportPreview}
              onProceedToResolutions={handleProceedToResolutions}
            />
          )}
        </div>
      )}

      {/* Export View */}
      {activeView === 'export' && <ExportPanel />}

      {/* Detail Drawer */}
      <WatchlistDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={handleCloseDetailDrawer}
        entry={selectedEntry}
      />

      {/* Duplicate Resolution Dialog */}
      {showDuplicateDialog && (
        <DuplicateResolutionDialog
          items={importPreview}
          existingEntries={watchlist || []}
          onConfirm={handleDuplicateResolution}
          onCancel={handleCancelImport}
        />
      )}
    </PageShell>
  );
}
