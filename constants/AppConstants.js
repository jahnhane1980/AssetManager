// constants/AppConstants.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify

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
    // Basis-Instruktion für alle Prompts
    SYSTEM_BASE: "Du bist ein Finanz-Experte. Antworte NUR mit dem reinen Zahlenwert im Format XX.XXX,XX oder XX,XX. Keine Währungssymbole, kein Text.",
    
    // Provider-spezifische Logik
    EXTRACTION_MAP: {
      'Bitget': "Suche nach dem Text 'Gesamtwert der Assets'. Ignoriere den USDT-Betrag. Extrahiere stattdessen ausschließlich den EUR-Wert, der meistens hinter einem '=' Zeichen steht (z.B. = 123,45 EUR).",
      
      'Trading 212': "Suche nach dem Schlagwort 'KONTOWERT' in Großbuchstaben. Extrahiere den exakten Geldbetrag, der unmittelbar unter diesem Wort steht.",
      
      'Norisbank': "Suche nach dem Begriff 'Gesamtsaldo'. Extrahiere den darauf folgenden Zahlenwert.",
      
      'C24': "Der gesuchte Betrag steht ganz oben im Bild. Bestätige den Wert, indem du prüfst, ob darunter 'C24 Smartkonto' steht. Extrahiere nur die obere große Zahl.",
      
      'Timeless': "Suche den Bereich 'Deine Assets'. Falls dort kein Gesamtsummenwert steht, addiere alle Einzelbeträge der darunter gelisteten Assets auf und gib die Summe zurück.",
      
      'Default': "Analysiere den Screenshot und extrahiere den aktuellen Gesamtsaldo. Falls kein Gesamtwert existiert, addiere alle sichtbaren Asset-Werte auf."
    },

    // Funktion zum Zusammenbauen des Prompts
    ASSET_EXTRACTION: (provider) => {
      const specificPrompt = AppConstants.PROMPTS.EXTRACTION_MAP[provider] || AppConstants.PROMPTS.EXTRACTION_MAP['Default'];
      return `${AppConstants.PROMPTS.SYSTEM_BASE}\n\nKontext für ${provider}: ${specificPrompt}`;
    }
  },
};