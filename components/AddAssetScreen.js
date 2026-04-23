// components/AddAssetScreen.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: UI-Komponente FormFooter ausgelagert
// Update: Bild-Datum (timestamp) wird bei der Auswahl übernommen, falls vorhanden

import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { Security } from './Security';
import { AppConstants } from '../constants/AppConstants';
import AssetRepository from '../repositories/AssetRepository';
import ImagePreviewModal from './ImagePreviewModal';
import AssetInputRow from './AssetInputRow';
import ScreenHeader from './ScreenHeader';
import FormFooter from './FormFooter'; 
import ProviderPickerModal from './ProviderPickerModal';
import DatePickerModal from './DatePickerModal';

import GeminiService from '../services/GeminiService';
import ImagePickerHelper from '../utils/ImagePickerHelper';
import { useAssetForm } from '../hooks/useAssetForm';

export default function AddAssetScreen({ navigation, route }) {
  const { initialProvider } = route.params || {};
  const { rows, addRow, removeRow, updateRow } = useAssetForm();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  const [previewRow, setPreviewRow] = useState(null);
  const [tempAmount, setTempAmount] = useState('');
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);

  const [activeRowId, setActiveRowId] = useState(null);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showNativePicker, setShowNativePicker] = useState(false);

  const checkKeyStatus = useCallback(async () => {
    const key = await Security.getGeminiKey();
    setHasApiKey(!!key);
  }, []);

  useEffect(() => {
    checkKeyStatus();
    if (rows.length === 0) {
      addRow(initialProvider); 
    }
  }, [checkKeyStatus, addRow, rows.length, initialProvider]);

  const handleNativeDateChange = (event, selectedDate) => {
    setShowNativePicker(false);
    if (selectedDate && activeRowId) {
      updateRow(activeRowId, { timestamp: selectedDate.getTime() });
      setShowDatePickerModal(false);
    }
  };

  const handlePickImage = async (rowId) => {
    if (!hasApiKey) {
      global.notify("API-Key fehlt", "error");
      return;
    }
    
    try {
      const imageData = await ImagePickerHelper.pickImageFromLibrary();
      if (imageData) {
        // Wenn ein Timestamp im Bild gefunden wurde, diesen auch aktualisieren
        const updateData = { imageUri: imageData.uri };
        if (imageData.timestamp) {
          updateData.timestamp = imageData.timestamp;
        }
        
        updateRow(rowId, updateData);
        processImage(rowId, imageData.base64);
      }
    } catch (error) {
      global.notify(error.message, "error");
    }
  };

  const processImage = async (rowId, base64Data) => {
    updateRow(rowId, { status: 'processing' });
    const currentRow = rows.find(r => r.id === rowId);
    const provider = currentRow ? currentRow.provider : AppConstants.PROVIDERS[0];
    
    try {
      const detectedText = await GeminiService.analyzeImage(base64Data, provider);
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
        navigation.goBack(); 
      } else {
        global.notify("Keine gültigen Werte zum Speichern", "error");
      }
    } catch (error) {
      global.notify("Speichern fehlgeschlagen", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        
        <ScreenHeader 
          title="Werte erfassen" 
          onClose={() => navigation.goBack()} 
        />

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

          <TouchableOpacity style={styles.addBtn} onPress={() => addRow(null)}>
            <Ionicons name="add-circle-outline" size={24} color={Theme.colors.textSecondary} />
            <Text style={styles.addBtnText}>Weiteren Provider hinzufügen</Text>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>

        <FormFooter 
          title="Alle Werte speichern"
          onSave={handleSaveAll}
          loading={isSubmitting}
        />

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

      <ProviderPickerModal
        visible={showProviderPicker}
        onClose={() => setShowProviderPicker(false)}
        onSelect={(p) => { 
          updateRow(activeRowId, { provider: p }); 
          setShowProviderPicker(false); 
        }}
        providers={AppConstants.PROVIDERS}
      />

      <DatePickerModal
        visible={showDatePickerModal}
        onClose={() => setShowDatePickerModal(false)}
        onSelectQuick={(ts) => { 
          updateRow(activeRowId, { timestamp: ts }); 
          setShowDatePickerModal(false); 
        }}
        onOpenNative={() => setShowNativePicker(true)}
      />

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
  scrollArea: { padding: Theme.spacing.m, flex: 1 },
  addBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: Theme.spacing.l, 
    gap: 10, 
    borderStyle: 'dashed', 
    borderWidth: 1, 
    borderColor: Theme.colors.border, 
    borderRadius: Theme.borderRadius.m, 
    marginTop: 5 
  },
  addBtnText: { 
    color: Theme.colors.textSecondary, 
    fontWeight: Theme.fontWeight.medium 
  }
});