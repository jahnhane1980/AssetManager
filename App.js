// App.js
// Regel 0: Absolute Transparenz | Regel 6: Vollständiger Dateiinhalt
// Refactoring: Nutzung des Custom Hooks usePortfolioData

import React, { useState, useEffect } from 'react';
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

// Importiere den neuen Hook (Pfad anpassen falls nötig)
import { usePortfolioData } from './hooks/usePortfolioData';

function MainContent() {
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = useState(false);
  const [currentTimeLimit, setCurrentTimeLimit] = useState(0);
  
  // Custom Hook nutzt den lokalen State (isReady, timeLimit)
  const { 
    totalValue, 
    performance, 
    portfolios, 
    chartData, 
    aggregation, 
    refresh 
  } = usePortfolioData(isReady, currentTimeLimit);
  
  // Modal Visibility State
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

  const handleSaveAsset = async (provider, value, timestamp) => {
    try {
      await AssetRepository.saveAsset(provider, value, timestamp);
      await refresh(); // Hook-Refresh triggern
    } catch (error) {
      console.error("Speicherfehler:", error);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      await AssetRepository.clearAllData();
      setDeleteModalVisible(false);
      await refresh();
    } catch (error) {
      console.error("Fehler beim Löschen:", error);
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
          aggregation={aggregation}
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