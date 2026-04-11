// AddAssetModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Wechsel auf tesseract.js für Kompatibilität mit Expo Go

import React, { useState } from 'react';
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
import Tesseract from 'tesseract.js';
import { Theme } from './Theme';

const PROVIDERS = ['C24', 'Norisbank', 'Trading 212', 'Bitget', 'Timeless'];

export default function AddAssetModal({ visible, onClose, onSave }) {
  const [step, setStep] = useState(1); 
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const resetAndClose = () => {
    setStep(1);
    setSelectedProvider(null);
    setInputValue('');
    setSelectedImage(null);
    setIsProcessing(false);
    setErrorMessage(null);
    onClose();
  };

  const handlePickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      setErrorMessage("Zugriff verweigert. Bitte in den Einstellungen erlauben.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri) => {
    setIsProcessing(true);
    setStep(4);
    
    try {
      // Tesseract Erkennung (Läuft in JS, benötigt kein natives Modul)
      const { data: { text } } = await Tesseract.recognize(
        uri,
        'deu',
        { logger: m => console.log(m) }
      );

      const detected = parseValue(text, selectedProvider);
      
      if (!detected) {
        throw new Error(`Kein Betrag für ${selectedProvider} im Screenshot gefunden.`);
      }
      
      setInputValue(detected);
    } catch (error) {
      console.error("OCR Fehler (Tesseract):", error);
      setErrorMessage("OCR konnte den Text nicht lesen. Versuche es manuell oder mit einem anderen Bild.");
      setStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseValue = (text, provider) => {
    const amountRegex = /\d{1,3}(\.\d{3})*,\d{2}/g;
    const matches = text.match(amountRegex);
    if (!matches) return null;
    const normalizedText = text.toUpperCase();

    switch (provider) {
      case 'Trading 212': if (normalizedText.includes('KONTOWERT')) return matches[0]; break;
      case 'C24': if (normalizedText.includes('SMARTKONTO')) return matches[0]; break;
      case 'Norisbank': if (normalizedText.includes('GESAMTSALDO')) return matches[0]; break;
      case 'Timeless': if (normalizedText.includes('ASSET')) return matches[0]; break;
    }
    return matches[0];
  };

  const handleSave = () => {
    const sanitizedValue = inputValue.replace(/\./g, '').replace(',', '.');
    const finalValue = parseFloat(sanitizedValue);
    
    if (isNaN(finalValue)) {
      setErrorMessage("Ungültiger Betrag. Bitte Punkt und Komma prüfen.");
      return;
    }
    
    onSave(selectedProvider, finalValue, step === 3);
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
            <Text style={styles.headerTitle}>{selectedProvider || 'Hinzufügen'}</Text>
            <TouchableOpacity onPress={resetAndClose}>
              <Text style={styles.closeBtn}>Abbrechen</Text>
            </TouchableOpacity>
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
                  <Text style={styles.methodBtnText}>📸 Screenshot einlesen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.methodBtn, styles.manualBtn]} onPress={() => setStep(3)}>
                  <Text style={styles.methodBtnText}>⌨️ Manuelle Eingabe</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.backBtn}>Zurück</Text>
                </TouchableOpacity>
              </View>
            )}

            {(step === 3 || (step === 4 && !isProcessing)) && (
              <View>
                <Text style={styles.label}>{step === 4 ? "Gelesener Betrag (bitte prüfen):" : "Betrag eingeben:"}</Text>
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
                <Text style={styles.loadingText}>Tesseract OCR arbeitet...</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: Theme.spacing.l, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  closeBtn: { color: Theme.colors.primary, fontWeight: '600' },
  scrollContent: { padding: Theme.spacing.l },
  label: { fontSize: 16, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.m },
  providerCard: { padding: Theme.spacing.m, borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.m, marginBottom: Theme.spacing.s, backgroundColor: Theme.colors.surface },
  providerText: { fontSize: 16, fontWeight: '500', color: Theme.colors.text },
  methodBtn: { backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center', marginBottom: Theme.spacing.s },
  manualBtn: { backgroundColor: Theme.colors.text },
  methodBtnText: { color: Theme.colors.white, fontSize: 16, fontWeight: '600' },
  backBtn: { textAlign: 'center', color: Theme.colors.textSecondary, marginTop: Theme.spacing.m },
  input: { borderWidth: 1, borderColor: Theme.colors.border, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, fontSize: 32, textAlign: 'center', marginBottom: Theme.spacing.l, color: Theme.colors.text },
  reviewInput: { borderColor: Theme.colors.primary, color: Theme.colors.primary, fontWeight: 'bold' },
  saveBtn: { backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center' },
  saveBtnText: { color: Theme.colors.white, fontSize: 18, fontWeight: 'bold' },
  loadingArea: { padding: 40, alignItems: 'center' },
  loadingText: { marginTop: 10, color: Theme.colors.textSecondary },
  previewImage: { width: '100%', height: 200, borderRadius: Theme.borderRadius.m, marginBottom: Theme.spacing.l, resizeMode: 'contain' },
  errorContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  errorDialog: { width: '85%', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.m, padding: Theme.spacing.l, alignItems: 'center' },
  errorTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF3B30', marginBottom: 10 },
  errorMessage: { fontSize: 16, color: Theme.colors.text, textAlign: 'center', marginBottom: 20 },
  errorBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 10, paddingHorizontal: 30, borderRadius: Theme.borderRadius.m },
  errorBtnText: { color: Theme.colors.white, fontWeight: 'bold' }
});