'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useWatchlistImportPreview } from '@/lib/hooks/use-watchlist';
import { isValidImportFile, isValidFileSize, formatFileSize } from '@/lib/utils/file';
import type { NormalizedPreviewItem } from '@infocus/shared';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WatchlistImportPanelProps {
  onPreviewGenerated: (items: NormalizedPreviewItem[]) => void;
}

export function WatchlistImportPanel({ onPreviewGenerated }: WatchlistImportPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const importPreviewMutation = useWatchlistImportPreview();

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!isValidImportFile(file)) {
      toast.error('Please select a CSV or JSON file');
      return;
    }

    // Validate file size (10MB limit)
    if (!isValidFileSize(file)) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      const previewItems = await importPreviewMutation.mutateAsync(selectedFile);
      onPreviewGenerated(previewItems);
      toast.success(`Parsed ${previewItems.length} items from file`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to parse file';
      toast.error(errorMessage);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Import Watchlist</h3>
              <p className="text-sm text-gray-600">
                Import your watchlist from a CSV or JSON file
              </p>
            </div>
            <FileText className="h-6 w-6 text-gray-400" />
          </div>

          {/* File Upload Area */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${isDragging 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.txt"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your file here, or click to browse
            </p>
            <p className="text-sm text-gray-600">
              Supports CSV and JSON files up to 10MB
            </p>
          </div>

          {/* Selected File Info */}
          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Remove
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || importPreviewMutation.isPending}
              isLoading={importPreviewMutation.isPending}
              className="flex-1"
            >
              {importPreviewMutation.isPending ? 'Parsing...' : 'Parse File'}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={importPreviewMutation.isPending}>
              Clear
            </Button>
          </div>

          {/* Format Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">File Format Guidelines:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>CSV:</strong> Columns should include title (required), year, status, rating, notes, dateAdded</li>
                  <li>• <strong>JSON:</strong> Array of objects with the same fields as CSV</li>
                  <li>• <strong>Status:</strong> Use "not_watched", "watching", or "completed"</li>
                  <li>• <strong>Rating:</strong> Scale of 0-10</li>
                  <li>• <strong>Date:</strong> ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}