// components/BackupModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fix: Nutzung von expo-file-system/legacy zur Behebung von Evaluierungsfehlern

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Umstellung auf legacy Import für bessere Kompatibilität in Expo-Umgebungen
import * as FileSystem from 'expo-file-system/legacy'; 
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { Theme } from './Theme';
import { Config } from '../constants/Config';
import GoogleDriveService from '../services/GoogleDriveService';

WebBrowser.maybeCompleteAuthSession();

export default function BackupModal({ visible, onClose, onRestoreSuccess }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backups, setBackups] = useState([]);
  const [statusMessage, setStatusMessage] = useState(null);

  // Pfad zur lokalen SQLite Datenbank
  const dbPath = `${FileSystem.documentDirectory}SQLite/${Config.DATABASE.NAME}`;

  // Google Auth Request Hook
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: Config.GOOGLE_DRIVE.CLIENT_ID_IOS,
    androidClientId: Config.GOOGLE_DRIVE.CLIENT_ID_ANDROID,
    webClientId: Config.GOOGLE_DRIVE.CLIENT_ID_WEB,
    scopes: Config.GOOGLE_DRIVE.SCOPES,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      GoogleDriveService.setAccessToken(authentication.accessToken);
      setIsAuthenticated(true);
      setStatusMessage({ text: "Erfolgreich mit Google verbunden!", type: 'success' });
      loadBackups();
    }
  }, [response]);

  const loadBackups = async () => {
    setIsProcessing(true);
    try {
      const folderId = await GoogleDriveService.getOrCreateBackupFolder();
      const list = await GoogleDriveService.listBackups(folderId);
      setBackups(list);
    } catch (error) {
      console.error(error);
      setStatusMessage({ text: "Fehler beim Laden der Backups.", type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const info = await FileSystem.getInfoAsync(dbPath);
      if (!info.exists) throw new Error("Datenbank nicht gefunden.");

      const base64 = await FileSystem.readAsStringAsync(dbPath, { encoding: FileSystem.EncodingType.Base64 });
      const folderId = await GoogleDriveService.getOrCreateBackupFolder();
      const fileName = `${Config.GOOGLE_DRIVE.BACKUP_FILE_PREFIX}${new Date().toISOString().replace(/:/g, '-')}.db`;

      await GoogleDriveService.uploadBackup(folderId, fileName, base64);
      
      setStatusMessage({ text: "Backup erfolgreich erstellt!", type: 'success' });
      await loadBackups();
    } catch (error) {
      setStatusMessage({ text: "Fehler: " + error.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = (fileId, fileName) => {
    Alert.alert(
      "Restore",
      `Backup "${fileName}" einspielen? Aktuelle Daten werden überschrieben.`,
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Wiederherstellen", style: "destructive", onPress: () => performRestore(fileId) }
      ]
    );
  };

  const performRestore = async (fileId) => {
    setIsProcessing(true);
    try {
      const base64 = await GoogleDriveService.downloadFile(fileId);
      await FileSystem.writeAsStringAsync(dbPath, base64, { encoding: FileSystem.EncodingType.Base64 });

      setStatusMessage({ text: "Erfolgreich wiederhergestellt!", type: 'success' });
      if (onRestoreSuccess) onRestoreSuccess();
    } catch (error) {
      setStatusMessage({ text: "Restore fehlgeschlagen: " + error.message, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (ds) => new Date(ds).toLocaleString('de-DE');

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cloud Backup</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {!isAuthenticated ? (
            <View style={styles.loginSection}>
              <Ionicons name="cloud-offline-outline" size={60} color={Theme.colors.textSecondary} style={styles.centerIcon} />
              <Text style={styles.description}>
                Verbinde dein Google Drive, um deine Daten sicher zu speichern.
              </Text>
              <TouchableOpacity 
                style={[styles.primaryBtn, !request && styles.disabledBtn]} 
                onPress={() => promptAsync()}
                disabled={!request || isProcessing}
              >
                <Ionicons name="logo-google" size={20} color="#fff" style={{ marginRight: 10 }} />
                <Text style={styles.btnText}>Anmelden</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.backupSection}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateBackup} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Backup erstellen</Text>}
              </TouchableOpacity>

              <View style={styles.divider} />

              <Text style={styles.subTitle}>Sicherungen</Text>
              {backups.map((item) => (
                <View key={item.id} style={styles.backupCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.backupName}>{item.name}</Text>
                    <Text style={styles.backupDate}>{formatDate(item.createdTime)}</Text>
                  </View>
                  <TouchableOpacity style={styles.restoreBtn} onPress={() => handleRestore(item.id, item.name)}>
                    <Ionicons name="refresh-circle" size={30} color={Theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {statusMessage && (
            <View style={[styles.statusBanner, statusMessage.type === 'error' ? styles.statusError : styles.statusSuccess]}>
              <Text style={styles.statusText}>{statusMessage.text}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Theme.spacing.l, paddingTop: Platform.OS === 'ios' ? 60 : 20, paddingBottom: Theme.spacing.m, backgroundColor: Theme.colors.surface, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  headerTitle: { fontSize: Theme.fontSize.header, fontWeight: Theme.fontWeight.bold, color: Theme.colors.text },
  closeBtn: { padding: 5 },
  content: { padding: Theme.spacing.l },
  loginSection: { alignItems: 'center', marginTop: 40 },
  centerIcon: { marginBottom: Theme.spacing.l },
  description: { fontSize: Theme.fontSize.body, color: Theme.colors.textSecondary, textAlign: 'center', marginBottom: Theme.spacing.xl, lineHeight: 22 },
  primaryBtn: { flexDirection: 'row', backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, width: '100%', alignItems: 'center', justifyContent: 'center' },
  disabledBtn: { opacity: 0.5 },
  btnText: { color: Theme.colors.white, fontWeight: Theme.fontWeight.bold, fontSize: Theme.fontSize.body },
  backupSection: { width: '100%' },
  subTitle: { fontSize: Theme.fontSize.subHeader, fontWeight: Theme.fontWeight.semibold, marginBottom: Theme.spacing.m, color: Theme.colors.text },
  divider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: Theme.spacing.xl },
  backupCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Theme.colors.surface, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, marginBottom: Theme.spacing.s, elevation: 1 },
  backupName: { fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.medium, color: Theme.colors.text },
  backupDate: { fontSize: Theme.fontSize.hint, color: Theme.colors.textSecondary },
  restoreBtn: { padding: 2 },
  statusBanner: { marginTop: 30, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.s, alignItems: 'center' },
  statusSuccess: { backgroundColor: '#e8f5e9' },
  statusError: { backgroundColor: '#ffebee' },
  statusText: { fontWeight: Theme.fontWeight.medium, fontSize: Theme.fontSize.caption },
});