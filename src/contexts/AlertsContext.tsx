import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface AlertRow {
  id: string;
  user_id: string;
  msg: string;
  title: string;
  type: string;
  resolved: boolean;
  created_at: string;
  action?: string | null;
  crop?: string | null;
  zone?: string | null;
}

interface Alert {
  id: string;
  user_id: string;
  message: string;
  type: 'warning' | 'high' | 'danger';
  resolved: boolean;
  created_at: string;
}

interface AlertsContextType {
  unreadCount: number;
  alerts: Alert[];
  markResolved: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  loading: boolean;
}

const AlertsContext = createContext<AlertsContextType | null>(null);

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) throw new Error('useAlerts must be used within AlertsProvider');
  return context;
};

export const AlertsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load alerts');
    } else {
      const mappedAlerts: Alert[] = (data || []).map((row: AlertRow) => ({
        id: row.id,
        user_id: row.user_id,
        message: row.msg || 'No message',
        type: (row.type || 'warning') as 'warning' | 'high' | 'danger',
        resolved: row.resolved,
        created_at: row.created_at
      }));
      setAlerts(mappedAlerts);
      setUnreadCount(mappedAlerts.filter(a => !a.resolved).length || 0);
    }
    setLoading(false);
  }, [user]);



  const markResolved = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('user_alerts')
      .update({ resolved: true })
      .eq('id', id);
    if (error) toast.error('Failed to mark as resolved');
    else await fetchAlerts();
  }, [fetchAlerts]);

  const clearAll = useCallback(async () => {
    const { error } = await supabase
      .from('user_alerts')
      .update({ resolved: true })
      .eq('user_id', user?.id);
    if (error) toast.error('Failed to clear alerts');
    else await fetchAlerts();
  }, [fetchAlerts, user]);

  useEffect(() => {
    if (!user) {
      setAlerts([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    fetchAlerts();

    const channel = supabase.channel(`user_alerts:${user.id}`);
    channel
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_alerts', filter: `user_id=eq.${user.id}` },
        () => fetchAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAlerts]);

  return (
    <AlertsContext.Provider value={{ unreadCount, alerts, markResolved, clearAll, loading }}>
      {children}
    </AlertsContext.Provider>
  );
};

