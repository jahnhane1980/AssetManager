// hooks/usePortfolioData.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Kapselung der Datenbeschaffung unter Nutzung der FinanceUtils
// Update: Lädt nun auch alle Rohdaten (allAssets) für die Provider-Diagramme

import { useState, useCallback, useEffect } from 'react';
import AssetRepository from '../repositories/AssetRepository';
import { FinanceUtils } from '../utils/FinanceUtils';

export function usePortfolioData(isReady, currentTimeLimit) {
  const [state, setState] = useState({
    totalValue: 0,
    performance: { nominal: 0, percent: 0 },
    portfolios: [],
    chartData: [],
    allAssets: [], // Neu: Speichert alle Roh-Einträge
    aggregation: 'DAILY',
    isLoading: false
  });

  const refresh = useCallback(async () => {
    if (!isReady) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // 1. Daten aus Repository laden
      const snapshots = await AssetRepository.getAllSnapshots();
      const total = snapshots.reduce((sum, s) => sum + s.value, 0);

      // 2. Logik über Utilities bestimmen
      const agg = FinanceUtils.determineAggregation(currentTimeLimit);
      const history = await AssetRepository.getHistory(currentTimeLimit, 1000, 0, 'ASC', agg);
      
      // 3. Rohdaten für Provider-Charts laden (Neu)
      const rawAssets = await AssetRepository.getAllAssets();
      
      // 4. Performance berechnen
      const firstVal = history.length > 0 ? history[0].value : 0;
      const perf = FinanceUtils.calculatePerformance(total, firstVal);

      setState({
        totalValue: total,
        performance: perf,
        portfolios: snapshots,
        chartData: history,
        allAssets: rawAssets, // Neu
        aggregation: agg,
        isLoading: false
      });
    } catch (error) {
      console.error("Hook-Fehler:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [isReady, currentTimeLimit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
