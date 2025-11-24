'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { 
  NormalizedPreviewItem, 
  DuplicateResolution, 
  DuplicateResolutionStrategy,
  MergeFields 
} from '@infocus/shared';
import { createFocusTrap } from '@/lib/utils/accessibility';
import { 
  X, 
  Copy, 
  ArrowRight, 
  Check, 
  AlertTriangle,
  Film,
  Tv,
  Star,
  Calendar
} from 'lucide-react';

interface DuplicateResolutionDialogProps {
  items: NormalizedPreviewItem[];
  existingEntries: any[]; // This would come from the current watchlist
  onConfirm: (resolutions: DuplicateResolution[]) => void;
  onCancel: () => void;
}

export function DuplicateResolutionDialog({
  items,
  existingEntries,
  onConfirm,
  onCancel
}: DuplicateResolutionDialogProps) {
  const [resolutions, setResolutions] = useState<Record<number, DuplicateResolution>>({});
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const dialogRef = useRef<HTMLDivElement>(null);

  // Set up focus trap and escape key handling
  useEffect(() => {
    if (dialogRef.current) {
      const cleanup = createFocusTrap(dialogRef.current);
      
      // Handle escape key
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onCancel();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        cleanup();
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [onCancel]);

  // Filter items that have duplicates
  const duplicateItems = items.filter(item => item.hasExistingEntry);

  const toggleItemExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const updateResolution = (itemIndex: number, resolution: Partial<DuplicateResolution>) => {
    setResolutions(prev => ({
      ...prev,
      [itemIndex]: {
        ...prev[itemIndex],
        itemIndex,
        ...resolution
      }
    }));
  };

  const updateMergeFields = (itemIndex: number, mergeFields: Partial<MergeFields>) => {
    setResolutions(prev => ({
      ...prev,
      [itemIndex]: {
        ...prev[itemIndex],
        itemIndex,
        mergeFields: {
          ...prev[itemIndex]?.mergeFields,
          ...mergeFields
        }
      }
    }));
  };

  const getExistingEntry = (item: NormalizedPreviewItem) => {
    return existingEntries.find(entry => entry.id === item.existingEntryId);
  };

  const handleConfirm = () => {
    const resolutionList = duplicateItems.map(item => {
      const defaultResolution: DuplicateResolution = {
        itemIndex: items.indexOf(item),
        strategy: 'skip',
        mergeFields: {
          status: false,
          rating: false,
          notes: 'keep',
          streamingProviders: 'keep'
        }
      };

      return resolutions[items.indexOf(item)] || defaultResolution;
    });

    onConfirm(resolutionList);
  };

  const allItemsResolved = duplicateItems.every(item => {
    const resolution = resolutions[items.indexOf(item)];
    return resolution && resolution.strategy !== 'skip';
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={dialogRef} className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Resolve Duplicates</h2>
              <p className="text-sm text-gray-600 mt-1">
                Found {duplicateItems.length} items that already exist in your watchlist
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {duplicateItems.map((item, index) => {
            const itemIndex = items.indexOf(item);
            const existingEntry = getExistingEntry(item);
            const resolution = resolutions[itemIndex];
            const isExpanded = expandedItems.has(itemIndex);

            return (
              <Card key={itemIndex} className="border-orange-200">
                <CardContent className="p-4">
                  {/* Item Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{item.originalTitle}</h4>
                        {item.originalYear && (
                          <span className="text-sm text-gray-500">({item.originalYear})</span>
                        )}
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Copy className="h-3 w-3 mr-1" />
                          Duplicate
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleItemExpanded(itemIndex)}
                      >
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </Button>
                    </div>
                  </div>

                  {/* Resolution Strategy */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resolution Strategy:
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'skip', label: 'Skip', description: 'Keep existing entry' },
                        { value: 'overwrite', label: 'Overwrite', description: 'Replace with imported data' },
                        { value: 'merge', label: 'Merge', description: 'Combine both entries' }
                      ].map((strategy) => (
                        <button
                          key={strategy.value}
                          type="button"
                          onClick={() => updateResolution(itemIndex, { 
                            strategy: strategy.value as DuplicateResolutionStrategy 
                          })}
                          className={`
                            p-3 border rounded-lg text-left transition-all
                            ${resolution?.strategy === strategy.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="font-medium text-gray-900">{strategy.label}</div>
                          <div className="text-xs text-gray-600 mt-1">{strategy.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {/* Existing vs Incoming Comparison */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Existing Entry */}
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Existing Entry</h5>
                          {existingEntry && (
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium">{existingEntry.status.replace('_', ' ')}</span>
                              </div>
                              {existingEntry.rating && (
                                <div className="flex items-center space-x-2">
                                  <Star className="h-4 w-4 text-gray-400" />
                                  <span>{existingEntry.rating}/10</span>
                                </div>
                              )}
                              {existingEntry.notes && (
                                <div>
                                  <span className="text-gray-600">Notes:</span>
                                  <p className="text-gray-900 mt-1">{existingEntry.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Incoming Entry */}
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Incoming Entry</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-600">Status:</span>
                              <span className="font-medium">{item.suggestedStatus.replace('_', ' ')}</span>
                            </div>
                            {item.rating && (
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4 text-gray-400" />
                                <span>{item.rating}/10</span>
                              </div>
                            )}
                            {item.notes && (
                              <div>
                                <span className="text-gray-600">Notes:</span>
                                <p className="text-gray-900 mt-1">{item.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Merge Options (only show when merge is selected) */}
                      {resolution?.strategy === 'merge' && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Merge Options:</h5>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Status */}
                            <div>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={resolution.mergeFields?.status || false}
                                  onChange={(e) => updateMergeFields(itemIndex, { 
                                    status: e.target.checked 
                                  })}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">Update status</span>
                              </label>
                            </div>

                            {/* Rating */}
                            <div>
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={resolution.mergeFields?.rating || false}
                                  onChange={(e) => updateMergeFields(itemIndex, { 
                                    rating: e.target.checked 
                                  })}
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">Update rating</span>
                              </label>
                            </div>

                            {/* Notes */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notes:
                              </label>
                              <select
                                value={resolution.mergeFields?.notes || 'keep'}
                                onChange={(e) => updateMergeFields(itemIndex, { 
                                  notes: e.target.value as 'append' | 'replace' | 'keep' 
                                })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                              >
                                <option value="keep">Keep existing</option>
                                <option value="replace">Replace with incoming</option>
                                <option value="append">Append incoming</option>
                              </select>
                            </div>

                            {/* Streaming Providers */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Streaming Providers:
                              </label>
                              <select
                                value={resolution.mergeFields?.streamingProviders || 'keep'}
                                onChange={(e) => updateMergeFields(itemIndex, { 
                                  streamingProviders: e.target.value as 'merge' | 'replace' | 'keep' 
                                })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                              >
                                <option value="keep">Keep existing</option>
                                <option value="replace">Replace with incoming</option>
                                <option value="merge">Merge both lists</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Warning for unresolved items */}
          {!allItemsResolved && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Please resolve all duplicates</p>
                  <p className="mt-1">
                    Some items still need a resolution strategy. Select how to handle each duplicate above.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {duplicateItems.filter((_, i) => resolutions[items.indexOf(duplicateItems[i])]?.strategy !== 'skip').length} of {duplicateItems.length} items resolved
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={!allItemsResolved}
              >
                Complete Import
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}