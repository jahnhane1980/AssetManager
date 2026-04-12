// constants/Config.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Technische Infrastruktur & API-Konfiguration

export const Config = {
  DATABASE: {
    NAME: 'assets.db',
    TABLE_HISTORY: 'asset_history_v2', // Neue Tabelle für Millisekunden-Präzision
  },
  STORAGE_KEYS: {
    MASTER_KEY: 'user_master_key_v1',
    GEMINI_KEY: 'gemini_api_key_v1',
  },
  GEMINI_API: {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1/models',
    MODEL: 'gemini-2.5-flash',
    ENDPOINT: 'generateContent',
  },
};