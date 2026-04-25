// utils/ImagePickerHelper.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Neu: Hybrid-Lösung. iOS nutzt ImagePicker, Android nutzt DocumentPicker.
// Update: Nutzung der Legacy-API für Expo FileSystem (Kompatibilität mit SDK 54).

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Linking, Platform } from 'react-native';

class ImagePickerHelper {
  /**
   * Fordert Berechtigungen an und öffnet die Galerie bzw. den Dateimanager.
   * Berücksichtigt Plattform-Unterschiede (Android: DocumentPicker, iOS: ImagePicker).
   * @returns {Promise<{uri: string, base64: string, timestamp: number | null} | null>} Bilddaten oder null bei Abbruch.
   */
  static async pickImageFromLibrary() {
    if (Platform.OS === 'android') {
      // ==========================================
      // ANDROID LOGIK: DocumentPicker
      // ==========================================
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'image/*',
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          return null;
        }

        const asset = result.assets[0];
        let timestamp = null;
        let base64Data = null;

        // 1. Datei-Infos auslesen (für den Timestamp)
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (fileInfo.exists && fileInfo.modificationTime) {
          // modificationTime ist in Sekunden, wir brauchen Millisekunden
          timestamp = fileInfo.modificationTime * 1000;
        }

        // 2. Base64-String generieren (Da DocumentPicker das nicht automatisch macht)
        base64Data = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        return {
          uri: asset.uri,
          base64: base64Data,
          timestamp: timestamp
        };
      } catch (error) {
        console.error("Fehler beim DocumentPicker:", error);
        return null;
      }

    } else {
      // ==========================================
      // IOS LOGIK: ImagePicker (mit Berechtigungs-Handling)
      // ==========================================
      
      // 1. Aktuellen Status prüfen
      const permissionResponse = await ImagePicker.getMediaLibraryPermissionsAsync();
      let { status, canAskAgain } = permissionResponse;

      // 2. Falls noch nicht gefragt wurde oder Zugriff verweigert ist, neu anfordern
      if (status === 'undetermined' || (status === 'denied' && canAskAgain)) {
        const request = await ImagePicker.requestMediaLibraryPermissionsAsync();
        status = request.status;
      }

      // 3. Handling der verschiedenen Status-Ergebnisse
      if (status === 'denied') {
        Alert.alert(
          "Berechtigung benötigt",
          "Der Zugriff auf die Galerie wurde verweigert. Bitte aktiviere ihn in den Einstellungen, um Bilder hochzuladen.",
          [
            { text: "Abbrechen", style: "cancel" },
            { text: "Einstellungen", onPress: () => Linking.openSettings() }
          ]
        );
        return null;
      }

      if (status === 'limited') {
        // Hinweis, dass nur ausgewählte Bilder sichtbar sind (Partial Media Access)
        Alert.alert(
          "Eingeschränkter Zugriff",
          "Du hast der App nur Zugriff auf ausgewählte Bilder gewährt. Möchtest du alle Bilder und Ordner sehen, musst du in den Einstellungen den 'Vollen Zugriff' erlauben.",
          [
            { text: "OK", style: "default" },
            { text: "Einstellungen", onPress: () => Linking.openSettings() }
          ]
        );
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], 
        quality: 0.7,
        base64: true,
        exif: true,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      let timestamp = null;

      // Versuchen, das Aufnahmedatum aus den EXIF-Daten zu extrahieren
      if (asset.exif && asset.exif.DateTimeOriginal) {
        const dateString = asset.exif.DateTimeOriginal;
        const formattedDateString = dateString.replace(":", "-").replace(":", "-");
        const parsedDate = new Date(formattedDateString);
        
        if (!isNaN(parsedDate.getTime())) {
          timestamp = parsedDate.getTime();
        }
      }

      return {
        uri: asset.uri,
        base64: asset.base64,
        timestamp: timestamp
      };
    }
  }
}

export default ImagePickerHelper;