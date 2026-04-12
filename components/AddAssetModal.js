// AddAssetModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Emojis durch Ionicons ersetzt, Header bereinigt

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
import { Ionicons } from '@expo/vector-icons'; // Neu: Icons importieren
import { Theme } from './Theme';
import { Security } from './Security';
import { Config } from '../constants/Config';
import { AppConstants } from '../constants/AppConstants';

export default function AddAssetModal({ visible, onClose, onSave }) {
  const [step, setStep] = useState(1); 
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    if (visible) {
      checkKeyStatus();
    }
  }, [visible]);

  const checkKeyStatus = async () => {
    const key = await Security.getGeminiKey();
    setHasApiKey(!!key);
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

  const handlePickImage = async () => {
    if (!hasApiKey) {
      setErrorMessage("Bitte hinterlege zuerst deinen API-Key im Menü unter 'Einstellungen'.");
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
    const performRequest = async (attempt) => {
      setRetryCount(attempt);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AppConstants.AI_PROCESSING.TIMEOUT_MS);

      try {
        const { BASE_URL, MODEL, ENDPOINT } = Config.GEMINI_API;
        const apiUrl = `${BASE_URL}/${MODEL}:${ENDPOINT}?key=${apiKey}`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: AppConstants.PROMPTS.ASSET_EXTRACTION(selectedProvider) },
                { inline_data: { mime_type: "image/jpeg", data: base64Data } }
              ]
            }]
          })
        });

        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`API Fehler ${response.status}`);

        const result = await response.json();
        const detectedText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!detectedText) throw new Error("Keine Daten erkannt.");

        setInputValue(detectedText);
        setIsProcessing(false);
      } catch (error) {
        clearTimeout(timeoutId);
        if (attempt < AppConstants.AI_PROCESSING.MAX_RETRIES && error.name === 'AbortError') {
          return performRequest(attempt + 1);
        } else {
          setErrorMessage(error.message);
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
      setErrorMessage("Ungültiger Betrag.");
      return;
    }
    onSave(selectedProvider, finalValue);
    resetAndClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{selectedProvider || 'Hinzufügen'}</Text>
            {/* Abbrechen jetzt als reiner Text oder Icon */}
            <TouchableOpacity onPress={resetAndClose} style={styles.closeBtnContainer}>
              <Ionicons name="close" size={24} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {step === 1 && (
              <View>
                <Text style={styles.label}>Anbieter wählen:</Text>
                {AppConstants.PROVIDERS.map(p => (
                  <TouchableOpacity key={p} style={styles.providerCard} onPress={() => { setSelectedProvider(p); setStep(2); }}>
                    <Text style={styles.providerText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={styles.label}>Eingabe für {selectedProvider}:</Text>
                
                {/* Method Buttons mit Ionicons statt Emojis */}
                <TouchableOpacity style={styles.methodBtn} onPress={handlePickImage}>
                  <Ionicons name="camera-outline" size={20} color={Theme.colors.white} style={styles.methodIcon} />
                  <Text style={styles.methodBtnText}>Screenshot analysieren</Text>
                </TouchableOpacity>
                
                {!hasApiKey && (
                  <View style={styles.hintContainer}>
                    <Ionicons name="warning-outline" size={16} color="#FF3B30" style={{marginRight: 5}} />
                    <Text style={styles.hint}>API-Key fehlt! (Siehe App-Menü)</Text>
                  </View>
                )}
                
                <TouchableOpacity style={[styles.methodBtn, styles.manualBtn]} onPress={() => setStep(3)}>
                  <Ionicons name="keypad-outline" size={20} color={Theme.colors.white} style={styles.methodIcon} />
                  <Text style={styles.methodBtnText}>Manuelle Eingabe</Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtnContainer}>
                   <Ionicons name="arrow-back" size={16} color={Theme.colors.textSecondary} style={{marginRight: 5}} />
                   <Text style={styles.backBtnText}>Zurück</Text>
                </TouchableOpacity>
              </View>
            )}

            {(step === 3 || (step === 4 && !isProcessing)) && (
              <View>
                <Text style={styles.label}>{step === 4 ? "KI-Ergebnis:" : "Betrag:"}</Text>
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
                  <Text style={styles.saveBtnText}>Speichern</Text>
                </TouchableOpacity>
              </View>
            )}

            {isProcessing && (
              <View style={styles.loadingArea}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
                <Text style={styles.loadingText}>Analysiere Bild...</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <View style={styles.errorDialog}>
              <View style={styles.errorHeader}>
                 <Ionicons name="information-circle-outline" size={24} color={Theme.colors.text} style={{marginRight: 10}} />
                 <Text style={styles.errorTitle}>Hinweis</Text>
              </View>
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
  modalContainer: { backgroundColor: Theme.colors.surface, borderTopLeftRadius: Theme.borderRadius.l, borderTopRightRadius: Theme.borderRadius.l, minHeight: '40%', maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: Theme.spacing.l, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  closeBtnContainer: { padding: 5 },
  scrollContent: { padding: Theme.spacing.l },
  label: { fontSize: 16, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.m },
  providerCard: { padding: Theme.spacing.m, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.m, marginBottom: Theme.spacing.s },
  providerText: { fontSize: 16, fontWeight: '500', color: Theme.colors.text },
  methodBtn: { flexDirection: 'row', backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.s },
  methodIcon: { marginRight: 10 },
  manualBtn: { backgroundColor: Theme.colors.text },
  methodBtnText: { color: Theme.colors.white, fontSize: 16, fontWeight: '600' },
  hintContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  hint: { color: '#FF3B30', fontSize: 12, fontWeight: 'bold' },
  backBtnContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Theme.spacing.m },
  backBtnText: { color: Theme.colors.textSecondary },
  input: { borderWidth: 1, borderColor: Theme.colors.border, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, fontSize: 32, textAlign: 'center', marginBottom: Theme.spacing.l, color: Theme.colors.text },
  reviewInput: { borderColor: Theme.colors.primary, color: Theme.colors.primary, fontWeight: 'bold' },
  saveBtn: { backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center' },
  saveBtnText: { color: Theme.colors.white, fontSize: 18, fontWeight: 'bold' },
  loadingArea: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: Theme.colors.textSecondary },
  previewImage: { width: '100%', height: 180, borderRadius: Theme.borderRadius.m, marginBottom: Theme.spacing.l, resizeMode: 'contain' },
  errorContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  errorDialog: { width: '80%', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.m, padding: Theme.spacing.l, alignItems: 'center' },
  errorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  errorTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  errorMessage: { fontSize: 16, color: Theme.colors.textSecondary, textAlign: 'center', marginBottom: 20 },
  errorBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 10, paddingHorizontal: 30, borderRadius: Theme.borderRadius.m },
  errorBtnText: { color: Theme.colors.white, fontWeight: 'bold' }
});