// App.js
// Regel 0: Absolute Transparenz
// Regel 6: Vollständiger Dateiinhalt
// Refactoring: Automatische Zeitreihen-Aggregation für den Chart

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
  const [currentAggregation, setCurrentAggregation] = useState('DAILY');
  
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
      const currentSnapshots = await AssetRepository.getAllSnapshots();
      const currentTotal = currentSnapshots.reduce((sum, s) => sum + s.value, 0);
      
      setTotalValue(currentTotal);
      setPortfolios(currentSnapshots);

      // --- Aggregations-Logik basierend auf Zeitbereich ---
      let agg = 'DAILY';
      const now = Date.now();
      const diffDays = (now - currentTimeLimit) / (1000 * 60 * 60 * 24);

      if (currentTimeLimit === 0 || diffDays > 300) {
        agg = 'MONTHLY'; // Für 'ALL' oder Zeiträume > 10 Monate
      } else if (diffDays > 100) {
        agg = 'WEEKLY';  // Für Zeiträume > 3 Monate
      } else {
        agg = 'DAILY';   // Bis zu 3 Monate
      }
      
      setCurrentAggregation(agg);

      const historyResult = await AssetRepository.getHistory(currentTimeLimit, 1000, 0, 'ASC', agg);
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
          aggregation={currentAggregation}
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