'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useWatchlistExport } from '@/lib/hooks/use-watchlist';
import { useWatchlist } from '@/lib/hooks/use-watchlist';
import { downloadBlob, generateTimestampedFilename } from '@/lib/utils/file';
import { 
  Download, 
  FileText, 
  Code, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Film
} from 'lucide-react';
import { toast } from 'react-hot-toast';

type ExportFormat = 'csv' | 'json';

export function ExportPanel() {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const { data: watchlist } = useWatchlist();
  const exportMutation = useWatchlistExport();

  const handleExport = async () => {
    if (!watchlist || watchlist.length === 0) {
      toast.error('Your watchlist is empty');
      return;
    }

    try {
      const blob = await exportMutation.mutateAsync(format);
      
      // Generate filename and download
      const filename = generateTimestampedFilename('watchlist', format);
      downloadBlob(blob, filename);
      
      toast.success(`Exported ${watchlist.length} items as ${format.toUpperCase()}`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to export watchlist';
      toast.error(errorMessage);
    }
  };

  const getFormatDescription = (fmt: ExportFormat) => {
    switch (fmt) {
      case 'csv':
        return 'Comma-separated values, easy to open in Excel or Google Sheets';
      case 'json':
        return 'Structured data format, ideal for developers and backups';
      default:
        return '';
    }
  };

  const getFormatIcon = (fmt: ExportFormat) => {
    switch (fmt) {
      case 'csv':
        return <FileText className="h-5 w-5" />;
      case 'json':
        return <Code className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Export Watchlist</h3>
              <p className="text-sm text-gray-600">
                Download your watchlist for backup or importing into other services
              </p>
            </div>
            <Download className="h-6 w-6 text-gray-400" />
          </div>

          {/* Watchlist Summary */}
          {watchlist && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Film className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {watchlist.length} items
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <span className="text-sm text-gray-600">
                      Last updated: {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {watchlist.length > 0 && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          )}

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              {(['csv', 'json'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`
                    p-4 border rounded-lg text-left transition-all
                    ${format === fmt
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-opacity-20'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`
                      p-2 rounded-lg
                      ${format === fmt ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}
                    `}>
                      {getFormatIcon(fmt)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 uppercase">{fmt}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {getFormatDescription(fmt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Details */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">What's included:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Title, year, and media type (movie/TV)</li>
                  <li>• Watch status, rating, and personal notes</li>
                  <li>• Date added and completion date</li>
                  <li>• TMDB IDs for easy re-importing</li>
                  <li>• Streaming provider information</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleExport}
              disabled={!watchlist || watchlist.length === 0 || exportMutation.isPending}
              isLoading={exportMutation.isPending}
              className="flex-1"
            >
              {exportMutation.isPending ? 'Exporting...' : 'Export Watchlist'}
            </Button>
          </div>

          {/* Empty State */}
          {watchlist && watchlist.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No items to export</h4>
              <p className="text-sm text-gray-600">
                Add some movies and TV shows to your watchlist first, then come back to export them.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}