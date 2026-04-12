// constants/AppConstants.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Rein statische Fach-Konstanten

export const AppConstants = {
  PROVIDERS: [
    'C24',
    'Norisbank',
    'Trading 212',
    'Bitget',
    'Timeless'
  ],
  CHART: {
    FILTERS: ['3M', '6M', '1Y', 'ALL'],
    HEIGHT: 200,
    PADDING: 20,
  },
  AI_PROCESSING: {
    MAX_RETRIES: 3,
    TIMEOUT_MS: 30000,
  },
  PROMPTS: {
    // Dieser String-Generator bleibt hier, da er eine reine Konfiguration für die KI ist.
    ASSET_EXTRACTION: (provider) => `Du bist ein Finanz-Experte. Analysiere diesen Screenshot von "${provider}". 
      Extrahiere den aktuellen Gesamtsaldo. Falls kein Gesamtwert existiert, addiere alle Asset-Werte auf dem Bild. 
      Antworte NUR mit dem Zahlenwert im Format XX.XXX,XX oder XX,XX.`,
  },
};