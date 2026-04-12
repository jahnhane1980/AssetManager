// Security.js
// Regel 6: Vollständiger Dateiinhalt
// Regel 7: Fokus auf Struktur und Lesbarkeit

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const MASTER_KEY_ID = 'user_master_key_v1';
const GEMINI_KEY_ID = 'gemini_api_key_v1';

export const Security = {
  /**
   * Holt den Master-Key aus dem SecureStore oder generiert einen neuen.
   */
  getOrCreateMasterKey: async () => {
    try {
      let key = await SecureStore.getItemAsync(MASTER_KEY_ID);
      
      if (!key) {
        console.log("Generiere neuen Master-Key...");
        key = Crypto.randomUUID(); 
        await SecureStore.setItemAsync(MASTER_KEY_ID, key, {
          keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
        });
      }
      
      return key;
    } catch (error) {
      console.error("Fehler beim Zugriff auf SecureStore:", error);
      return null;
    }
  },

  /**
   * Speichert den Gemini API Key sicher.
   */
  setGeminiKey: async (apiKey) => {
    try {
      await SecureStore.setItemAsync(GEMINI_KEY_ID, apiKey, {
        keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
      });
      return true;
    } catch (error) {
      console.error("Fehler beim Speichern des Gemini Keys:", error);
      return false;
    }
  },

  /**
   * Holt den gespeicherten Gemini API Key.
   */
  getGeminiKey: async () => {
    try {
      return await SecureStore.getItemAsync(GEMINI_KEY_ID);
    } catch (error) {
      console.error("Fehler beim Laden des Gemini Keys:", error);
      return null;
    }
  },

  /**
   * Ein einfacher Platzhalter für die Verschlüsselung eines Wertes.
   */
  encryptValue: (value, key) => {
    return value; 
  },

  decryptValue: (encryptedValue, key) => {
    return encryptedValue;
  }
};