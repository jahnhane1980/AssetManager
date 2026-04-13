// components/BackupModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Umstellung auf nativen Android-OAuth-Flow (ohne Expo Proxy)

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

  const dbPath = `${FileSystem.documentDirectory}SQLite/${Config.DATABASE.NAME}`;

  // Nativer Redirect-Pfad für Android mit explizitem Pfad
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'com.jahnhane.assetmanager',
    path: 'oauthredirect',
  });
  //alt 
  //const redirectUri = AuthSession.makeRedirectUri({
  //  useProxy: false,
  //});

  // In BackupModal.js suchen und davor einfügen:
  console.log("AKTUELLER CLIENT-ID-CHECK:", Config.GOOGLE_DRIVE.CLIENT_ID_ANDROID);
  console.log("PROXY-MODUS:", false); // Hier siehst du, ob dein Code-Stand stimmt

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: Config.GOOGLE_DRIVE.CLIENT_ID_ANDROID,
    iosClientId: Config.GOOGLE_DRIVE.CLIENT_ID_IOS,
    webClientId: Config.GOOGLE_DRIVE.CLIENT_ID_WEB,
    scopes: Config.GOOGLE_DRIVE.SCOPES,
    redirectUri: redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      GoogleDriveService.setAccessToken(authentication.accessToken);
      setIsAuthenticated(true);
      global.notify("Erfolgreich mit Google verbunden", 'success');
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
      global.notify("Fehler beim Laden der Backups", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsProcessing(true);
    try {
      const info = await FileSystem.getInfoAsync(dbPath);
      if (!info.exists) throw new Error("Datenbank nicht gefunden.");

      const base64 = await FileSystem.readAsStringAsync(dbPath, { encoding: FileSystem.EncodingType.Base64 });
      const folderId = await GoogleDriveService.getOrCreateBackupFolder();
      const fileName = `${Config.GOOGLE_DRIVE.BACKUP_FILE_PREFIX}${new Date().toISOString().replace(/:/g, '-')}.db`;

      await GoogleDriveService.uploadBackup(folderId, fileName, base64);
      
      global.notify("Backup erfolgreich erstellt", 'success');
      await loadBackups();
    } catch (error) {
      global.notify("Upload fehlgeschlagen", 'error');
      Alert.alert("Detail-Fehler", error.message);
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

      global.notify("Wiederherstellung erfolgreich", 'success');
      if (onRestoreSuccess) onRestoreSuccess();
      onClose();
    } catch (error) {
      global.notify("Restore fehlgeschlagen", 'error');
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
  restoreBtn: { padding: 2 }
});