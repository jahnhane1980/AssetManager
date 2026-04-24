// App.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: BackupModal zu Screen umgewandelt. Menu und Delete bleiben Modale.
// Update: allAssets wird für die Accordion-Diagramme an PortfolioList durchgereicht

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Theme } from './components/Theme';
import { Security } from './components/Security';
import AssetRepository from './repositories/AssetRepository';
import TotalValueHeader from './components/TotalValueHeader';
import PortfolioList from './components/PortfolioList';
import AddAssetButton from './components/AddAssetButton';
import MenuModal from './components/MenuModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Notification from './components/Notification';
import LogService from './services/LogService';

import SettingsScreen from './components/SettingsScreen';
import HistoryScreen from './components/HistoryScreen';
import AddAssetScreen from './components/AddAssetScreen';
import BackupScreen from './components/BackupScreen'; // Neu importiert

import { usePortfolioData } from './hooks/usePortfolioData';

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [isReady, setIsReady] = useState(false);
  const [currentTimeLimit, setCurrentTimeLimit] = useState(0);
  const [activeNotification, setActiveNotification] = useState(null);
  
  // HIER DIE ÄNDERUNG: allAssets aus dem Hook extrahieren
  const { 
    totalValue, 
    performance, 
    portfolios, 
    chartData,
    allAssets, // Neu extrahiert für Accordion-Charts
    aggregation, 
    refresh 
  } = usePortfolioData(isReady, currentTimeLimit);
  
  // Die verbleibenden Modal-States
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (isReady) refresh();
    }, [isReady, refresh])
  );

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
          onMenuPress={() => setMenuVisible(true)} 
        />
        <View style={styles.content}>
          <PortfolioList 
            portfolios={portfolios}
            chartData={chartData}
            allAssets={allAssets} // HIER DIE ÄNDERUNG: Daten an die Liste durchreichen
            aggregation={aggregation}
            onFilterChange={(limit) => setCurrentTimeLimit(limit)}
            onProviderPress={(p) => navigation.navigate('AddAsset', { initialProvider: p })}
          />
        </View>
        <AddAssetButton />
      </View>

      <MenuModal 
        visible={isMenuVisible} 
        onClose={() => setMenuVisible(false)} 
        onOpenSettings={() => navigation.navigate('Settings')}
        onOpenHistory={() => navigation.navigate('History')}
        onOpenDeleteConfirm={() => setDeleteModalVisible(true)}
        // Backup leitet nun auf den neuen Screen um
        onOpenBackup={() => navigation.navigate('Backup')}
      />
      
      <DeleteConfirmationModal 
        visible={isDeleteModalVisible} 
        onClose={() => setDeleteModalVisible(false)} 
        onConfirm={handleDeleteAllData}
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
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="AddAsset" component={AddAssetScreen} />
          {/* Neuer Backup Screen registriert */}
          <Stack.Screen name="Backup" component={BackupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  ); 
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  mainLayer: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 }
});