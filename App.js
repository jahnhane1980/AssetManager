// App.js
// Regel 0: Absolute Transparenz
// Regel 6: Vollständiger Dateiinhalt
// Refactoring: Anpassung der Speicherlogik für Batch-Eingaben und Zeitstempel

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from './components/Theme';
import { Security } from './components/Security';
import AssetRepository from './repositories/AssetRepository';
import TotalValueHeader from './components/TotalValueHeader';
import Chart from './components/Chart';
import PortfolioList from './components/PortfolioList';
import AddAssetButton from './components/AddAssetButton';
import AddAssetModal from './components/AddAssetModal';
import SettingsModal from './components/SettingsModal';
import MenuModal from './components/MenuModal';
import HistoryModal from './components/HistoryModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

function MainContent() {
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = useState(false);
  
  // State Management
  const [totalValue, setTotalValue] = useState(0);
  const [performance, setPerformance] = useState({ nominal: 0, percent: 0 });
  const [portfolios, setPortfolios] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [currentTimeLimit, setCurrentTimeLimit] = useState(0);
  
  // Modal Visibility
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [isHistoryVisible, setHistoryVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    async function initApp() {
      try {
        await Security.getOrCreateMasterKey();
        await AssetRepository.initialize();
        setIsReady(true);
      } catch (error) {
        console.error("Initialisierungsfehler:", error);
      }
    }
    initApp();
  }, []);

  const refreshData = useCallback(async () => {
    if (!isReady) return;

    try {
      // Holt die aktuellen Snapshots über die neue VIEW
      const currentSnapshots = await AssetRepository.getAllSnapshots();
      const currentTotal = currentSnapshots.reduce((sum, s) => sum + s.value, 0);
      
      setTotalValue(currentTotal);
      setPortfolios(currentSnapshots);

      // Holt die Historie aus der neuen Aggregat-Tabelle
      const historyResult = await AssetRepository.getHistory(currentTimeLimit);
      setChartData(historyResult);

      if (historyResult.length >= 1) {
        const first = historyResult[0].value;
        setPerformance({ 
          nominal: currentTotal - first, 
          percent: first !== 0 ? ((currentTotal - first) / first) * 100 : 0 
        });
      } else {
        setPerformance({ nominal: 0, percent: 0 });
      }
    } catch (error) {
      console.error("Fehler beim Laden:", error);
    }
  }, [isReady, currentTimeLimit]);

  useEffect(() => { refreshData(); }, [refreshData]);

  /**
   * Erweitert um den optionalen Zeitstempel für historische Einträge.
   */
  const handleSaveAsset = async (provider, value, timestamp) => {
    try {
      await AssetRepository.saveAsset(provider, value, timestamp);
      await refreshData();
    } catch (error) {
      console.error("Speicherfehler:", error);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      // Der Full-Reset droppt nun alle Tabellen/Views und baut sie neu auf
      await AssetRepository.clearAllData();
      setDeleteModalVisible(false);
      await refreshData();
    } catch (error) {
      console.error("Fehler beim Löschen der Daten:", error);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TotalValueHeader 
        totalValue={totalValue} 
        performance={performance} 
        onMenuPress={() => setMenuVisible(true)} 
      />

      <ScrollView style={styles.content}>
        <Chart 
          data={chartData} 
          onFilterChange={(limit) => setCurrentTimeLimit(limit)} 
        />
        <PortfolioList portfolios={portfolios} />
      </ScrollView>

      <AddAssetButton onPress={() => setAddModalVisible(true)} />

      <AddAssetModal 
        visible={isAddModalVisible} 
        onClose={() => setAddModalVisible(false)} 
        onSave={handleSaveAsset} 
      />
      
      <MenuModal 
        visible={isMenuVisible} 
        onClose={() => setMenuVisible(false)} 
        onOpenSettings={() => setSettingsVisible(true)}
        onOpenHistory={() => setHistoryVisible(true)}
        onOpenDeleteConfirm={() => setDeleteModalVisible(true)}
      />
      
      <SettingsModal visible={isSettingsVisible} onClose={() => setSettingsVisible(false)} />
      <HistoryModal visible={isHistoryVisible} onClose={() => setHistoryVisible(false)} />
      
      <DeleteConfirmationModal 
        visible={isDeleteModalVisible} 
        onClose={() => setDeleteModalVisible(false)} 
        onConfirm={handleDeleteAllData}
      />
    </View>
  );
}

export default function App() { return (<SafeAreaProvider><MainContent /></SafeAreaProvider>); }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: Theme.spacing.m },
});