// Security.js
// Regel 6: Vollständiger Dateiinhalt
// Regel 7: Fokus auf Struktur und Lesbarkeit

import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const MASTER_KEY_ID = 'user_master_key_v1';

export const Security = {
  /**
   * Holt den Master-Key aus dem SecureStore oder generiert einen neuen.
   */
  getOrCreateMasterKey: async () => {
    try {
      let key = await SecureStore.getItemAsync(MASTER_KEY_ID);
      
      if (!key) {
        console.log("Generiere neuen Master-Key...");
        // Erzeuge eine zufällige Byte-Folge als Hex-String
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
   * Ein einfacher Platzhalter für die Verschlüsselung eines Wertes.
   * In einer finalen App würde hier crypto-js oder ähnliches genutzt.
   */
  encryptValue: (value, key) => {
    // Hier würde die echte Verschlüsselung stattfinden
    return value; 
  },

  decryptValue: (encryptedValue, key) => {
    // Hier würde die Entschlüsselung stattfinden
    return encryptedValue;
  }
};