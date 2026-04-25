// utils/ImagePickerHelper.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Neu: Nutzung von 'exifr' um das originale Aufnahmedatum (Android Cache-Problem) zu retten.
// Update: Fallback auf Datei-Datum, falls kein EXIF vorhanden ist.

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Linking, Platform } from 'react-native';
import exifr from 'exifr';

class ImagePickerHelper {
  /**
   * Fordert Berechtigungen an und öffnet die Galerie bzw. den Dateimanager.
   * Berücksichtigt Plattform-Unterschiede (Android: DocumentPicker, iOS: ImagePicker).
   * @returns {Promise<{uri: string, base64: string, timestamp: number | null} | null>} Bilddaten oder null bei Abbruch.
   */
  static async pickImageFromLibrary() {
    if (Platform.OS === 'android') {
      // ==========================================
      // ANDROID LOGIK: DocumentPicker + exifr
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

        // 1. Base64-String generieren
        base64Data = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // 2. Echtes Aufnahmedatum via exifr auslesen (löst das Cache-Kopier-Problem)
        try {
          // exifr kann in React Native direkt mit der lokalen file:// URI arbeiten
          const exifData = await exifr.parse(asset.uri, { pick: ['DateTimeOriginal'] });
          
          if (exifData && exifData.DateTimeOriginal) {
            const parsedDate = new Date(exifData.DateTimeOriginal);
            if (!isNaN(parsedDate.getTime())) {
              timestamp = parsedDate.getTime();
            }
          }
        } catch (exifError) {
          console.log("EXIF-Info: Keine Daten gefunden oder Fehler beim Lesen.", exifError);
        }

        // 3. Fallback: Falls kein EXIF vorhanden (z.B. Screenshots), Cache-Datum nutzen
        if (!timestamp) {
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          if (fileInfo.exists && fileInfo.modificationTime) {
            // modificationTime ist in Sekunden, wir brauchen Millisekunden
            timestamp = fileInfo.modificationTime * 1000;
          }
        }

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