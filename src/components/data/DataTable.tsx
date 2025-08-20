import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  Download, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff
} from 'lucide-react';
import { TableState, TableFilter, TableSort } from '@/types';

interface Column {
  id: string;
  title: string;
  type: 'text' | 'date' | 'boolean' | 'url' | 'badge';
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  totalCount: number;
  state: TableState;
  onStateChange: (state: TableState) => void;
  onExport?: () => void;
  emptyMessage?: string;
}

export function DataTable({
  columns,
  data,
  loading = false,
  totalCount,
  state,
  onStateChange,
  onExport,
  emptyMessage = "No data found"
}: DataTableProps) {
  const [showFilters, setShowFilters] = useState(false);

  const visibleColumns = useMemo(() => {
    return columns
      .filter(col => {
        const colState = state.columns.find(c => c.id === col.id);
        return colState?.visible !== false;
      })
      .sort((a, b) => {
        const aState = state.columns.find(c => c.id === a.id);
        const bState = state.columns.find(c => c.id === b.id);
        return (aState?.order || 0) - (bState?.order || 0);
      });
  }, [columns, state.columns]);

  const handleSort = (columnId: string) => {
    const existingSort = state.sort.find(s => s.id === columnId);
    let newSort: TableSort[];
    
    if (existingSort) {
      if (existingSort.desc) {
        newSort = state.sort.filter(s => s.id !== columnId);
      } else {
        newSort = state.sort.map(s => 
          s.id === columnId ? { ...s, desc: true } : s
        );
      }
    } else {
      newSort = [{ id: columnId, desc: false }, ...state.sort];
    }
    
    onStateChange({ ...state, sort: newSort });
  };

  const handleGlobalSearch = (search: string) => {
    onStateChange({ ...state, globalSearch: search, page: 1 });
  };

  const handlePageChange = (page: number) => {
    onStateChange({ ...state, page });
  };

  const handlePageSizeChange = (pageSize: number) => {
    onStateChange({ ...state, pageSize, page: 1 });
  };

  const toggleColumnVisibility = (columnId: string) => {
    const newColumns = state.columns.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    );
    onStateChange({ ...state, columns: newColumns });
  };

  const renderCell = (column: Column, value: any, row: any) => {
    if (column.render) {
      return column.render(value, row);
    }

    switch (column.type) {
      case 'boolean':
        return (
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? 'Yes' : 'No'}
          </Badge>
        );
      case 'url':
        return value ? (
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Link
          </a>
        ) : null;
      case 'date':
        return value ? new Date(value).toLocaleDateString() : null;
      case 'badge':
        return value ? <Badge>{value}</Badge> : null;
      default:
        return value;
    }
  };

  const getSortIcon = (columnId: string) => {
    const sort = state.sort.find(s => s.id === columnId);
    if (!sort) return <ArrowUpDown className="h-4 w-4" />;
    return sort.desc ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />;
  };

  const totalPages = Math.ceil(totalCount / state.pageSize);
  const startRow = (state.page - 1) * state.pageSize + 1;
  const endRow = Math.min(state.page * state.pageSize, totalCount);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Table</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map(column => {
                  const colState = state.columns.find(c => c.id === column.id);
                  const isVisible = colState?.visible !== false;
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={isVisible}
                      onCheckedChange={() => toggleColumnVisibility(column.id)}
                    >
                      {column.title}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={state.globalSearch}
              onChange={(e) => handleGlobalSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select
            value={state.pageSize.toString()}
            onValueChange={(value) => handlePageSizeChange(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 rows</SelectItem>
              <SelectItem value="25">25 rows</SelectItem>
              <SelectItem value="50">50 rows</SelectItem>
              <SelectItem value="100">100 rows</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map(column => (
                  <TableHead 
                    key={column.id}
                    className={column.sortable ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={column.sortable ? () => handleSort(column.id) : undefined}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center gap-2">
                      {column.title}
                      {column.sortable && getSortIcon(column.id)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={row.id || index}>
                    {visibleColumns.map(column => (
                      <TableCell key={column.id}>
                        {renderCell(column, row[column.id], row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalCount > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startRow} to {endRow} of {totalCount} results
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(state.page - 1)}
                disabled={state.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (state.page <= 3) {
                    pageNum = i + 1;
                  } else if (state.page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = state.page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === state.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(state.page + 1)}
                disabled={state.page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}