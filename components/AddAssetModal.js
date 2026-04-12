// components/AddAssetModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Fix der React-Hook Dependencies (useEffect) & Stabilität durch useCallback.

import React, { useState, useEffect, useCallback } from 'react';
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
  ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { Security } from './Security';
import { Config } from '../constants/Config';
import { AppConstants } from '../constants/AppConstants';

export default function AddAssetModal({ visible, onClose, onSave }) {
  // --- State ---
  const [rows, setRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Hilfs-States für "Select-Boxen"
  const [activeRowId, setActiveRowId] = useState(null);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // --- Stabilisierte Funktionen ---

  const checkKeyStatus = useCallback(async () => {
    const key = await Security.getGeminiKey();
    setHasApiKey(!!key);
  }, []);

  const addEmptyRow = useCallback(() => {
    const newRow = {
      id: Date.now() + Math.random(),
      provider: AppConstants.PROVIDERS[0],
      value: '',
      timestamp: Date.now(),
      status: 'manual', // 'manual', 'processing', 'ai-done'
      isConfirmed: false
    };
    setRows(prev => [...prev, newRow]);
  }, []);

  const removeRow = useCallback((id) => {
    setRows(prev => {
      if (prev.length > 1) {
        return prev.filter(r => r.id !== id);
      }
      return prev;
    });
  }, []);

  const updateRow = useCallback((id, fields) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...fields } : r));
  }, []);

  const resetAndClose = useCallback(() => {
    setRows([]);
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  // --- Initialisierung ---
  useEffect(() => {
    if (visible) {
      checkKeyStatus();
      if (rows.length === 0) {
        addEmptyRow();
      }
    }
  }, [visible, checkKeyStatus, addEmptyRow, rows.length]);

  // --- KI Logik ---
  const handlePickImage = async (rowId) => {
    if (!hasApiKey) {
      setErrorMessage("Bitte API-Key in den Einstellungen hinterlegen.");
      return;
    }

    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      processImage(rowId, result.assets[0].base64);
    }
  };

  const processImage = async (rowId, base64Data) => {
    updateRow(rowId, { status: 'processing' });
    const currentRow = rows.find(r => r.id === rowId);
    const provider = currentRow ? currentRow.provider : AppConstants.PROVIDERS[0];
    
    try {
      const apiKey = await Security.getGeminiKey();
      const { BASE_URL, MODEL, ENDPOINT } = Config.GEMINI_API;
      const apiUrl = `${BASE_URL}/${MODEL}:${ENDPOINT}?key=${apiKey}`;

      const response = await fetch(apiUrl, {
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
      } else {
        throw new Error("Nichts erkannt");
      }
    } catch (error) {
      setErrorMessage("KI Fehler: " + error.message);
      updateRow(rowId, { status: 'manual' });
    }
  };

  // --- Speichern ---
  const handleSaveAll = async () => {
    setIsSubmitting(true);
    try {
      for (const row of rows) {
        const sanitized = row.value.replace(/\./g, '').replace(',', '.');
        const val = parseFloat(sanitized);
        if (!isNaN(val)) {
          await onSave(row.provider, val, row.timestamp);
        }
      }
      resetAndClose();
    } catch (error) {
      setErrorMessage("Fehler beim Speichern der Batch-Daten.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Helper Render ---
  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('de-DE');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.modalContainer}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Werte erfassen</Text>
            <TouchableOpacity onPress={resetAndClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea}>
            {rows.map((row) => (
              <View key={row.id} style={styles.rowCard}>
                <View style={styles.rowMain}>
                  <View style={styles.selectors}>
                    <TouchableOpacity 
                      style={styles.selectorBtn} 
                      onPress={() => { setActiveRowId(row.id); setShowProviderPicker(true); }}
                    >
                      <Text style={styles.selectorText} numberOfLines={1}>{row.provider}</Text>
                      <Ionicons name="chevron-down" size={14} color={Theme.colors.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.selectorBtn}
                      onPress={() => { setActiveRowId(row.id); setShowDatePicker(true); }}
                    >
                      <Text style={styles.selectorText}>{formatDate(row.timestamp)}</Text>
                      <Ionicons name="calendar-outline" size={14} color={Theme.colors.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputArea}>
                    <TextInput
                      style={[
                        styles.input,
                        row.status === 'ai-done' && styles.aiInput,
                        row.status === 'processing' && styles.loadingInput
                      ]}
                      value={row.value}
                      onChangeText={(v) => updateRow(row.id, { value: v, status: 'manual' })}
                      placeholder="0,00"
                      keyboardType="numeric"
                    />
                    
                    <TouchableOpacity 
                      style={styles.aiBtn} 
                      onPress={() => handlePickImage(row.id)}
                      disabled={row.status === 'processing'}
                    >
                      {row.status === 'processing' ? (
                        <ActivityIndicator size="small" color={Theme.colors.primary} />
                      ) : (
                        <Ionicons 
                          name="camera-outline" 
                          size={24} 
                          color={row.status === 'ai-done' ? Theme.colors.success : Theme.colors.primary} 
                        />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => removeRow(row.id)} style={styles.deleteRowBtn}>
                      <Ionicons name="trash-outline" size={20} color={Theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                {row.status === 'ai-done' && (
                  <Text style={styles.aiHint}>KI-Ergebnis – bitte prüfen!</Text>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={addEmptyRow}>
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
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveAllBtnText}>Alle Werte speichern</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* --- Sub-Modals für Selektion --- */}
        
        <Modal visible={showProviderPicker} transparent={true} animationType="fade">
          <TouchableOpacity 
            style={styles.subOverlay} 
            activeOpacity={1} 
            onPress={() => setShowProviderPicker(false)}
          >
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Anbieter wählen</Text>
              {AppConstants.PROVIDERS.map(p => (
                <TouchableOpacity 
                  key={p} 
                  style={styles.pickerItem} 
                  onPress={() => { updateRow(activeRowId, { provider: p }); setShowProviderPicker(false); }}
                >
                  <Text style={styles.pickerItemText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={showDatePicker} transparent={true} animationType="fade">
          <TouchableOpacity 
            style={styles.subOverlay} 
            activeOpacity={1} 
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Datum wählen</Text>
              {[0, 1, 2, 3, 7].map(daysBack => {
                const d = new Date();
                d.setDate(d.getDate() - daysBack);
                const label = daysBack === 0 ? "Heute" : daysBack === 1 ? "Gestern" : `${daysBack} Tage her`;
                return (
                  <TouchableOpacity 
                    key={daysBack} 
                    style={styles.pickerItem} 
                    onPress={() => { updateRow(activeRowId, { timestamp: d.getTime() }); setShowDatePicker(false); }}
                  >
                    <Text style={styles.pickerItemText}>{label} ({formatDate(d.getTime())})</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity onPress={() => setErrorMessage(null)}>
              <Ionicons name="close-circle" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Theme.colors.overlay, justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Theme.colors.background, borderTopLeftRadius: Theme.borderRadius.l, borderTopRightRadius: Theme.borderRadius.l, height: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: Theme.spacing.l, backgroundColor: Theme.colors.surface, borderTopLeftRadius: Theme.borderRadius.l, borderTopRightRadius: Theme.borderRadius.l, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, alignItems: 'center' },
  headerTitle: { fontSize: Theme.fontSize.subHeader, fontWeight: Theme.fontWeight.bold, color: Theme.colors.text },
  closeBtn: { padding: 5 },
  scrollArea: { padding: Theme.spacing.m },
  rowCard: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.m, padding: Theme.spacing.m, marginBottom: Theme.spacing.m, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  rowMain: { gap: 10 },
  selectors: { flexDirection: 'row', gap: 10 },
  selectorBtn: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Theme.colors.background, padding: 8, borderRadius: Theme.borderRadius.s, borderWidth: 1, borderColor: Theme.colors.border },
  selectorText: { fontSize: Theme.fontSize.caption, color: Theme.colors.text, fontWeight: Theme.fontWeight.medium },
  inputArea: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, backgroundColor: Theme.colors.background, padding: 10, borderRadius: Theme.borderRadius.s, fontSize: Theme.fontSize.header, fontWeight: Theme.fontWeight.bold, color: Theme.colors.text, textAlign: 'right', borderWidth: 1, borderColor: Theme.colors.border },
  aiInput: { borderColor: Theme.colors.primary, backgroundColor: '#f0f7ff' },
  loadingInput: { opacity: 0.5 },
  aiBtn: { padding: 5 },
  deleteRowBtn: { padding: 5 },
  aiHint: { fontSize: 10, color: Theme.colors.primary, marginTop: 5, fontWeight: Theme.fontWeight.semibold, textAlign: 'right' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Theme.spacing.l, gap: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: Theme.colors.border, borderRadius: Theme.borderRadius.m, marginTop: 5 },
  addBtnText: { color: Theme.colors.textSecondary, fontWeight: Theme.fontWeight.medium },
  footer: { padding: Theme.spacing.l, backgroundColor: Theme.colors.surface, borderTopWidth: 1, borderTopColor: Theme.colors.border },
  saveAllBtn: { backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center' },
  saveAllBtnText: { color: Theme.colors.white, fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.bold },
  disabledBtn: { opacity: 0.6 },
  subOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  pickerContent: { width: '80%', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.l, padding: Theme.spacing.l },
  pickerTitle: { fontSize: Theme.fontSize.subHeader, fontWeight: Theme.fontWeight.bold, marginBottom: Theme.spacing.m, textAlign: 'center' },
  pickerItem: { paddingVertical: Theme.spacing.m, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  pickerItemText: { fontSize: Theme.fontSize.body, color: Theme.colors.text, textAlign: 'center' },
  errorBanner: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: Theme.colors.error, padding: 10, borderRadius: Theme.borderRadius.m, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 9999 },
  errorText: { color: '#fff', fontSize: Theme.fontSize.caption, flex: 1 }
});