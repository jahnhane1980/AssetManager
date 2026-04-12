// components/SettingsModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Einstellung für die Seitengröße (Pagination) hinzugefügt

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { Security } from './Security';

export default function SettingsModal({ visible, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [pageSize, setPageSize] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    const key = await Security.getGeminiKey();
    const size = await Security.getPageSize();
    if (key) setApiKey(key);
    setPageSize(size.toString());
    setStatusMessage(null);
  };

  const handleSave = async () => {
    // Validierung API-Key (optional, falls nur Seitengröße geändert wird)
    if (apiKey.trim() && apiKey.trim().length < 10) {
      setStatusMessage({ text: "API-Key zu kurz oder ungültig.", type: 'error' });
      return;
    }

    // Validierung Seitengröße
    const parsedSize = parseInt(pageSize, 10);
    if (isNaN(parsedSize) || parsedSize < 1 || parsedSize > 100) {
      setStatusMessage({ text: "Seitengröße muss zwischen 1 und 100 liegen.", type: 'error' });
      return;
    }

    try {
      const successKey = apiKey.trim() ? await Security.setGeminiKey(apiKey.trim()) : true;
      const successSize = await Security.setPageSize(parsedSize);

      if (successKey && successSize) {
        setStatusMessage({ text: "Einstellungen erfolgreich gespeichert!", type: 'success' });
        setTimeout(onClose, 1500);
      } else {
        setStatusMessage({ text: "Fehler beim Speichern.", type: 'error' });
      }
    } catch (error) {
      setStatusMessage({ text: "Systemfehler beim Speichern.", type: 'error' });
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Einstellungen</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtnContainer}>
              <Ionicons name="close" size={24} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Bereich: API-Key */}
            <Text style={styles.label}>Gemini AI API-Key</Text>
            <Text style={styles.description}>
              Wird benötigt, um Screenshots automatisch zu analysieren.
            </Text>
            <TextInput
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="AIza..."
              secureTextEntry={true}
              autoCapitalize="none"
            />

            {/* Bereich: Pagination */}
            <Text style={styles.label}>Einträge pro Seite (Verlauf)</Text>
            <Text style={styles.description}>
              Legt fest, wie viele Einträge im Vermögensverlauf gleichzeitig angezeigt werden.
            </Text>
            <TextInput
              style={styles.input}
              value={pageSize}
              onChangeText={setPageSize}
              placeholder="15"
              keyboardType="numeric"
            />

            {statusMessage && (
              <Text style={[styles.status, statusMessage.type === 'error' ? styles.error : styles.success]}>
                {statusMessage.text}
              </Text>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Speichern</Text>
            </TouchableOpacity>
            
            <View style={{ height: 30 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Theme.colors.overlayMedium, justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', maxHeight: '80%', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.l, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: Theme.spacing.l, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, alignItems: 'center' },
  headerTitle: { fontSize: Theme.fontSize.subHeader, fontWeight: Theme.fontWeight.bold, color: Theme.colors.text },
  closeBtnContainer: { padding: 5 },
  content: { padding: Theme.spacing.l },
  label: { fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.semibold, color: Theme.colors.text, marginBottom: 5 },
  description: { fontSize: Theme.fontSize.description, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.m, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: Theme.colors.border, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, fontSize: Theme.fontSize.body, marginBottom: Theme.spacing.l, color: Theme.colors.text },
  saveBtn: { backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center', marginBottom: Theme.spacing.m },
  saveBtnText: { color: Theme.colors.white, fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.bold },
  status: { textAlign: 'center', marginBottom: 15, fontWeight: Theme.fontWeight.medium },
  error: { color: Theme.colors.error },
  success: { color: Theme.colors.success }
});