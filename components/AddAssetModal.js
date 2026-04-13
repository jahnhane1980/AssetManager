// components/AddAssetModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Umstellung auf globales Notification-System

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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { Security } from './Security';
import { Config } from '../constants/Config';
import { AppConstants } from '../constants/AppConstants';

export default function AddAssetModal({ visible, onClose, onSave }) {
  const [rows, setRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const [activeRowId, setActiveRowId] = useState(null);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showNativePicker, setShowNativePicker] = useState(false);

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
      status: 'manual', 
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
    onClose();
  }, [onClose]);

  const handleNativeDateChange = (event, selectedDate) => {
    setShowNativePicker(false);
    if (selectedDate && activeRowId) {
      updateRow(activeRowId, { timestamp: selectedDate.getTime() });
      setShowDatePickerModal(false);
    }
  };

  useEffect(() => {
    if (visible) {
      checkKeyStatus();
      if (rows.length === 0) {
        addEmptyRow();
      }
    }
  }, [visible, checkKeyStatus, addEmptyRow, rows.length]);

  const handlePickImage = async (rowId) => {
    if (!hasApiKey) {
      global.notify("API-Key in Einstellungen fehlt", "error");
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
      updateRow(rowId, { status: 'manual' });
    }
  };

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
      global.notify("Batch-Speichern fehlgeschlagen", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                      onPress={() => { setActiveRowId(row.id); setShowDatePickerModal(true); }}
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

        {/* --- Sub-Modals --- */}
        
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

        <Modal visible={showDatePickerModal} transparent={true} animationType="fade">
          <TouchableOpacity 
            style={styles.subOverlay} 
            activeOpacity={1} 
            onPress={() => setShowDatePickerModal(false)}
          >
            <View style={styles.pickerContent}>
              <Text style={styles.pickerTitle}>Datum wählen</Text>
              
              <View style={styles.quickSelectRow}>
                {[0, 1].map(daysBack => {
                  const d = new Date();
                  d.setDate(d.getDate() - daysBack);
                  const label = daysBack === 0 ? "Heute" : "Gestern";
                  return (
                    <TouchableOpacity 
                      key={daysBack} 
                      style={styles.quickBtn} 
                      onPress={() => { updateRow(activeRowId, { timestamp: d.getTime() }); setShowDatePickerModal(false); }}
                    >
                      <Text style={styles.quickBtnText}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.divider} />

              <TouchableOpacity 
                style={styles.fullWidthBtn} 
                onPress={() => setShowNativePicker(true)}
              >
                <Ionicons name="calendar" size={20} color={Theme.colors.primary} />
                <Text style={styles.fullWidthBtnText}>Anderes Datum wählen</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

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
  pickerContent: { width: '85%', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.l, padding: Theme.spacing.l },
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