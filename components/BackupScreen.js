// components/BackupScreen.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Integration von PrimaryButton (inkl. Google und Outline Varianten)

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';
import GoogleDriveService from '../services/GoogleDriveService';
import AssetRepository from '../repositories/AssetRepository';
import ScreenHeader from './ScreenHeader';
import PrimaryButton from './PrimaryButton'; // Neu importiert

export default function BackupScreen({ navigation, route }) {
  const [isDriveReady, setIsDriveReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    initDrive();
  }, []);

  const initDrive = async () => {
    try {
      const user = await GoogleDriveService.init();
      if (user) {
        setUserInfo(user);
        setIsDriveReady(true);
      }
    } catch (error) {
      console.log("Drive Init Fehler (BackupScreen):", error);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsProcessing(true);
    try {
      const user = await GoogleDriveService.signIn();
      if (user) {
        setUserInfo(user);
        setIsDriveReady(true);
        global.notify("Google Drive verbunden", "success");
      }
    } catch (error) {
      global.notify("Login fehlgeschlagen", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackup = async () => {
    if (!isDriveReady) return;
    setIsProcessing(true);
    try {
      const data = await AssetRepository.getRawData();
      const success = await GoogleDriveService.uploadBackup(data);
      if (success) {
        global.notify("Backup erfolgreich erstellt", "success");
      } else {
        throw new Error("Upload fehlgeschlagen");
      }
    } catch (error) {
      global.notify("Backup-Fehler", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (!isDriveReady) return;

    Alert.alert(
      "Daten wiederherstellen",
      "Alle lokalen Daten werden durch das Backup ersetzt. Fortfahren?",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Wiederherstellen",
          onPress: async () => {
            setIsProcessing(true);
            try {
              const backupData = await GoogleDriveService.downloadBackup();
              if (backupData) {
                await AssetRepository.restoreData(backupData);
                global.notify("Daten erfolgreich wiederhergestellt", "success");
                setTimeout(() => navigation.goBack(), 1500);
              } else {
                global.notify("Kein Backup gefunden", "info");
              }
            } catch (error) {
              global.notify("Restore-Fehler", "error");
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

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
            Sichere deine Vermögensdaten verschlüsselt in deinem Google Drive. 
            So kannst du sie bei einem Handywechsel einfach wiederherstellen.
          </Text>
        </View>

        {!isDriveReady ? (
          <PrimaryButton
            title="Mit Google verbinden"
            icon="logo-google"
            variant="google"
            onPress={handleGoogleSignIn}
            disabled={isProcessing}
          />
        ) : (
          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>Verbunden als:</Text>
            <Text style={styles.accountEmail}>{userInfo?.email || "Google Konto"}</Text>
          </View>
        )}

        <View style={styles.actionSection}>
          <PrimaryButton
            title="Backup jetzt erstellen"
            icon="cloud-upload-outline"
            variant="primary"
            onPress={handleBackup}
            disabled={!isDriveReady || isProcessing}
          />

          <PrimaryButton
            title="Backup einspielen"
            icon="cloud-download-outline"
            variant="outline"
            onPress={handleRestore}
            disabled={!isDriveReady || isProcessing}
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
    elevation: 2,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  mainIcon: { marginBottom: Theme.spacing.m },
  cardTitle: { fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.bold, color: Theme.colors.text, marginBottom: Theme.spacing.s },
  cardText: { textAlign: 'center', color: Theme.colors.textSecondary, lineHeight: 20, fontSize: Theme.fontSize.description },
  accountInfo: { alignItems: 'center', marginBottom: Theme.spacing.l },
  accountLabel: { color: Theme.colors.textSecondary, fontSize: Theme.fontSize.caption },
  accountEmail: { color: Theme.colors.primary, fontWeight: Theme.fontWeight.bold, fontSize: Theme.fontSize.body },
  actionSection: { gap: Theme.spacing.m, marginTop: Theme.spacing.m },
  loadingOverlay: { marginTop: Theme.spacing.xl, alignItems: 'center' },
  loadingText: { marginTop: Theme.spacing.m, color: Theme.colors.textSecondary }
});