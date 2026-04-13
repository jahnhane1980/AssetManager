// services/LogService.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Globaler Logging Dienst mit /legacy FileSystem zur Fehlervermeidung
// Fix: Umstellung auf expo-file-system/legacy

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Config } from '../constants/Config';

class LogService {
  constructor() {
    this.logPath = `${FileSystem.documentDirectory}${Config.LOGGING.FILE_NAME}`;
  }

  /**
   * Initialisiert das Logging und führt die 24h Rotation durch.
   */
  async init() {
    try {
      const info = await FileSystem.getInfoAsync(this.logPath);
      
      if (info.exists) {
        const now = Date.now();
        // modificationTime bei legacy ist in Sekunden (Unix-Timestamp)
        const fileAge = now - (info.modificationTime * 1000);

        if (fileAge > Config.LOGGING.ROTATION_INTERVAL_MS) {
          await FileSystem.deleteAsync(this.logPath, { idempotent: true });
          // Nach dem Löschen ein neues System-Log starten
          await this.log("Log-Rotation: Alte Datei gelöscht (älter als 24h).", 'SYSTEM');
        }
      }
      
      await this.log("App-Initialisierung abgeschlossen.", 'SYSTEM');
    } catch (error) {
      console.error("LogService Init Fehler:", error);
    }
  }

  /**
   * Schreibt eine Nachricht in die Log-Datei.
   */
  async log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${type}] ${message}\n`;
    
    try {
      let currentContent = "";
      const info = await FileSystem.getInfoAsync(this.logPath);
      
      if (info.exists) {
        currentContent = await FileSystem.readAsStringAsync(this.logPath);
      }
      
      // Anhängen des neuen Eintrags und Speichern
      await FileSystem.writeAsStringAsync(this.logPath, currentContent + entry);
      
      // Für Debugging in der Konsole beibehalten
      console.log(entry.trim());
    } catch (error) {
      console.error("Fehler beim Schreiben des Logs:", error);
    }
  }

  /**
   * Versendet die Log-Datei über das System-Sharing.
   */
  async shareLogs() {
    try {
      const info = await FileSystem.getInfoAsync(this.logPath);
      if (!info.exists) {
        alert("Keine Log-Datei zum Versenden vorhanden.");
        return;
      }

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        alert("Sharing ist auf diesem Gerät nicht verfügbar.");
        return;
      }

      await Sharing.shareAsync(this.logPath, {
        mimeType: 'text/plain',
        dialogTitle: 'App-Logs versenden',
        UTI: 'public.plain-text'
      });
    } catch (error) {
      console.error("Fehler beim Teilen der Logs:", error);
    }
  }
}

export default new LogService();