// AddAssetModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Upgrade auf Gemini 2.5 Flash & v1 API Endpunkt

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from './Theme';
import { Security } from './Security';

const PROVIDERS = ['C24', 'Norisbank', 'Trading 212', 'Bitget', 'Timeless'];
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000; 

export default function AddAssetModal({ visible, onClose, onSave }) {
  const [step, setStep] = useState(1); 
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const [tempApiKey, setTempApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    if (visible) {
      checkKeyStatus();
    }
  }, [visible]);

  const checkKeyStatus = async () => {
    const key = await Security.getGeminiKey();
    setHasApiKey(!!key);
    if (key) setTempApiKey(key);
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedProvider(null);
    setInputValue('');
    setSelectedImage(null);
    setIsProcessing(false);
    setRetryCount(0);
    setErrorMessage(null);
    onClose();
  };

  const handleSaveApiKey = async () => {
    if (tempApiKey.trim().length < 10) {
      setErrorMessage("Bitte einen gültigen API-Key eingeben.");
      return;
    }
    const success = await Security.setGeminiKey(tempApiKey.trim());
    if (success) {
      setHasApiKey(true);
      setStep(1);
    } else {
      setErrorMessage("Key konnte nicht gespeichert werden.");
    }
  };

  const handlePickImage = async () => {
    if (!hasApiKey) {
      setStep(5);
      return;
    }

    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      setErrorMessage("Zugriff verweigert. Bitte in den Einstellungen erlauben.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedImage(asset.uri);
      processImageWithGemini(asset.base64);
    }
  };

  const processImageWithGemini = async (base64Data) => {
    setIsProcessing(true);
    setStep(4);
    setRetryCount(0);
    
    const apiKey = await Security.getGeminiKey();
    if (!apiKey) {
      setErrorMessage("Kein API-Key gefunden.");
      setIsProcessing(false);
      return;
    }

    const performRequest = async (attempt) => {
      setRetryCount(attempt);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        // Nutzt jetzt Gemini 2.5 Flash und den stabilen v1 Endpunkt
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `Du bist ein Finanz-Experte. Analysiere diesen Screenshot von "${selectedProvider}". 
                         Extrahiere den aktuellen Gesamtsaldo. Falls kein Gesamtwert existiert, addiere alle Asset-Werte auf dem Bild. 
                         Antworte NUR mit dem Zahlenwert im Format XX.XXX,XX oder XX,XX.` },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Data
                  }
                }
              ]
            }]
          })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API Fehler ${response.status}: Bitte prüfe Modell-Verfügbarkeit.`);
        }

        const result = await response.json();
        const detectedText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        if (!detectedText) {
          throw new Error("Keine Daten im Bild erkannt.");
        }

        setInputValue(detectedText);
        setIsProcessing(false);

      } catch (error) {
        clearTimeout(timeoutId);
        console.log(`Versuch ${attempt} fehlgeschlagen:`, error.message);

        if (attempt < MAX_RETRIES && (error.name === 'AbortError' || response?.status >= 500)) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return performRequest(attempt + 1);
        } else {
          setErrorMessage(error.name === 'AbortError' 
            ? "Timeout: Die KI braucht zu lange." 
            : `Fehler: ${error.message}`);
          setIsProcessing(false);
          setStep(2);
        }
      }
    };

    performRequest(1);
  };

  const handleSave = () => {
    const sanitizedValue = inputValue.replace(/\./g, '').replace(',', '.');
    const finalValue = parseFloat(sanitizedValue);
    
    if (isNaN(finalValue)) {
      setErrorMessage("Ungültiger Betrag. Bitte prüfe die Eingabe.");
      return;
    }
    
    onSave(selectedProvider, finalValue);
    resetAndClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.modalContainer}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{selectedProvider || 'Hinzufügen'}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => setStep(5)} style={styles.settingsIcon}>
                <Text style={{fontSize: 20}}>⚙️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetAndClose}>
                <Text style={styles.closeBtn}>Abbrechen</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {step === 1 && (
              <View>
                <Text style={styles.label}>Wähle den Anbieter:</Text>
                {PROVIDERS.map(p => (
                  <TouchableOpacity key={p} style={styles.providerCard} onPress={() => { setSelectedProvider(p); setStep(2); }}>
                    <Text style={styles.providerText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={styles.label}>Eingabe für {selectedProvider}:</Text>
                <TouchableOpacity style={styles.methodBtn} onPress={handlePickImage}>
                  <Text style={styles.methodBtnText}>📸 Screenshot mit Gemini 2.5 lesen</Text>
                </TouchableOpacity>
                {!hasApiKey && <Text style={styles.hint}>⚠️ API-Key fehlt noch.</Text>}
                <TouchableOpacity style={[styles.methodBtn, styles.manualBtn]} onPress={() => setStep(3)}>
                  <Text style={styles.methodBtnText}>⌨️ Manuelle Eingabe</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.backBtn}>Zurück</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 5 && (
              <View>
                <Text style={styles.label}>Gemini API-Key Einstellungen:</Text>
                <TextInput 
                  style={styles.inputSmall}
                  value={tempApiKey}
                  onChangeText={setTempApiKey}
                  placeholder="Dein API-Key hier..."
                  secureTextEntry={true}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApiKey}>
                  <Text style={styles.saveBtnText}>Key speichern</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.backBtn}>Abbrechen</Text>
                </TouchableOpacity>
              </View>
            )}

            {(step === 3 || (step === 4 && !isProcessing)) && (
              <View>
                <Text style={styles.label}>{step === 4 ? "Gemini 2.5 hat erkannt:" : "Betrag eingeben:"}</Text>
                <TextInput 
                  style={[styles.input, step === 4 && styles.reviewInput]}
                  value={inputValue}
                  onChangeText={setInputValue}
                  keyboardType="numeric"
                  placeholder="0,00"
                  autoFocus={step === 3}
                />
                {selectedImage && step === 4 && <Image source={{ uri: selectedImage }} style={styles.previewImage} />}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Bestätigen & Speichern</Text>
                </TouchableOpacity>
              </View>
            )}

            {isProcessing && (
              <View style={styles.loadingArea}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>
                  Gemini 2.5 analysiert... {retryCount > 1 ? `(Versuch ${retryCount})` : ''}
                </Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <View style={styles.errorDialog}>
              <Text style={styles.errorTitle}>Fehler</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
              <TouchableOpacity style={styles.errorBtn} onPress={() => setErrorMessage(null)}>
                <Text style={styles.errorBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Theme.colors.surface, borderTopLeftRadius: Theme.borderRadius.l, borderTopRightRadius: Theme.borderRadius.l, minHeight: '50%', maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: Theme.spacing.l, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, alignItems: 'center' },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  settingsIcon: { marginRight: 15 },
  closeBtn: { color: Theme.colors.primary, fontWeight: '600' },
  scrollContent: { padding: Theme.spacing.l },
  label: { fontSize: 16, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.m },
  providerCard: { padding: Theme.spacing.m, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.m, marginBottom: Theme.spacing.s, backgroundColor: Theme.colors.surface },
  providerText: { fontSize: 16, fontWeight: '500', color: Theme.colors.text },
  methodBtn: { backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center', marginBottom: Theme.spacing.s },
  manualBtn: { backgroundColor: Theme.colors.text },
  methodBtnText: { color: Theme.colors.white, fontSize: 16, fontWeight: '600' },
  hint: { color: '#FF9500', textAlign: 'center', marginBottom: 10, fontSize: 12 },
  backBtn: { textAlign: 'center', color: Theme.colors.textSecondary, marginTop: Theme.spacing.m },
  input: { borderWidth: 1, borderColor: Theme.colors.border, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, fontSize: 32, textAlign: 'center', marginBottom: Theme.spacing.l, color: Theme.colors.text },
  inputSmall: { borderWidth: 1, borderColor: Theme.colors.border, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, fontSize: 16, marginBottom: Theme.spacing.l, color: Theme.colors.text },
  reviewInput: { borderColor: Theme.colors.primary, color: Theme.colors.primary, fontWeight: 'bold' },
  saveBtn: { backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center' },
  saveBtnText: { color: Theme.colors.white, fontSize: 18, fontWeight: 'bold' },
  loadingArea: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: Theme.colors.textSecondary, textAlign: 'center' },
  previewImage: { width: '100%', height: 200, borderRadius: Theme.borderRadius.m, marginBottom: Theme.spacing.l, resizeMode: 'contain' },
  errorContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  errorDialog: { width: '85%', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.m, padding: Theme.spacing.l, alignItems: 'center' },
  errorTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF3B30', marginBottom: 10 },
  errorMessage: { fontSize: 16, color: Theme.colors.text, textAlign: 'center', marginBottom: 20 },
  errorBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 10, paddingHorizontal: 30, borderRadius: Theme.borderRadius.m },
  errorBtnText: { color: Theme.colors.white, fontWeight: 'bold' }
});