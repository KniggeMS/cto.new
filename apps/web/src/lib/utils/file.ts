/**
 * Utility functions for file operations
 */

/**
 * Download a blob as a file with automatic filename generation
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generate a timestamped filename
 */
export function generateTimestampedFilename(baseName: string, extension: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${baseName}-${timestamp}.${extension}`;
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Validate file type for import
 */
export function isValidImportFile(file: File): boolean {
  const validTypes = ['text/csv', 'application/json', 'text/plain'];
  const validExtensions = ['csv', 'json', 'txt'];
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  return validTypes.includes(file.type) || validExtensions.includes(fileExtension || '');
}

/**
 * Validate file size for import (max 10MB)
 */
export function isValidFileSize(file: File, maxSize: number = 10 * 1024 * 1024): boolean {
  return file.size <= maxSize;
}