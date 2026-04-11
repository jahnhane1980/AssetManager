// Chart.js (Main Application Logic)
// Regel 0: Absolute Transparenz - Snapshot-Logik & Daily History
// Regel 6: Vollständiger Dateiinhalt

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { Theme } from './Theme';
import { Security } from './Security';
import AddAssetModal from './AddAssetModal';
import Chart from './Chart';

function MainContent() {
  const insets = useSafeAreaInsets();
  const [db, setDb] = useState(null);
  const [isReady, setIsReady] = useState(false);
  
  const [totalValue, setTotalValue] = useState(0);
  const [performance, setPerformance] = useState({ nominal: 0, percent: 0 });
  const [isModalVisible, setModalVisible] = useState(false);
  const [portfolios, setPortfolios] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    async function initApp() {
      try {
        await Security.getOrCreateMasterKey();
        const database = await SQLite.openDatabaseAsync('assets.db');
        setDb(database);
        
        // Regel: Provider ist Primary Key -> Überschreibt alten Stand automatisch
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS snapshots (
            provider TEXT PRIMARY KEY, 
            value REAL, 
            timestamp INTEGER
          );
          CREATE TABLE IF NOT EXISTS daily_history (
            date TEXT PRIMARY KEY, 
            total_value REAL
          );
        `);
        
        setIsReady(true);
      } catch (error) {
        console.error("Initialisierungsfehler:", error);
      }
    }
    initApp();
  }, []);

  const refreshData = useCallback(async () => {
    if (!db || !isReady) return;

    try {
      // 1. Aktuelle Portfolioliste (Snapshot)
      const currentSnapshots = await db.getAllAsync("SELECT provider, value FROM snapshots ORDER BY provider ASC;");
      const currentTotal = currentSnapshots.reduce((sum, s) => sum + s.value, 0);
      setTotalValue(currentTotal);
      setPortfolios(currentSnapshots);

      // 2. Historische Daten für den Chart laden
      let dateLimit = '0000-00-00';
      const now = new Date();
      if (activeFilter === '3M') {
        now.setMonth(now.getMonth() - 3);
        dateLimit = now.toISOString().split('T')[0];
      } else if (activeFilter === '6M') {
        now.setMonth(now.getMonth() - 6);
        dateLimit = now.toISOString().split('T')[0];
      } else if (activeFilter === '1Y') {
        now.setFullYear(now.getFullYear() - 1);
        dateLimit = now.toISOString().split('T')[0];
      }

      const historyResult = await db.getAllAsync(
        "SELECT date, total_value as value FROM daily_history WHERE date >= ? ORDER BY date ASC;",
        [dateLimit]
      );
      setChartData(historyResult);

      // 3. Performance Berechnung (Erster Punkt im Zeitraum vs. Heute)
      if (historyResult.length >= 1) {
        const first = historyResult[0].value;
        setPerformance({ 
          nominal: currentTotal - first, 
          percent: first !== 0 ? ((currentTotal - first) / first) * 100 : 0 
        });
      }
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    }
  }, [db, isReady, activeFilter]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const handleSaveAsset = async (provider, value) => {
    if (!db) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    try {
      // Schritt A: Snapshot des Providers aktualisieren (überschreibt alten Wert)
      await db.runAsync(
        "INSERT OR REPLACE INTO snapshots (provider, value, timestamp) VALUES (?, ?, ?);",
        [provider, value, Date.now()]
      );

      // Schritt B: Neue Gesamtsumme aller aktuellen Snapshots berechnen
      const result = await db.getFirstAsync("SELECT SUM(value) as total FROM snapshots;");
      const newTotal = result?.total || 0;

      // Schritt C: Gesamtsumme für HEUTE in der Historie festhalten
      await db.runAsync(
        "INSERT OR REPLACE INTO daily_history (date, total_value) VALUES (?, ?);",
        [todayStr, newTotal]
      );

      await refreshData();
    } catch (error) {
      console.error("Speicherfehler:", error);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Daten werden geladen...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Gesamtvermögen</Text>
        <Text style={styles.amount}>
          {totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
        </Text>
        <Text style={[styles.perfText, { color: performance.nominal >= 0 ? '#4CD964' : '#FF3B30' }]}>
          {performance.nominal >= 0 ? '+' : ''}
          {performance.nominal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} ({performance.percent.toFixed(2)}%)
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.chartContainer}>
          <Chart data={chartData} />
          <View style={styles.filterRow}>
            {['3M', '6M', '1Y', 'ALL'].map(f => (
              <TouchableOpacity key={f} onPress={() => setActiveFilter(f)} style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}>
                <Text style={[styles.filterBtnText, activeFilter === f && styles.filterBtnTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <Text style={styles.subTitle}>Deine Portfolios</Text>
        {portfolios.map((p, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.providerName}>{p.provider}</Text>
              <Text style={styles.providerValue}>{p.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <AddAssetModal visible={isModalVisible} onClose={() => setModalVisible(false)} onSave={handleSaveAsset} />
    </View>
  );
}

export default function App() { return (<SafeAreaProvider><MainContent /></SafeAreaProvider>); }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: Theme.spacing.l, backgroundColor: Theme.colors.surface, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  title: { fontSize: 14, color: Theme.colors.textSecondary },
  amount: { fontSize: 32, fontWeight: 'bold', color: Theme.colors.text },
  perfText: { fontSize: 16, fontWeight: '600', marginTop: 5 },
  content: { flex: 1, padding: Theme.spacing.m },
  chartContainer: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.l, paddingVertical: Theme.spacing.m, marginBottom: Theme.spacing.l, elevation: 2 },
  filterRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  filterBtnActive: { backgroundColor: Theme.colors.primary },
  filterBtnText: { color: Theme.colors.textSecondary, fontWeight: '600' },
  filterBtnTextActive: { color: Theme.colors.white },
  subTitle: { fontSize: 18, fontWeight: '600', marginBottom: Theme.spacing.s, color: Theme.colors.text },
  card: { backgroundColor: Theme.colors.surface, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, marginBottom: Theme.spacing.s, elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  providerName: { fontSize: 16, fontWeight: '500' },
  providerValue: { fontSize: 16, fontWeight: 'bold' },
  fab: { position: 'absolute', right: 25, bottom: 25, backgroundColor: Theme.colors.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabIcon: { color: Theme.colors.white, fontSize: 30 },
});