import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FilterControls } from '../FilterControls';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  ChevronDown: () => <div data-testid="chevron-icon">Chevron</div>,
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('FilterControls', () => {
  const mockOnStatusChange = jest.fn();
  const mockOnSortChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default values', () => {
    renderWithProviders(
      <FilterControls
        statusFilter="all"
        sortBy="dateAdded_desc"
        onStatusChange={mockOnStatusChange}
        onSortChange={mockOnSortChange}
      />
    );

    expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    expect(screen.getByText('Filters:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Recently Added')).toBeInTheDocument();
  });

  it('renders with custom values', () => {
    renderWithProviders(
      <FilterControls
        statusFilter="watching"
        sortBy="title_asc"
        onStatusChange={mockOnStatusChange}
        onSortChange={mockOnSortChange}
      />
    );

    expect(screen.getByDisplayValue('Currently Watching')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Title (A-Z)')).toBeInTheDocument();
  });

  it('calls onStatusChange when status filter is changed', () => {
    renderWithProviders(
      <FilterControls
        statusFilter="all"
        sortBy="dateAdded_desc"
        onStatusChange={mockOnStatusChange}
        onSortChange={mockOnSortChange}
      />
    );

    const statusSelect = screen.getByDisplayValue('All Status');
    fireEvent.change(statusSelect, { target: { value: 'not_watched' } });

    expect(mockOnStatusChange).toHaveBeenCalledWith('not_watched');
  });

  it('calls onSortChange when sort option is changed', () => {
    renderWithProviders(
      <FilterControls
        statusFilter="all"
        sortBy="dateAdded_desc"
        onStatusChange={mockOnStatusChange}
        onSortChange={mockOnSortChange}
      />
    );

    const sortSelect = screen.getByDisplayValue('Recently Added');
    fireEvent.change(sortSelect, { target: { value: 'title_asc' } });

    expect(mockOnSortChange).toHaveBeenCalledWith('title_asc');
  });

  it('renders all status options', () => {
    renderWithProviders(
      <FilterControls
        statusFilter="all"
        sortBy="dateAdded_desc"
        onStatusChange={mockOnStatusChange}
        onSortChange={mockOnSortChange}
      />
    );

    const statusSelect = screen.getByDisplayValue('All Status');
    
    expect(statusSelect).toContainHTML('option[value="all"]');
    expect(statusSelect).toContainHTML('option[value="not_watched"]');
    expect(statusSelect).toContainHTML('option[value="watching"]');
    expect(statusSelect).toContainHTML('option[value="completed"]');
  });

  it('renders all sort options', () => {
    renderWithProviders(
      <FilterControls
        statusFilter="all"
        sortBy="dateAdded_desc"
        onStatusChange={mockOnStatusChange}
        onSortChange={mockOnSortChange}
      />
    );

    const sortSelect = screen.getByDisplayValue('Recently Added');
    
    expect(sortSelect).toContainHTML('option[value="dateAdded_desc"]');
    expect(sortSelect).toContainHTML('option[value="dateAdded_asc"]');
    expect(sortSelect).toContainHTML('option[value="title_asc"]');
    expect(sortSelect).toContainHTML('option[value="title_desc"]');
    expect(sortSelect).toContainHTML('option[value="rating_desc"]');
    expect(sortSelect).toContainHTML('option[value="rating_asc"]');
  });
});