// App.js
// Regel 0: Absolute Transparenz
// Regel 6: Vollständiger Dateiinhalt
// Refactoring: Ionicons integriert, Menü-Struktur für Verlauf erweitert

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SQLite from 'expo-sqlite';
import { Ionicons } from '@expo/vector-icons'; // Neu: Ionicons importieren
import { Theme } from './components/Theme';
import { Security } from './components/Security';
import { Config } from './constants/Config';
import { AppConstants } from './constants/AppConstants';
import AddAssetModal from './components/AddAssetModal';
import SettingsModal from './components/SettingsModal';
import MenuModal from './components/MenuModal'; // Neu: Menü Auswahl
import HistoryModal from './components/HistoryModal'; // Neu: Verlauf Dummy
import Chart from './components/Chart';

function MainContent() {
  const insets = useSafeAreaInsets();
  const [db, setDb] = useState(null);
  const [isReady, setIsReady] = useState(false);
  
  const [totalValue, setTotalValue] = useState(0);
  const [performance, setPerformance] = useState({ nominal: 0, percent: 0 });
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [portfolios, setPortfolios] = useState([]);
  const [chartData, setChartData] = useState([]);
  
  // Modals Visibility State
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false); // Neu
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [isHistoryVisible, setHistoryVisible] = useState(false); // Neu

  useEffect(() => {
    async function initApp() {
      try {
        await Security.getOrCreateMasterKey();
        const database = await SQLite.openDatabaseAsync(Config.DATABASE.NAME);
        setDb(database);
        
        await database.execAsync(`
          CREATE TABLE IF NOT EXISTS snapshots (
            provider TEXT PRIMARY KEY, 
            value REAL, 
            timestamp INTEGER
          );
          CREATE TABLE IF NOT EXISTS ${Config.DATABASE.TABLE_HISTORY} (
            timestamp INTEGER PRIMARY KEY, 
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
      const currentSnapshots = await db.getAllAsync("SELECT provider, value FROM snapshots ORDER BY provider ASC;");
      const currentTotal = currentSnapshots.reduce((sum, s) => sum + s.value, 0);
      setTotalValue(currentTotal);
      setPortfolios(currentSnapshots);

      let timeLimit = 0;
      const now = new Date();
      if (activeFilter === '3M') {
        now.setMonth(now.getMonth() - 3);
        timeLimit = now.getTime();
      } else if (activeFilter === '6M') {
        now.setMonth(now.getMonth() - 6);
        timeLimit = now.getTime();
      } else if (activeFilter === '1Y') {
        now.setFullYear(now.getFullYear() - 1);
        timeLimit = now.getTime();
      }

      const historyResult = await db.getAllAsync(
        `SELECT timestamp, total_value as value FROM ${Config.DATABASE.TABLE_HISTORY} WHERE timestamp >= ? ORDER BY timestamp ASC;`,
        [timeLimit]
      );
      setChartData(historyResult);

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
    const now = Date.now();
    try {
      await db.runAsync(
        "INSERT OR REPLACE INTO snapshots (provider, value, timestamp) VALUES (?, ?, ?);",
        [provider, value, now]
      );
      const result = await db.getFirstAsync("SELECT SUM(value) as total FROM snapshots;");
      const newTotal = result?.total || 0;
      await db.runAsync(
        `INSERT INTO ${Config.DATABASE.TABLE_HISTORY} (timestamp, total_value) VALUES (?, ?);`,
        [now, newTotal]
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
        {/* Neues Menü-Icon (Ionicon statt Emoji) */}
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="menu-outline" size={28} color={Theme.colors.text} />
        </TouchableOpacity>

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
            {AppConstants.CHART.FILTERS.map(f => (
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

      {/* FAB mit Ionicon statt Emoji + */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Ionicons name="add" size={32} color={Theme.colors.white} />
      </TouchableOpacity>

      {/* Modals Management */}
      <AddAssetModal visible={isAddModalVisible} onClose={() => setAddModalVisible(false)} onSave={handleSaveAsset} />
      
      <MenuModal 
        visible={isMenuVisible} 
        onClose={() => setMenuVisible(false)} 
        onOpenSettings={() => setSettingsVisible(true)}
        onOpenHistory={() => setHistoryVisible(true)}
      />
      
      <SettingsModal visible={isSettingsVisible} onClose={() => setSettingsVisible(false)} />
      <HistoryModal visible={isHistoryVisible} onClose={() => setHistoryVisible(false)} />
    </View>
  );
}

export default function App() { return (<SafeAreaProvider><MainContent /></SafeAreaProvider>); }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: Theme.spacing.l, backgroundColor: Theme.colors.surface, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Theme.colors.border, position: 'relative' },
  menuButton: { position: 'absolute', right: 15, top: Platform.OS === 'ios' ? 10 : 15, padding: 10, zIndex: 10 },
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
});