// repositories/AssetRepository.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Kapselung der SQLite-Logik (Repository Pattern)

import * as SQLite from 'expo-sqlite';
import { Config } from '../constants/Config';

class AssetRepository {
  constructor() {
    this.db = null;
  }

  /**
   * Initialisiert die Datenbank und erstellt die Tabellen, falls nicht vorhanden.
   */
  async initialize() {
    if (this.db) return this.db;

    try {
      this.db = await SQLite.openDatabaseAsync(Config.DATABASE.NAME);
      
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS snapshots (
          provider TEXT PRIMARY KEY, 
          value REAL, 
          timestamp INTEGER
        );
        CREATE TABLE IF NOT EXISTS ${Config.DATABASE.TABLE_HISTORY} (
          timestamp INTEGER PRIMARY KEY, 
          total_value REAL
        );
      `);
      
      return this.db;
    } catch (error) {
      console.error("Repository: Fehler bei der Initialisierung:", error);
      throw error;
    }
  }

  /**
   * Holt alle aktuellen Snapshots der Anbieter.
   */
  async getAllSnapshots() {
    if (!this.db) await this.initialize();
    return await this.db.getAllAsync("SELECT provider, value FROM snapshots ORDER BY provider ASC;");
  }

  /**
   * Berechnet den Gesamtwert über alle Anbieter.
   */
  async getTotalValue() {
    if (!this.db) await this.initialize();
    const result = await this.db.getFirstAsync("SELECT SUM(value) as total FROM snapshots;");
    return result?.total || 0;
  }

  /**
   * Holt die Historie basierend auf einem Zeitlimit (für Chart-Filter).
   */
  async getHistory(timeLimit = 0) {
    if (!this.db) await this.initialize();
    return await this.db.getAllAsync(
      `SELECT timestamp, total_value as value FROM ${Config.DATABASE.TABLE_HISTORY} WHERE timestamp >= ? ORDER BY timestamp ASC;`,
      [timeLimit]
    );
  }

  /**
   * Speichert einen neuen Asset-Wert und aktualisiert die Historie.
   */
  async saveAsset(provider, value) {
    if (!this.db) await this.initialize();
    const now = Date.now();
    
    try {
      // 1. Snapshot speichern/ersetzen
      await this.db.runAsync(
        "INSERT OR REPLACE INTO snapshots (provider, value, timestamp) VALUES (?, ?, ?);",
        [provider, value, now]
      );

      // 2. Neuen Gesamtwert für die Historie ermitteln
      const currentTotal = await this.getTotalValue();

      // 3. Historien-Eintrag schreiben
      await this.db.runAsync(
        `INSERT INTO ${Config.DATABASE.TABLE_HISTORY} (timestamp, total_value) VALUES (?, ?);`,
        [now, currentTotal]
      );

      return currentTotal;
    } catch (error) {
      console.error("Repository: Fehler beim Speichern:", error);
      throw error;
    }
  }
}

export default new AssetRepository();