// App.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Einbindung des globalen Notification-Systems

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from './components/Theme';
import { Security } from './components/Security';
import AssetRepository from './repositories/AssetRepository';
import TotalValueHeader from './components/TotalValueHeader';
import PortfolioList from './components/PortfolioList';
import AddAssetButton from './components/AddAssetButton';
import AddAssetModal from './components/AddAssetModal';
import SettingsModal from './components/SettingsModal';
import MenuModal from './components/MenuModal';
import HistoryModal from './components/HistoryModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import BackupModal from './components/BackupModal';
import Notification from './components/Notification'; // Neu
import LogService from './services/LogService';

import { usePortfolioData } from './hooks/usePortfolioData';

function MainContent() {
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = useState(false);
  const [currentTimeLimit, setCurrentTimeLimit] = useState(0);
  const [activeNotification, setActiveNotification] = useState(null); // State für Toasts
  
  const { 
    totalValue, 
    performance, 
    portfolios, 
    chartData, 
    aggregation, 
    refresh 
  } = usePortfolioData(isReady, currentTimeLimit);
  
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [isHistoryVisible, setHistoryVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isBackupVisible, setBackupVisible] = useState(false);

  useEffect(() => {
    // Registrierung der globalen Notify-Funktion
    global.notify = (message, type = 'info') => setActiveNotification({ message, type });

    async function initApp() {
      try {
        global.log = (msg, type) => LogService.log(msg, type);
        await LogService.init();
        global.log("Initialisierung der System-Komponenten gestartet...");

        await Security.getOrCreateMasterKey();
        await AssetRepository.initialize();
        
        setIsReady(true);
        global.log("App erfolgreich bereitgestellt.", "SUCCESS");
      } catch (error) {
        console.error("Initialisierungsfehler:", error);
        if (global.log) global.log(`Schwerer Fehler beim Start: ${error.message}`, "ERROR");
      }
    }
    initApp();
  }, []);

  const handleSaveAsset = async (provider, value, timestamp) => {
    try {
      await AssetRepository.saveAsset(provider, value, timestamp);
      global.log(`Asset gespeichert: ${provider} - ${value}€`);
      global.notify(`${provider}: Wert erfolgreich gespeichert`, 'success');
      await refresh(); 
    } catch (error) {
      global.log(`Speicherfehler (${provider}): ${error.message}`, "ERROR");
      global.notify("Fehler beim Speichern", "error");
    }
  };

  const handleDeleteAllData = async () => {
    try {
      await AssetRepository.clearAllData();
      global.log("Vollständiger Daten-Reset durch den Nutzer.", "WARN");
      global.notify("Alle Daten wurden gelöscht", "success");
      setDeleteModalVisible(false);
      await refresh();
    } catch (error) {
      global.log(`Fehler beim Löschen der Daten: ${error.message}`, "ERROR");
      global.notify("Fehler beim Löschen", "error");
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
      <Notification 
        notification={activeNotification} 
        onHide={() => setActiveNotification(null)} 
      />

      <TotalValueHeader 
        totalValue={totalValue} 
        performance={performance} 
        onMenuPress={() => setMenuVisible(true)} 
      />

      <View style={styles.content}>
        <PortfolioList 
          portfolios={portfolios}
          chartData={chartData}
          aggregation={aggregation}
          onFilterChange={(limit) => setCurrentTimeLimit(limit)}
        />
      </View>

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
        onOpenBackup={() => setBackupVisible(true)}
      />
      
      <SettingsModal visible={isSettingsVisible} onClose={() => setSettingsVisible(false)} />
      <HistoryModal visible={isHistoryVisible} onClose={() => setHistoryVisible(false)} />
      
      <DeleteConfirmationModal 
        visible={isDeleteModalVisible} 
        onClose={() => setDeleteModalVisible(false)} 
        onConfirm={handleDeleteAllData}
      />

      <BackupModal 
        visible={isBackupVisible} 
        onClose={() => setBackupVisible(false)} 
        onRestoreSuccess={refresh}
      />
    </View>
  );
}

export default function App() { return (<SafeAreaProvider><MainContent /></SafeAreaProvider>); }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
});