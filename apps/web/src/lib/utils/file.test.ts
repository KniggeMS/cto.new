import { 
  downloadBlob, 
  generateTimestampedFilename, 
  formatFileSize, 
  isValidImportFile, 
  isValidFileSize 
} from '../file';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document methods
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
});

describe('File Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock link element
    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
    };
    mockCreateElement.mockReturnValue(mockLink);
  });

  describe('downloadBlob', () => {
    it('creates a download link and triggers download', () => {
      const blob = new Blob(['test content']);
      const filename = 'test-file.txt';

      downloadBlob(blob, filename);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      
      const mockLink = mockCreateElement.mock.results[0].value;
      expect(mockLink.href).toBe('mock-url');
      expect(mockLink.download).toBe(filename);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    });
  });

  describe('generateTimestampedFilename', () => {
    it('generates filename with current date', () => {
      const fixedDate = new Date('2024-03-15T00:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => fixedDate as any);

      const filename = generateTimestampedFilename('watchlist', 'csv');
      
      expect(filename).toBe('watchlist-2024-03-15.csv');
      
      jest.restoreAllMocks();
    });

    it('handles different extensions', () => {
      const fixedDate = new Date('2024-03-15T00:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => fixedDate as any);

      expect(generateTimestampedFilename('data', 'json')).toBe('data-2024-03-15.json');
      expect(generateTimestampedFilename('export', 'txt')).toBe('export-2024-03-15.txt');
      
      jest.restoreAllMocks();
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(512)).toBe('512 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('handles large numbers', () => {
      expect(formatFileSize(10 * 1024 * 1024)).toBe('10 MB');
      expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB');
    });
  });

  describe('isValidImportFile', () => {
    it('validates by MIME type', () => {
      const csvFile = new File(['content'], 'test.csv', { type: 'text/csv' });
      const jsonFile = new File(['content'], 'test.json', { type: 'application/json' });
      const textFile = new File(['content'], 'test.txt', { type: 'text/plain' });

      expect(isValidImportFile(csvFile)).toBe(true);
      expect(isValidImportFile(jsonFile)).toBe(true);
      expect(isValidImportFile(textFile)).toBe(true);
    });

    it('validates by file extension', () => {
      const csvFile = new File(['content'], 'test.csv', { type: 'application/octet-stream' });
      const jsonFile = new File(['content'], 'test.json', { type: 'application/octet-stream' });
      const txtFile = new File(['content'], 'test.txt', { type: 'application/octet-stream' });

      expect(isValidImportFile(csvFile)).toBe(true);
      expect(isValidImportFile(jsonFile)).toBe(true);
      expect(isValidImportFile(txtFile)).toBe(true);
    });

    it('rejects invalid file types', () => {
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const exeFile = new File(['content'], 'test.exe', { type: 'application/octet-stream' });

      expect(isValidImportFile(imageFile)).toBe(false);
      expect(isValidImportFile(pdfFile)).toBe(false);
      expect(isValidImportFile(exeFile)).toBe(false);
    });

    it('handles case insensitive extensions', () => {
      const upperCaseFile = new File(['content'], 'TEST.CSV', { type: 'application/octet-stream' });
      const mixedCaseFile = new File(['content'], 'Test.Json', { type: 'application/octet-stream' });

      expect(isValidImportFile(upperCaseFile)).toBe(true);
      expect(isValidImportFile(mixedCaseFile)).toBe(true);
    });
  });

  describe('isValidFileSize', () => {
    it('accepts files within size limit', () => {
      const smallFile = new File(['content'], 'small.txt');
      Object.defineProperty(smallFile, 'size', { value: 1024 });

      expect(isValidFileSize(smallFile)).toBe(true);
    });

    it('accepts files exactly at size limit', () => {
      const maxSizeFile = new File(['content'], 'max.txt');
      Object.defineProperty(maxSizeFile, 'size', { value: 10 * 1024 * 1024 });

      expect(isValidFileSize(maxSizeFile, 10 * 1024 * 1024)).toBe(true);
    });

    it('rejects files over size limit', () => {
      const largeFile = new File(['content'], 'large.txt');
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

      expect(isValidFileSize(largeFile, 10 * 1024 * 1024)).toBe(false);
    });

    it('uses default size limit when not specified', () => {
      const largeFile = new File(['content'], 'large.txt');
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

      expect(isValidFileSize(largeFile)).toBe(false);
    });

    it('accepts custom size limit', () => {
      const mediumFile = new File(['content'], 'medium.txt');
      Object.defineProperty(mediumFile, 'size', { value: 5 * 1024 * 1024 });

      expect(isValidFileSize(mediumFile, 5 * 1024 * 1024)).toBe(true);
      expect(isValidFileSize(mediumFile, 4 * 1024 * 1024)).toBe(false);
    });
  });
});