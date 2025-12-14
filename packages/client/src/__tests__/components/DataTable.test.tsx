import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type Column } from '@/components/ui/data-table';

interface TestData {
  id: number;
  name: string;
  value: number;
}

const testData: TestData[] = [
  { id: 1, name: 'Alpha', value: 100 },
  { id: 2, name: 'Beta', value: 200 },
  { id: 3, name: 'Gamma', value: 50 },
];

const columns: Column<TestData>[] = [
  {
    key: 'name',
    header: 'Name',
    cell: (row) => row.name,
    sortable: true,
    sortFn: (a, b) => a.name.localeCompare(b.name),
  },
  {
    key: 'value',
    header: 'Value',
    cell: (row) => row.value.toString(),
    sortable: true,
    sortFn: (a, b) => a.value - b.value,
  },
];

describe('DataTable', () => {
  it('renders data correctly', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowKey={(row) => row.id}
      />
    );

    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.getByText('Gamma')).toBeTruthy();
  });

  it('renders column headers', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowKey={(row) => row.id}
      />
    );

    // Headers are rendered (sortable columns have buttons)
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: /value/i })).toBeTruthy();
  });

  it('shows empty message when no data', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        getRowKey={(row) => row.id}
        emptyMessage="No items found"
      />
    );

    expect(screen.getByText('No items found')).toBeTruthy();
  });

  it('shows loading skeleton when isLoading is true', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        getRowKey={(row) => row.id}
        isLoading
      />
    );

    // Should render skeleton rows with animate-pulse class
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('filters data with search', () => {
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowKey={(row) => row.id}
        searchable
        searchPlaceholder="Search..."
        searchFilter={(row, query) => row.name.toLowerCase().includes(query)}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'alpha' } });

    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.queryByText('Beta')).toBeNull();
    expect(screen.queryByText('Gamma')).toBeNull();
  });

  it('calls onRowClick when row is clicked', () => {
    const handleRowClick = vi.fn();
    render(
      <DataTable
        data={testData}
        columns={columns}
        getRowKey={(row) => row.id}
        onRowClick={handleRowClick}
      />
    );

    fireEvent.click(screen.getByText('Alpha').closest('tr')!);
    expect(handleRowClick).toHaveBeenCalledWith(testData[0]);
  });

  it('handles pagination', () => {
    const manyItems = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      value: i * 10,
    }));

    render(
      <DataTable
        data={manyItems}
        columns={columns}
        getRowKey={(row) => row.id}
        paginated
        pageSize={10}
      />
    );

    // Should show first 10 items
    expect(screen.getByText('Item 1')).toBeTruthy();
    expect(screen.getByText('Item 10')).toBeTruthy();
    expect(screen.queryByText('Item 11')).toBeNull();

    // Check pagination info
    expect(screen.getByText(/Page 1 of 3/)).toBeTruthy();
  });
});
