// hooks/useAssetForm.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Neu: Custom Hook zur Verwaltung des Zustands der Asset-Eingabemaske

import { useState, useCallback } from 'react';
import { AppConstants } from '../constants/AppConstants';

export function useAssetForm() {
  const [rows, setRows] = useState([]);

  const addRow = useCallback((providerOverride = null) => {
    const newRow = {
      id: Date.now() + Math.random(),
      provider: providerOverride || AppConstants.PROVIDERS[0],
      value: '',
      timestamp: Date.now(),
      status: 'manual',
      isConfirmed: false,
      imageUri: null
    };
    setRows(prev => [...prev, newRow]);
  }, []);

  const removeRow = useCallback((id) => {
    setRows(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : prev));
  }, []);

  const updateRow = useCallback((id, fields) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...fields } : r));
  }, []);

  return {
    rows,
    addRow,
    removeRow,
    updateRow,
    setRows
  };
}