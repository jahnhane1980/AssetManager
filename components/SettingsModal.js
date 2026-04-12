// components/SettingsModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Zentrale App-Einstellungen & API-Key Management

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Theme } from './Theme';
import { Security } from './Security';

export default function SettingsModal({ visible, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    if (visible) {
      loadKey();
    }
  }, [visible]);

  const loadKey = async () => {
    const key = await Security.getGeminiKey();
    if (key) setApiKey(key);
    setStatusMessage(null);
  };

  const handleSave = async () => {
    if (apiKey.trim().length < 10) {
      setStatusMessage({ text: "Key zu kurz oder ungültig.", type: 'error' });
      return;
    }
    const success = await Security.setGeminiKey(apiKey.trim());
    if (success) {
      setStatusMessage({ text: "API-Key erfolgreich gespeichert!", type: 'success' });
      setTimeout(onClose, 1500);
    } else {
      setStatusMessage({ text: "Fehler beim Speichern.", type: 'error' });
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
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>Schließen</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>Gemini AI API-Key</Text>
            <Text style={styles.description}>
              Wird benötigt, um Screenshots automatisch zu analysieren. Der Key wird lokal verschlüsselt gespeichert.
            </Text>
            <TextInput 
              style={styles.input}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="AIza..."
              secureTextEntry={true}
              autoCapitalize="none"
            />

            {statusMessage && (
              <Text style={[styles.status, statusMessage.type === 'error' ? styles.error : styles.success]}>
                {statusMessage.text}
              </Text>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Speichern</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.l, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: Theme.spacing.l, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.text },
  closeBtn: { color: Theme.colors.primary, fontWeight: '600' },
  content: { padding: Theme.spacing.l },
  label: { fontSize: 16, fontWeight: '600', color: Theme.colors.text, marginBottom: 5 },
  description: { fontSize: 13, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.m, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: Theme.colors.border, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, fontSize: 16, marginBottom: Theme.spacing.l, color: Theme.colors.text },
  saveBtn: { backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center' },
  saveBtnText: { color: Theme.colors.white, fontSize: 16, fontWeight: 'bold' },
  status: { textAlign: 'center', marginBottom: 15, fontWeight: '500' },
  error: { color: '#FF3B30' },
  success: { color: '#4CD964' }
});