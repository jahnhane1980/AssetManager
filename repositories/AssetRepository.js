// repositories/AssetRepository.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Kapselung der SQLite-Logik mit Aggregations-Unterstützung
// Optimierung: Hinzufügen von Indizes zur Beschleunigung von Abfragen und Triggern
// Update: getAllAssets() hinzugefügt für Provider-Historie

import * as SQLite from 'expo-sqlite';
import { Config } from '../constants/Config';

class AssetRepository {
  constructor() {
    this.db = null;
  }

  /**
   * Initialisiert die Datenbank und erstellt das Schema (Tables, View, Trigger, Indizes).
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

        -- 3. Indizes für Performance-Optimierung (Neu)
        -- Beschleunigt die Snapshot-View (Suche nach letztem Stand pro Provider)
        CREATE INDEX IF NOT EXISTS idx_entries_provider_ts 
        ON ${TABLE_ENTRIES} (provider, timestamp DESC);
        
        -- Beschleunigt Zeitbereichs-Abfragen und Trigger-Berechnungen
        CREATE INDEX IF NOT EXISTS idx_entries_timestamp 
        ON ${TABLE_ENTRIES} (timestamp);

        -- 4. Snapshot View: Zeigt immer den chronologisch aktuellsten Wert pro Anbieter
        DROP VIEW IF EXISTS ${VIEW_SNAPSHOTS};
        CREATE VIEW ${VIEW_SNAPSHOTS} AS
        SELECT provider, value, timestamp
        FROM ${TABLE_ENTRIES}
        WHERE id IN (
            SELECT id 
            FROM ${TABLE_ENTRIES} AS e2
            WHERE e2.provider = ${TABLE_ENTRIES}.provider
            ORDER BY timestamp DESC, id DESC
            LIMIT 1
        );

        -- 5. Trigger: Automatische Aktualisierung der Daily History bei neuen Einträgen
        DROP TRIGGER IF EXISTS tr_update_daily_history;
        CREATE TRIGGER tr_update_daily_history
        AFTER INSERT ON ${TABLE_ENTRIES}
        BEGIN
            INSERT OR REPLACE INTO ${TABLE_DAILY_HISTORY} (date, total_value)
            SELECT 
                date(NEW.timestamp / 1000, 'unixepoch'),
                SUM(value)
            FROM (
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
   * Liefert den Namen der Datenbankdatei zurück (wichtig für FileSystem-Operationen).
   */
  getDatabaseFileName() {
    return Config.DATABASE.NAME;
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
   * Holt die Historie mit optionaler Aggregation (DAILY, WEEKLY, MONTHLY, YEARLY).
   */
  async getHistory(timeLimit = 0, limit = 1000, offset = 0, sortOrder = 'ASC', aggregation = 'DAILY') {
    if (!this.db) await this.initialize();
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    const dateLimit = new Date(timeLimit).toISOString().split('T')[0];

    let query = "";
    let params = [dateLimit];

    if (aggregation === 'DAILY') {
      query = `SELECT date as timestamp, total_value as value FROM ${Config.DATABASE.TABLE_DAILY_HISTORY} WHERE date >= ?`;
    } else {
      const patterns = {
        'WEEKLY': '%Y-%W',
        'MONTHLY': '%Y-%m',
        'YEARLY': '%Y'
      };
      const pattern = patterns[aggregation] || '%Y-%m';
      
      query = `
        SELECT date as timestamp, total_value as value 
        FROM ${Config.DATABASE.TABLE_DAILY_HISTORY} 
        WHERE date IN (
          SELECT MAX(date) 
          FROM ${Config.DATABASE.TABLE_DAILY_HISTORY} 
          WHERE date >= ? 
          GROUP BY strftime('${pattern}', date)
        )
      `;
    }

    return await this.db.getAllAsync(`${query} ORDER BY date ${order} LIMIT ? OFFSET ?;`, [...params, limit, offset]);
  }

  /**
   * Holt alle Roh-Einträge aus der Datenbank (benötigt für Provider-Historien-Charts).
   */
  async getAllAssets() {
    if (!this.db) await this.initialize();
    return await this.db.getAllAsync(`SELECT provider, value, timestamp FROM ${Config.DATABASE.TABLE_ENTRIES} ORDER BY timestamp ASC;`);
  }

  /**
   * Speichert einen neuen Eintrag in das Logbuch.
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
   * Führt einen kompletten Reset durch.
   */
  async clearAllData() {
    if (!this.db) await this.initialize();
    try {
      const { TABLE_ENTRIES, TABLE_DAILY_HISTORY, VIEW_SNAPSHOTS } = Config.DATABASE;
      await this.db.execAsync(`
        DROP TABLE IF EXISTS ${TABLE_ENTRIES};
        DROP TABLE IF EXISTS ${TABLE_DAILY_HISTORY};
        DROP VIEW IF EXISTS ${VIEW_SNAPSHOTS};
      `);
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
