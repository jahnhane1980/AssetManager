// Security.js
// Regel 6: Vollständiger Dateiinhalt
// Regel 7: Fokus auf Struktur und Lesbarkeit
// Refactoring: Management der Seitengröße für Pagination hinzugefügt

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Config } from '../constants/Config';

const {
  MASTER_KEY,
  GEMINI_KEY,
  PAGE_SIZE
} = Config.STORAGE_KEYS;

export const Security = {
  /**
   * Holt den Master-Key aus dem SecureStore oder generiert einen neuen.
   */
  getOrCreateMasterKey: async () => {
    try {
      let key = await SecureStore.getItemAsync(MASTER_KEY);

      if (!key) {
        console.log("Generiere neuen Master-Key...");
        key = Crypto.randomUUID();
        await SecureStore.setItemAsync(MASTER_KEY, key, {
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
      await SecureStore.setItemAsync(GEMINI_KEY, apiKey, {
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
      return await SecureStore.getItemAsync(GEMINI_KEY);
    } catch (error) {
      console.error("Fehler beim Laden des Gemini Keys:", error);
      return null;
    }
  },

  /**
   * Speichert die gewünschte Seitengröße für Listen.
   */
  setPageSize: async (size) => {
    try {
      await SecureStore.setItemAsync(PAGE_SIZE, size.toString());
      return true;
    } catch (error) {
      console.error("Fehler beim Speichern der Seitengröße:", error);
      return false;
    }
  },

  /**
   * Holt die Seitengröße oder liefert den Standardwert zurück.
   */
  getPageSize: async () => {
    try {
      const size = await SecureStore.getItemAsync(PAGE_SIZE);
      return size ? parseInt(size, 10) : Config.PAGINATION.DEFAULT_PAGE_SIZE;
    } catch (error) {
      console.error("Fehler beim Laden der Seitengröße:", error);
      return Config.PAGINATION.DEFAULT_PAGE_SIZE;
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