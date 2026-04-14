// App.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Einbau von SettingsScreen und HistoryScreen in den Navigation Stack

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Theme } from './components/Theme';
import { Security } from './components/Security';
import AssetRepository from './repositories/AssetRepository';
import TotalValueHeader from './components/TotalValueHeader';
import PortfolioList from './components/PortfolioList';
import AddAssetButton from './components/AddAssetButton';
import AddAssetModal from './components/AddAssetModal';
import MenuModal from './components/MenuModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import BackupModal from './components/BackupModal';
import Notification from './components/Notification';
import LogService from './services/LogService';

// Neue Screens importieren
import SettingsScreen from './components/SettingsScreen';
import HistoryScreen from './components/HistoryScreen';

import { usePortfolioData } from './hooks/usePortfolioData';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = useState(false);
  const [currentTimeLimit, setCurrentTimeLimit] = useState(0);
  const [activeNotification, setActiveNotification] = useState(null);
  
  const { 
    totalValue, 
    performance, 
    portfolios, 
    chartData, 
    aggregation, 
    refresh 
  } = usePortfolioData(isReady, currentTimeLimit);
  
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [selectedInitialProvider, setSelectedInitialProvider] = useState(null);
  const [isMenuVisible, setMenuVisible] = useState(false);
  
  // Settings & History State entfernt, da diese nun über die Navigation laufen
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isBackupVisible, setBackupVisible] = useState(false);

  useEffect(() => {
    global.notify = (message, type = 'info') => setActiveNotification({ message, type });

    async function initApp() {
      try {
        global.log = (msg, type) => LogService.log(msg, type);
        await LogService.init();
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
      global.notify(`${provider}: Wert gespeichert`, 'success');
      await refresh(); 
    } catch (error) {
      global.notify("Fehler beim Speichern", "error");
    }
  };

  const handleDeleteAllData = async () => {
    try {
      await AssetRepository.clearAllData();
      global.notify("Daten gelöscht", "success");
      setDeleteModalVisible(false);
      await refresh();
    } catch (error) {
      global.notify("Fehler beim Löschen", "error");
    }
  };

  const handleOpenAddModal = (provider = null) => {
    setSelectedInitialProvider(provider);
    setAddModalVisible(true);
  };

  const handleOpenMenu = () => {
    setMenuVisible(true);
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.mainLayer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <TotalValueHeader 
          totalValue={totalValue} 
          performance={performance} 
          onMenuPress={handleOpenMenu} 
        />
        <View style={styles.content}>
          <PortfolioList 
            portfolios={portfolios}
            chartData={chartData}
            aggregation={aggregation}
            onFilterChange={(limit) => setCurrentTimeLimit(limit)}
            onProviderPress={(p) => handleOpenAddModal(p)}
          />
        </View>
        <View style={styles.buttonLayer}>
          <AddAssetButton onPress={() => handleOpenAddModal(null)} />
        </View>
      </View>

      <AddAssetModal 
        visible={isAddModalVisible} 
        initialProvider={selectedInitialProvider}
        onClose={() => setAddModalVisible(false)} 
        onSave={handleSaveAsset} 
      />
      
      <MenuModal 
        visible={isMenuVisible} 
        onClose={() => setMenuVisible(false)} 
        // Hier leiten wir den Menüklick direkt auf den Navigation-Stack um
        onOpenSettings={() => navigation.navigate('Settings')}
        onOpenHistory={() => navigation.navigate('History')}
        onOpenDeleteConfirm={() => setDeleteModalVisible(true)}
        onOpenBackup={() => setBackupVisible(true)}
      />
      
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

      <Notification 
        notification={activeNotification} 
        onHide={() => setActiveNotification(null)} 
      />
    </View>
  );
}

export default function App() { 
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={HomeScreen} />
          {/* Unsere beiden neuen Screens wurden hier registriert */}
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  ); 
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  mainLayer: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  buttonLayer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 50,
  }
});