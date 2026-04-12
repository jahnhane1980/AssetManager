// constants/Config.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Technische Infrastruktur & API-Konfiguration
// Update: Google OAuth Web-Client ID eingetragen

export const Config = {
  DATABASE: {
    NAME: 'assets.db',
    TABLE_ENTRIES: 'asset_entries_v1',
    TABLE_DAILY_HISTORY: 'daily_history_v1',
    VIEW_SNAPSHOTS: 'v_snapshots_v1',
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
  GOOGLE_DRIVE: {
    FOLDER_NAME: 'AssetManagerBackup',
    BACKUP_FILE_PREFIX: 'assetmanager_backup_',
    MIME_TYPE_DB: 'application/x-sqlite3',
    MIME_TYPE_FOLDER: 'application/vnd.google-apps.folder',
    SCOPES: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.install'],
    // IDs aus der Cloud Console
    CLIENT_ID_IOS: 'DEINE_IOS_CLIENT_ID.apps.googleusercontent.com',
    CLIENT_ID_ANDROID: 'DEINE_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    // ID aus dem Screenshot übertragen
    CLIENT_ID_WEB: '452103334238-nafcpc7l8dfsv9vl1md9gc06509ld5la.apps.googleusercontent.com',
  }
};