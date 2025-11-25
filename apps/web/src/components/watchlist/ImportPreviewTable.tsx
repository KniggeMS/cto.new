'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import type { NormalizedPreviewItem } from '@infocus/shared';
import {
  Check,
  X,
  AlertTriangle,
  Film,
  Tv,
  Star,
  Calendar,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface ImportPreviewTableProps {
  items: NormalizedPreviewItem[];
  onItemsUpdate: (items: NormalizedPreviewItem[]) => void;
  onProceedToResolutions: () => void;
}

export function ImportPreviewTable({
  items,
  onItemsUpdate,
  onProceedToResolutions,
}: ImportPreviewTableProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItemExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const handleMatchSelection = (itemIndex: number, matchIndex: number) => {
    const updatedItems = [...items];
    updatedItems[itemIndex].selectedMatchIndex = matchIndex;
    onItemsUpdate(updatedItems);
  };

  const handleItemSkip = (itemIndex: number) => {
    const updatedItems = [...items];
    updatedItems[itemIndex].shouldSkip = !updatedItems[itemIndex].shouldSkip;
    onItemsUpdate(updatedItems);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    if (confidence >= 0.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'High';
    if (confidence >= 0.7) return 'Good';
    if (confidence >= 0.5) return 'Fair';
    return 'Low';
  };

  const hasItemsNeedingResolution = items.some(
    (item) => item.hasExistingEntry || (item.matchCandidates.length === 0 && !item.shouldSkip),
  );

  const validItemCount = items.filter(
    (item) =>
      !item.shouldSkip && (item.selectedMatchIndex !== null || item.matchCandidates.length > 0),
  ).length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Import Preview</h3>
              <p className="text-sm text-gray-600">
                Review and select matches for {items.length} items
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Valid: <span className="font-medium text-green-600">{validItemCount}</span>
              </div>
              <div className="text-sm text-gray-600">
                Skipped:{' '}
                <span className="font-medium text-orange-600">
                  {items.filter((item) => item.shouldSkip).length}
                </span>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className={`
                  border rounded-lg p-4 transition-all
                  ${item.shouldSkip ? 'opacity-50 bg-gray-50' : 'bg-white'}
                  ${item.hasExistingEntry ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}
                `}
              >
                {/* Item Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{item.originalTitle}</h4>
                      {item.originalYear && (
                        <span className="text-sm text-gray-500">({item.originalYear})</span>
                      )}
                      {item.hasExistingEntry && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          <Copy className="h-3 w-3 mr-1" />
                          Duplicate
                        </span>
                      )}
                      {item.error && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Error
                        </span>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <span>Status:</span>
                        <span className="font-medium">
                          {item.suggestedStatus.replace('_', ' ')}
                        </span>
                      </div>
                      {item.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4" />
                          <span>{item.rating}/10</span>
                        </div>
                      )}
                      {item.dateAdded && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(item.dateAdded).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {item.error && <p className="mt-2 text-sm text-red-600">{item.error}</p>}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => toggleItemExpanded(index)}>
                      {expandedItems.has(index) ? 'Collapse' : 'Expand'}
                    </Button>
                    <Button
                      variant={item.shouldSkip ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => handleItemSkip(index)}
                    >
                      {item.shouldSkip ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      {item.shouldSkip ? 'Will Skip' : 'Skip'}
                    </Button>
                  </div>
                </div>

                {/* Expanded Content - TMDB Matches */}
                {expandedItems.has(index) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {item.matchCandidates.length > 0 ? (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-900">TMDB Matches:</h5>
                        {item.matchCandidates.map((match, matchIndex) => (
                          <div
                            key={matchIndex}
                            className={`
                              border rounded-lg p-3 cursor-pointer transition-all
                              ${
                                item.selectedMatchIndex === matchIndex
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                            onClick={() => handleMatchSelection(index, matchIndex)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {/* Radio Button */}
                                <div
                                  className={`
                                  h-4 w-4 rounded-full border-2 flex items-center justify-center
                                  ${
                                    item.selectedMatchIndex === matchIndex
                                      ? 'border-primary-500 bg-primary-500'
                                      : 'border-gray-300'
                                  }
                                `}
                                >
                                  {item.selectedMatchIndex === matchIndex && (
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                  )}
                                </div>

                                {/* Media Type Icon */}
                                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded">
                                  {match.tmdbType === 'movie' ? (
                                    <Film className="h-4 w-4 text-gray-600" />
                                  ) : (
                                    <Tv className="h-4 w-4 text-gray-600" />
                                  )}
                                </div>

                                {/* Match Info */}
                                <div>
                                  <h6 className="font-medium text-gray-900">{match.title}</h6>
                                  {match.year && (
                                    <span className="text-sm text-gray-500">({match.year})</span>
                                  )}
                                  {match.overview && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {match.overview}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Confidence Score */}
                              <div className="text-right">
                                <div
                                  className={`text-sm font-medium ${getConfidenceColor(match.confidence)}`}
                                >
                                  {getConfidenceLabel(match.confidence)}
                                </div>
                                <div className={`text-xs ${getConfidenceColor(match.confidence)}`}>
                                  {Math.round(match.confidence * 100)}%
                                </div>
                              </div>
                            </div>

                            {/* TMDB Link */}
                            {item.selectedMatchIndex === matchIndex && (
                              <div className="mt-2 pt-2 border-t border-primary-200">
                                <a
                                  href={`https://www.themoviedb.org/${match.tmdbType}/${match.tmdbId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-primary-600 hover:text-primary-800"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View on TMDB
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No TMDB matches found</p>
                        <p className="text-xs text-gray-500 mt-1">
                          This item will be skipped unless you can manually match it later
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {hasItemsNeedingResolution && (
                <p className="text-orange-600">
                  Some items have duplicates or need attention before importing
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <Button
                variant="primary"
                onClick={onProceedToResolutions}
                disabled={validItemCount === 0}
              >
                Review Duplicates ({validItemCount} items)
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
