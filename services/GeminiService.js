// services/GeminiService.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Neu: Kapselung der KI-Netzwerkkommunikation

import { Security } from '../components/Security';
import { Config } from '../constants/Config';
import { AppConstants } from '../constants/AppConstants';

class GeminiService {
  static async analyzeImage(base64Data, provider) {
    try {
      const apiKey = await Security.getGeminiKey();
      if (!apiKey) {
        throw new Error("API-Key fehlt");
      }

      const apiUrl = `${Config.GEMINI_API.BASE_URL}/${Config.GEMINI_API.MODEL}:${Config.GEMINI_API.ENDPOINT}?key=${apiKey}`;
      const promptText = AppConstants.PROMPTS.ASSET_EXTRACTION(provider);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: promptText },
              { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Netzwerkfehler: ${response.status}`);
      }

      const result = await response.json();
      const detectedText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      return detectedText;
    } catch (error) {
      console.error("GeminiService Fehler:", error);
      throw error;
    }
  }
}

export default GeminiService;