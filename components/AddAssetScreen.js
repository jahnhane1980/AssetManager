// components/AddAssetScreen.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fix: AppConstants.PROVIDERS für die Liste wiederhergestellt, 
// Fix: Zweistufiger Datumswähler (Heute/Gestern + Nativ) inkl. korrekter Vorbelegung eingebaut
// Refactoring: Navigation-Screen Logik mit der stabilen Modal-Logik vereint

import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { Security } from './Security';
import { Config } from '../constants/Config';
import { AppConstants } from '../constants/AppConstants';
import AssetRepository from '../repositories/AssetRepository';
import ImagePreviewModal from './ImagePreviewModal';
import AssetInputRow from './AssetInputRow';

export default function AddAssetScreen({ navigation, route }) {
  const { initialProvider } = route.params || {};

  const [rows, setRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // UI States für Preview
  const [previewRow, setPreviewRow] = useState(null);
  const [tempAmount, setTempAmount] = useState('');
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);

  // UI States für Picker
  const [activeRowId, setActiveRowId] = useState(null);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showNativePicker, setShowNativePicker] = useState(false);

  const checkKeyStatus = useCallback(async () => {
    const key = await Security.getGeminiKey();
    setHasApiKey(!!key);
  }, []);

  const addEmptyRow = useCallback((providerOverride = null) => {
    const newRow = {
      id: Date.now() + Math.random(),
      provider: providerOverride || AppConstants.PROVIDERS[0],
      value: '',
      timestamp: Date.now(),
      status: 'manual', 
      isConfirmed: false,
      imageUri: null
    };
    setRows(prev => [...prev, newRow]);
  }, []);

  const removeRow = useCallback((id) => {
    setRows(prev => (prev.length > 1 ? prev.filter(r => r.id !== id) : prev));
  }, []);

  const updateRow = useCallback((id, fields) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...fields } : r));
  }, []);

  useEffect(() => {
    checkKeyStatus();
    // Wenn die Liste leer ist, initiieren wir die erste Zeile (ggf. mit initialProvider)
    if (rows.length === 0) {
      addEmptyRow(initialProvider); 
    }
  }, [checkKeyStatus, addEmptyRow, rows.length, initialProvider]);

  // --- Datum Logik ---
  const handleNativeDateChange = (event, selectedDate) => {
    setShowNativePicker(false);
    if (selectedDate && activeRowId) {
      updateRow(activeRowId, { timestamp: selectedDate.getTime() });
      setShowDatePickerModal(false);
    }
  };

  // --- KI & Kamera Logik ---
  const handlePickImage = async (rowId) => {
    if (!hasApiKey) {
      global.notify("API-Key fehlt", "error");
      return;
    }
    
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        global.notify("Berechtigung verweigert", "error");
        return;
      }

      const mediaTypesValue = (ImagePicker.MediaType && ImagePicker.MediaType.Images)
        ? ImagePicker.MediaType.Images 
        : ImagePicker.MediaTypeOptions.Images;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypesValue,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        updateRow(rowId, { imageUri: uri });
        processImage(rowId, result.assets[0].base64);
      }
    } catch (error) {
      console.error("Fehler beim Öffnen der Galerie:", error);
      global.notify("Galerie-Fehler", "error");
    }
  };

  const processImage = async (rowId, base64Data) => {
    updateRow(rowId, { status: 'processing' });
    const currentRow = rows.find(r => r.id === rowId);
    const provider = currentRow ? currentRow.provider : AppConstants.PROVIDERS[0];
    
    try {
      const apiKey = await Security.getGeminiKey();
      const apiUrl = `${Config.GEMINI_API.BASE_URL}/${Config.GEMINI_API.MODEL}:${Config.GEMINI_API.ENDPOINT}?key=${apiKey}`;

      const response = await fetch(apiKey ? apiUrl : '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: AppConstants.PROMPTS.ASSET_EXTRACTION(provider) },
              { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
          }]
        })
      });

      const result = await response.json();
      const detectedText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      
      if (detectedText) {
        updateRow(rowId, { value: detectedText, status: 'ai-done' });
        global.notify("KI-Analyse erfolgreich", "success");
      } else {
        throw new Error("Nichts erkannt");
      }
    } catch (error) {
      global.notify("KI Fehler: " + error.message, "error");
      updateRow(rowId, { status: 'ai-error' });
    }
  };

  // --- Speichern ---
  const handleSaveAll = async () => {
    setIsSubmitting(true);
    let savedCount = 0;
    try {
      for (const row of rows) {
        const sanitized = row.value.replace(/\./g, '').replace(',', '.');
        const val = parseFloat(sanitized);
        if (!isNaN(val)) {
          await AssetRepository.saveAsset(row.provider, val, row.timestamp);
          savedCount++;
        }
      }
      if (savedCount > 0) {
        global.notify(`${savedCount} Werte gespeichert`, "success");
        navigation.goBack(); // Zurück zum HomeScreen
      } else {
        global.notify("Keine gültigen Werte zum Speichern", "error");
      }
    } catch (error) {
      global.notify("Speichern fehlgeschlagen", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Preview Logik ---
  const formatDate = (ts) => new Date(ts).toLocaleDateString('de-DE');

  const openPreview = (row) => {
    setPreviewRow(row);
    setTempAmount(row.value);
    setShowSuccessFeedback(false);
  };

  const handlePreviewBlur = () => {
    if (previewRow && tempAmount !== previewRow.value) {
      updateRow(previewRow.id, { value: tempAmount, status: 'manual' });
      setShowSuccessFeedback(true);
      setTimeout(() => setShowSuccessFeedback(false), 1500);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardContainer}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Werte erfassen</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollArea}>
          {rows.map((row) => (
            <AssetInputRow 
              key={row.id}
              row={row}
              formattedDate={formatDate(row.timestamp)}
              onProviderPress={() => { setActiveRowId(row.id); setShowProviderPicker(true); }}
              onDatePress={() => { setActiveRowId(row.id); setShowDatePickerModal(true); }}
              onValueChange={(v) => updateRow(row.id, { value: v, status: 'manual' })}
              onPickImage={() => handlePickImage(row.id)}
              onRemove={() => removeRow(row.id)}
              onPreviewPress={() => openPreview(row)}
            />
          ))}

          <TouchableOpacity style={styles.addBtn} onPress={() => addEmptyRow(null)}>
            <Ionicons name="add-circle-outline" size={24} color={Theme.colors.textSecondary} />
            <Text style={styles.addBtnText}>Weiteren Provider hinzufügen</Text>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveAllBtn, isSubmitting && styles.disabledBtn]} 
            onPress={handleSaveAll}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveAllBtnText}>Alle Werte speichern</Text>}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      <ImagePreviewModal 
        visible={!!previewRow}
        imageUri={previewRow?.imageUri}
        amount={tempAmount}
        onAmountChange={setTempAmount}
        onBlur={handlePreviewBlur}
        onClose={() => setPreviewRow(null)}
        showFeedback={showSuccessFeedback}
      />

      {/* --- Provider Picker Modal --- */}
      {showProviderPicker && (
        <View style={styles.subOverlayContainer}>
          <TouchableOpacity style={styles.subOverlayBackdrop} activeOpacity={1} onPress={() => setShowProviderPicker(false)} />
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Anbieter wählen</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {AppConstants.PROVIDERS.map(p => (
                <TouchableOpacity key={p} style={styles.pickerItem} onPress={() => { updateRow(activeRowId, { provider: p }); setShowProviderPicker(false); }}>
                  <Text style={styles.pickerItemText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* --- Date Picker Dialog --- */}
      {showDatePickerModal && (
        <View style={styles.subOverlayContainer}>
          <TouchableOpacity style={styles.subOverlayBackdrop} activeOpacity={1} onPress={() => setShowDatePickerModal(false)} />
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>Datum wählen</Text>
            <View style={styles.quickSelectRow}>
              {[0, 1].map(daysBack => {
                const d = new Date();
                d.setDate(d.getDate() - daysBack);
                const label = daysBack === 0 ? "Heute" : "Gestern";
                return (
                  <TouchableOpacity key={daysBack} style={styles.quickBtn} onPress={() => { updateRow(activeRowId, { timestamp: d.getTime() }); setShowDatePickerModal(false); }}>
                    <Text style={styles.quickBtnText}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.fullWidthBtn} onPress={() => setShowNativePicker(true)}>
              <Ionicons name="calendar" size={20} color={Theme.colors.primary} />
              <Text style={styles.fullWidthBtnText}>Anderes Datum wählen</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* --- Native Date Picker --- */}
      {showNativePicker && (
        <DateTimePicker
          value={activeRowId ? new Date(rows.find(r => r.id === activeRowId).timestamp) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleNativeDateChange}
          maximumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  keyboardContainer: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: Theme.spacing.l, paddingTop: Platform.OS === 'ios' ? 60 : 20, backgroundColor: Theme.colors.surface, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, alignItems: 'center' },
  headerTitle: { fontSize: Theme.fontSize.subHeader, fontWeight: Theme.fontWeight.bold, color: Theme.colors.text },
  closeBtn: { padding: 5 },
  scrollArea: { padding: Theme.spacing.m, flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Theme.spacing.l, gap: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.m, marginTop: 5 },
  addBtnText: { color: Theme.colors.textSecondary, fontWeight: Theme.fontWeight.medium },
  footer: { padding: Theme.spacing.l, paddingBottom: Platform.OS === 'ios' ? 40 : Theme.spacing.l, backgroundColor: Theme.colors.surface, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  saveAllBtn: { backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center' },
  saveAllBtnText: { color: Theme.colors.white, fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.bold },
  disabledBtn: { opacity: 0.6 },
  
  // Picker Styles aus dem alten Modal
  subOverlayContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 110 },
  subOverlayBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerContent: { width: '85%', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.l, padding: Theme.spacing.l, elevation: 5 },
  pickerTitle: { fontSize: Theme.fontSize.subHeader, fontWeight: Theme.fontWeight.bold, marginBottom: Theme.spacing.l, textAlign: 'center' },
  quickSelectRow: { flexDirection: 'row', gap: 10, marginBottom: Theme.spacing.m },
  quickBtn: { flex: 1, backgroundColor: Theme.colors.background, padding: 12, borderRadius: Theme.borderRadius.m, alignItems: 'center', borderWidth: 1, borderColor: Theme.colors.border },
  quickBtnText: { fontWeight: Theme.fontWeight.semibold, color: Theme.colors.primary },
  divider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: Theme.spacing.m },
  fullWidthBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12, backgroundColor: Theme.colors.background, borderRadius: Theme.borderRadius.m, borderWidth: 1, borderColor: Theme.colors.border },
  fullWidthBtnText: { color: Theme.colors.primary, fontWeight: Theme.fontWeight.semibold },
  pickerItem: { paddingVertical: Theme.spacing.m, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  pickerItemText: { fontSize: Theme.fontSize.body, color: Theme.colors.text, textAlign: 'center' }
});