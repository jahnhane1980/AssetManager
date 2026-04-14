// utils/ImagePickerHelper.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Neu: Hilfsfunktionen für die Bildauswahl aus der Galerie

import * as ImagePicker from 'expo-image-picker';

class ImagePickerHelper {
  /**
   * Fordert Berechtigungen an und öffnet die Galerie.
   * @returns {Promise<{uri: string, base64: string} | null>} Bilddaten oder null bei Abbruch.
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
    });

    if (result.canceled) {
      return null;
    }

    return {
      uri: result.assets[0].uri,
      base64: result.assets[0].base64
    };
  }
}

export default ImagePickerHelper;