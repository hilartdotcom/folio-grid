import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { KPIData } from '@/types';

export function useKPIData() {
  const [data, setData] = useState<KPIData>({
    totalLicenses: 0,
    totalCompanies: 0,
    totalContacts: 0,
    totalStates: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKPIData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [licensesResult, companiesResult, contactsResult, statesResult] = await Promise.all([
          supabase
            .from('licenses')
            .select('id', { count: 'exact', head: true })
            .is('deleted_at', null),
          supabase
            .from('companies')
            .select('id', { count: 'exact', head: true })
            .is('deleted_at', null),
          supabase
            .from('contacts')
            .select('id', { count: 'exact', head: true })
            .is('deleted_at', null),
          supabase
            .from('licenses')
            .select('state')
            .is('deleted_at', null)
            .not('state', 'is', null)
        ]);

        // Count distinct states
        const uniqueStates = new Set(statesResult.data?.map(item => item.state));

        setData({
          totalLicenses: licensesResult.count || 0,
          totalCompanies: companiesResult.count || 0,
          totalContacts: contactsResult.count || 0,
          totalStates: uniqueStates.size
        });
      } catch (err) {
        console.error('Error fetching KPI data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchKPIData();
  }, []);

  return { data, loading, error };
}