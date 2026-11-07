import { useCallback, useEffect, useState } from 'react';
import { dashboardService } from './dashboardService';
import { initialDashboardState, type DashboardState } from './types';

export function useDashboard() {
  const [data, setData] = useState<DashboardState>(initialDashboardState);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      setData(dashboardService.load());
      setLoaded(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os dados locais.');
    }
  }, []);

  useEffect(() => {
    if (!loaded || error) return;
    try {
      dashboardService.save(data);
    } catch {
      setError('Não foi possível salvar. O armazenamento do navegador pode estar cheio ou indisponível.');
    }
  }, [data, error, loaded]);

  const update = useCallback((updater: (current: DashboardState) => DashboardState) => {
    setData(updater);
  }, []);

  const reset = useCallback(() => {
    try {
      dashboardService.clear();
      setData(initialDashboardState);
      setError('');
      setLoaded(true);
    } catch {
      setError('Não foi possível redefinir os dados locais.');
    }
  }, []);

  return { data, update, loaded, error, reset };
}
