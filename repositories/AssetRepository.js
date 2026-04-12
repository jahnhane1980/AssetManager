// repositories/AssetRepository.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Kapselung der SQLite-Logik mit VIEWs und TRIGGERN

import * as SQLite from 'expo-sqlite';
import { Config } from '../constants/Config';

class AssetRepository {
  constructor() {
    this.db = null;
  }

  /**
   * Initialisiert die Datenbank und erstellt das Schema (Tables, View, Trigger).
   */
  async initialize() {
    if (this.db) return this.db;

    try {
      this.db = await SQLite.openDatabaseAsync(Config.DATABASE.NAME);
      
      const { TABLE_ENTRIES, TABLE_DAILY_HISTORY, VIEW_SNAPSHOTS } = Config.DATABASE;

      await this.db.execAsync(`
        -- 1. Das Logbuch: Speichert jeden einzelnen Eintrag
        CREATE TABLE IF NOT EXISTS ${TABLE_ENTRIES} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          provider TEXT NOT NULL,
          value REAL NOT NULL,
          timestamp INTEGER NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s','now') * 1000)
        );

        -- 2. Daily History: Aggregat pro Tag (YYYY-MM-DD)
        CREATE TABLE IF NOT EXISTS ${TABLE_DAILY_HISTORY} (
          date TEXT PRIMARY KEY, 
          total_value REAL NOT NULL
        );

        -- 3. Snapshot View: Zeigt immer den aktuellsten Wert pro Anbieter
        DROP VIEW IF EXISTS ${VIEW_SNAPSHOTS};
        CREATE VIEW ${VIEW_SNAPSHOTS} AS
        SELECT provider, value, timestamp
        FROM ${TABLE_ENTRIES}
        WHERE id IN (
            SELECT MAX(id) FROM ${TABLE_ENTRIES} GROUP BY provider
        );

        -- 4. Trigger: Automatische Aktualisierung der Daily History bei neuen Einträgen
        -- Wir berechnen bei jedem Insert den Gesamtwert für diesen Tag neu.
        DROP TRIGGER IF EXISTS tr_update_daily_history;
        CREATE TRIGGER tr_update_daily_history
        AFTER INSERT ON ${TABLE_ENTRIES}
        BEGIN
            INSERT OR REPLACE INTO ${TABLE_DAILY_HISTORY} (date, total_value)
            SELECT 
                date(NEW.timestamp / 1000, 'unixepoch'),
                SUM(value)
            FROM (
                -- Wir nehmen den jeweils letzten Wert jedes Providers bis zu diesem Tag
                SELECT value FROM ${TABLE_ENTRIES} 
                WHERE date(timestamp / 1000, 'unixepoch') <= date(NEW.timestamp / 1000, 'unixepoch')
                GROUP BY provider HAVING MAX(timestamp)
            );
        END;
      `);
      
      return this.db;
    } catch (error) {
      console.error("Repository: Fehler bei der Initialisierung:", error);
      throw error;
    }
  }

  /**
   * Nutzt die VIEW, um die aktuellen Bestände abzurufen.
   */
  async getAllSnapshots() {
    if (!this.db) await this.initialize();
    return await this.db.getAllAsync(`SELECT provider, value, timestamp FROM ${Config.DATABASE.VIEW_SNAPSHOTS} ORDER BY provider ASC;`);
  }

  /**
   * Berechnet den Gesamtwert über die Snapshots.
   */
  async getTotalValue() {
    if (!this.db) await this.initialize();
    const result = await this.db.getFirstAsync(`SELECT SUM(value) as total FROM ${Config.DATABASE.VIEW_SNAPSHOTS};`);
    return result?.total || 0;
  }

  /**
   * Holt die Historie aus der optimierten Daily-Tabelle.
   */
  async getHistory(timeLimit = 0, limit = 1000, offset = 0, sortOrder = 'ASC') {
    if (!this.db) await this.initialize();
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    // Da daily_history nach Datum (TEXT) speichert, wandeln wir das Limit um
    const dateLimit = new Date(timeLimit).toISOString().split('T')[0];

    return await this.db.getAllAsync(
      `SELECT date as timestamp, total_value as value 
       FROM ${Config.DATABASE.TABLE_DAILY_HISTORY} 
       WHERE date >= ? 
       ORDER BY date ${order} 
       LIMIT ? OFFSET ?;`,
      [dateLimit, limit, offset]
    );
  }

  /**
   * Speichert einen neuen Eintrag in das Logbuch. 
   * Der Rest (Snapshot-Update & Daily-History) passiert automatisch in der DB.
   */
  async saveAsset(provider, value, customTimestamp = null) {
    if (!this.db) await this.initialize();
    const ts = customTimestamp || Date.now();
    
    try {
      await this.db.runAsync(
        `INSERT INTO ${Config.DATABASE.TABLE_ENTRIES} (provider, value, timestamp) VALUES (?, ?, ?);`,
        [provider, value, ts]
      );
      return await this.getTotalValue();
    } catch (error) {
      console.error("Repository: Fehler beim Speichern:", error);
      throw error;
    }
  }

  /**
   * Führt einen kompletten Reset durch: Löscht alle Tabellen und Views.
   */
  async clearAllData() {
    if (!this.db) await this.initialize();
    try {
      const { TABLE_ENTRIES, TABLE_DAILY_HISTORY, VIEW_SNAPSHOTS } = Config.DATABASE;
      
      // Harter Reset: Alles weg.
      await this.db.execAsync(`
        DROP TABLE IF EXISTS ${TABLE_ENTRIES};
        DROP TABLE IF EXISTS ${TABLE_DAILY_HISTORY};
        DROP TABLE IF EXISTS asset_history_v2; -- Alte Tabelle aufräumen
        DROP TABLE IF EXISTS snapshots;        -- Alte Tabelle aufräumen
        DROP VIEW IF EXISTS ${VIEW_SNAPSHOTS};
      `);
      
      // DB-Referenz zurücksetzen, damit initialize() alles neu aufbaut
      this.db = null;
      await this.initialize();
      
      return true;
    } catch (error) {
      console.error("Repository: Fehler beim Full-Reset:", error);
      throw error;
    }
  }
}

export default new AssetRepository();