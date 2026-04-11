
// App.js
// Regel 0: Absolute Transparenz - Integration des Security-Checks
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
  const [masterKey, setMasterKey] = useState(null);
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
        // 1. Master-Key sicher laden/erzeugen
        const key = await Security.getOrCreateMasterKey();
        setMasterKey(key);

        // 2. Datenbank öffnen
        const database = await SQLite.openDatabaseAsync('assets.db');
        setDb(database);
        
        await database.execAsync(
          "CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT, value REAL, is_manual INTEGER, timestamp INTEGER);"
        );
        
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
      const totalResult = await db.getAllAsync(
        "SELECT SUM(value) as total FROM (SELECT value FROM snapshots GROUP BY provider ORDER BY timestamp DESC);"
      );
      setTotalValue(totalResult[0]?.total || 0);

      let timeLimit = 0;
      const now = Date.now();
      if (activeFilter === '3M') timeLimit = now - 90 * 24 * 60 * 60 * 1000;
      else if (activeFilter === '6M') timeLimit = now - 180 * 24 * 60 * 60 * 1000;
      else if (activeFilter === '1Y') timeLimit = now - 365 * 24 * 60 * 60 * 1000;

      const historyResult = await db.getAllAsync(
        "SELECT timestamp, SUM(value) as value FROM snapshots WHERE timestamp > ? GROUP BY timestamp ORDER BY timestamp ASC;",
        [timeLimit]
      );
      setChartData(historyResult);

      if (historyResult.length >= 2) {
        const first = historyResult[0].value;
        const last = historyResult[historyResult.length - 1].value;
        setPerformance({ nominal: last - first, percent: ((last - first) / first) * 100 });
      }

      const portfolioResult = await db.getAllAsync(
        "SELECT provider, value FROM snapshots GROUP BY provider ORDER BY timestamp DESC;"
      );
      setPortfolios(portfolioResult);
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    }
  }, [db, isReady, activeFilter]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const handleSaveAsset = async (provider, value, isManual) => {
    if (!db) return;
    // Hier könnte Security.encryptValue(value, masterKey) genutzt werden
    await db.runAsync(
      "INSERT INTO snapshots (provider, value, is_manual, timestamp) VALUES (?, ?, ?, ?);",
      [provider, value, isManual ? 1 : 0, Date.now()]
    );
    await refreshData();
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
        <Text style={{ marginTop: 10 }}>Sicherer Start...</Text>
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
