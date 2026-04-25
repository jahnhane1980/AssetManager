// services/BackupManager.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Kapselung der DB-File-Operationen für Cloud-Backups

import * as FileSystem from 'expo-file-system';
import { Config } from '../constants/Config';
import GoogleDriveService from './GoogleDriveService';

class BackupManager {
  constructor() {
    // Standardpfad für Expo SQLite Datenbanken
    this.dbPath = `${FileSystem.documentDirectory}SQLite/${Config.DATABASE.NAME}`;
  }

  /**
   * Bereitet die Datenbank-Datei für den Upload vor (Base64).
   */
  async createBackup(accessToken) {
    try {
      GoogleDriveService.setAccessToken(accessToken);
      
      const fileInfo = await FileSystem.getInfoAsync(this.dbPath);
      if (!fileInfo.exists) {
        throw new Error("Datenbank-Datei nicht gefunden.");
      }

      // Datei als Base64 einlesen
      const base64Data = await FileSystem.readAsStringAsync(this.dbPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const folderId = await GoogleDriveService.getOrCreateBackupFolder();
      const fileName = `AssetManager_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;

      return await GoogleDriveService.uploadBackup(folderId, fileName, base64Data);
    } catch (error) {
      console.error("BackupManager Error (Upload):", error);
      throw error;
    }
  }

  /**
   * Holt die Liste der verfügbaren Backups.
   */
  async getAvailableBackups(accessToken) {
    try {
      GoogleDriveService.setAccessToken(accessToken);
      const folderId = await GoogleDriveService.getOrCreateBackupFolder();
      return await GoogleDriveService.listBackups(folderId);
    } catch (error) {
      console.error("BackupManager Error (List):", error);
      throw error;
    }
  }

  /**
   * Lädt ein Backup herunter und überschreibt die lokale Datenbank.
   */
  async restoreBackup(accessToken, fileId) {
    try {
      GoogleDriveService.setAccessToken(accessToken);

      const base64Data = await GoogleDriveService.downloadFile(fileId);

      // Sicherstellen, dass das Verzeichnis existiert
      const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite`);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`);
      }

      await FileSystem.writeAsStringAsync(this.dbPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return true;
    } catch (error) {
      console.error("BackupManager Error (Restore):", error);
      throw error;
    }
  }
}

export default new BackupManager();