// utils/ImagePickerHelper.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Neu: Verbessertes Berechtigungs-Handling (Handling von Limited Access)
// Update: EXIF-Daten (Datum) werden ausgelesen
// Fix: Deprecation Warnung für MediaTypeOptions behoben

import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

class ImagePickerHelper {
  /**
   * Fordert Berechtigungen an und öffnet die Galerie.
   * Berücksichtigt nun auch den "Partial Media Access" (Limited).
   * @returns {Promise<{uri: string, base64: string, timestamp: number | null} | null>} Bilddaten oder null bei Abbruch.
   */
  static async pickImageFromLibrary() {
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
      // Wir fahren trotzdem fort, der Picker zeigt dann nur die Auswahl an
    }

    // Fix: Verwende das neue Array-Format statt des veralteten MediaTypeOptions
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      quality: 0.7,
      base64: true,
      exif: true, // EXIF-Daten anfordern, um das Datum zu bekommen
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    let timestamp = null;

    // Versuchen, das Aufnahmedatum aus den EXIF-Daten zu extrahieren
    if (asset.exif && asset.exif.DateTimeOriginal) {
      // EXIF-Datum hat oft das Format "YYYY:MM:DD HH:MM:SS"
      const dateString = asset.exif.DateTimeOriginal;
      // Ersetze die ersten zwei Doppelpunkte durch Bindestriche für kompatibles Date-Parsing
      const formattedDateString = dateString.replace(":", "-").replace(":", "-");
      const parsedDate = new Date(formattedDateString);
      
      if (!isNaN(parsedDate.getTime())) {
        timestamp = parsedDate.getTime();
      }
    }

    return {
      uri: asset.uri,
      base64: asset.base64,
      timestamp: timestamp // Den extrahierten Timestamp mit zurückgeben
    };
  }
}

export default ImagePickerHelper;