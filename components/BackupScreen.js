// components/BackupScreen.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Korrektur des AssetRepository-Fehlers durch Nutzung des BackupManagers

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';
import ScreenHeader from './ScreenHeader';
import PrimaryButton from './PrimaryButton';
import BackupManager from '../services/BackupManager'; // Korrekt importiert
import { useGoogleAuth } from '../hooks/useGoogleAuth'; // Korrekt importiert

export default function BackupScreen({ navigation }) {
  const { token, isAuthenticated, login, isReady } = useGoogleAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [backups, setBackups] = useState([]);

  // Lädt die Liste der Backups aus der Cloud
  const loadBackups = useCallback(async () => {
    if (!token) return;
    try {
      const files = await BackupManager.getAvailableBackups(token);
      setBackups(files);
    } catch (error) {
      console.error("Backup-Ladefehler:", error);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      loadBackups();
    }
  }, [isAuthenticated, loadBackups]);

  const handleBackup = async () => {
    if (!isAuthenticated) return;
    setIsProcessing(true);
    try {
      // NUTZT JETZT DEN BACKUP-MANAGER STATT ASSET-REPOSITORY
      await BackupManager.createBackup(token);
      global.notify("Backup erfolgreich erstellt", "success");
      await loadBackups();
    } catch (error) {
      Alert.alert("Fehler", "Backup konnte nicht erstellt werden: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = (file) => {
    Alert.alert(
      "Daten wiederherstellen",
      "Möchtest du dieses Backup wirklich einspielen? Alle lokalen Daten werden überschrieben.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Wiederherstellen",
          onPress: async () => {
            setIsProcessing(true);
            try {
              await BackupManager.restoreBackup(token, file.id);
              global.notify("Daten erfolgreich wiederhergestellt", "success");
              setTimeout(() => navigation.goBack(), 1500);
            } catch (error) {
              Alert.alert("Fehler", "Wiederherstellung fehlgeschlagen");
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const latestBackup = backups.length > 0 ? backups[0] : null;

  return (
    <View style={styles.container}>
      <ScreenHeader 
        title="Backup & Restore" 
        onClose={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="cloud-done-outline" size={40} color={Theme.colors.primary} style={styles.mainIcon} />
          <Text style={styles.cardTitle}>Cloud Synchronisierung</Text>
          <Text style={styles.cardText}>
            Sichere deine Vermögensdaten in deinem Google Drive. 
          </Text>
        </View>

        {!isAuthenticated ? (
          <PrimaryButton
            title="Mit Google verbinden"
            icon="logo-google"
            variant="google"
            onPress={login}
            disabled={!isReady || isProcessing}
          />
        ) : (
          <View style={styles.accountInfo}>
            <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />
            <Text style={styles.accountEmail}> Google Drive verbunden</Text>
          </View>
        )}

        <View style={styles.actionSection}>
          <PrimaryButton
            title="Backup jetzt erstellen"
            icon="cloud-upload-outline"
            variant="primary"
            onPress={handleBackup}
            disabled={!isAuthenticated || isProcessing}
          />

          <PrimaryButton
            title={latestBackup ? "Neuestes Backup einspielen" : "Kein Backup vorhanden"}
            icon="cloud-download-outline"
            variant="outline"
            onPress={() => latestBackup && handleRestore(latestBackup)}
            disabled={!isAuthenticated || isProcessing || !latestBackup}
          />
        </View>

        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={styles.loadingText}>Bitte warten...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, padding: Theme.spacing.l },
  infoCard: { 
    backgroundColor: Theme.colors.surface, 
    padding: Theme.spacing.xl, 
    borderRadius: Theme.borderRadius.l, 
    alignItems: 'center', 
    marginBottom: Theme.spacing.xl,
    elevation: 2
  },
  mainIcon: { marginBottom: Theme.spacing.m },
  cardTitle: { fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.bold, color: Theme.colors.text, marginBottom: Theme.spacing.s },
  cardText: { textAlign: 'center', color: Theme.colors.textSecondary, lineHeight: 20 },
  accountInfo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: Theme.spacing.l },
  accountEmail: { color: Theme.colors.success, fontWeight: Theme.fontWeight.bold },
  actionSection: { gap: Theme.spacing.m },
  loadingOverlay: { marginTop: Theme.spacing.xl, alignItems: 'center' },
  loadingText: { marginTop: Theme.spacing.m, color: Theme.colors.textSecondary }
});