// utils/ImagePickerHelper.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Neu: Hilfsfunktionen für die Bildauswahl aus der Galerie
// Update: EXIF-Daten (Datum) werden ausgelesen

import * as ImagePicker from 'expo-image-picker';

class ImagePickerHelper {
  /**
   * Fordert Berechtigungen an und öffnet die Galerie.
   * @returns {Promise<{uri: string, base64: string, timestamp: number | null} | null>} Bilddaten oder null bei Abbruch.
   */
  static async pickImageFromLibrary() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      throw new Error("Berechtigung verweigert");
    }

    const mediaTypesValue = (ImagePicker.MediaType && ImagePicker.MediaType.Images)
      ? ImagePicker.MediaType.Images 
      : ImagePicker.MediaTypeOptions.Images;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaTypesValue,
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