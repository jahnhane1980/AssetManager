// constants/Config.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Technische Infrastruktur & API-Konfiguration

export const Config = {
  DATABASE: {
    NAME: 'assets.db',
    // Tabellen
    TABLE_ENTRIES: 'asset_entries_v1',      // Das Logbuch (alle Buchungen)
    TABLE_DAILY_HISTORY: 'daily_history_v1', // Das Aggregat pro Tag für das Chart
    // Views
    VIEW_SNAPSHOTS: 'v_snapshots_v1',       // Dynamische Sicht auf den letzten Stand
  },
  STORAGE_KEYS: {
    MASTER_KEY: 'user_master_key_v1',
    GEMINI_KEY: 'gemini_api_key_v1',
    PAGE_SIZE: 'app_page_size_v1',
  },
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 15,
  },
  GEMINI_API: {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1/models',
    MODEL: 'gemini-2.5-flash',
    ENDPOINT: 'generateContent',
  },
};