import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseTableDataOptions {
  tableName: 'licenses' | 'companies' | 'contacts';
}

export function useTableData({ tableName }: UseTableDataOptions) {
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .is('deleted_at', null);

      // Apply search if there's a search term
      if (searchTerm) {
        const search = `%${searchTerm}%`;
        if (tableName === 'licenses') {
          query = query.or(`license_number.ilike.${search},license_type.ilike.${search},full_address.ilike.${search}`);
        } else if (tableName === 'companies') {
          query = query.or(`name.ilike.${search},dba.ilike.${search}`);
        } else if (tableName === 'contacts') {
          query = query.or(`first_name.ilike.${search},last_name.ilike.${search},email.ilike.${search}`);
        }
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data: resultData, count, error: queryError } = await query;

      if (queryError) throw queryError;

      setData(resultData || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName, searchTerm, currentPage, pageSize]);

  return {
    data,
    totalCount,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    refetch: fetchData
  };
}