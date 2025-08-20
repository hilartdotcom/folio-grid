import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types';

export function useRecentContacts(limit: number = 10) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecentContacts = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('contacts')
          .select(`
            *,
            license:licenses(license_number, license_type),
            company:companies!contacts_license_number_fkey(name)
          `)
          .is('deleted_at', null)
          .order('contact_last_updated', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(limit);

        if (queryError) throw queryError;

        setContacts(data as unknown as Contact[] || []);
      } catch (err) {
        console.error('Error fetching recent contacts:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentContacts();
  }, [limit]);

  return { contacts, loading, error };
}