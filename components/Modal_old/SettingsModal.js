// components/SettingsModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Umstellung von nativem Modal auf JS-View mit Animation

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { Security } from './Security';

export default function SettingsModal({ visible, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [pageSize, setPageSize] = useState('');
  const [shouldRender, setShouldRender] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      loadSettings();
      setShouldRender(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShouldRender(false));
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      const backAction = () => {
        onClose();
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, [visible, onClose]);

  const loadSettings = async () => {
    const key = await Security.getGeminiKey();
    const size = await Security.getPageSize();
    if (key) setApiKey(key);
    setPageSize(size.toString());
  };

  const handleSave = async () => {
    if (apiKey.trim() && apiKey.trim().length < 10) {
      global.notify("API-Key ungültig", "error");
      return;
    }

    const parsedSize = parseInt(pageSize, 10);
    if (isNaN(parsedSize) || parsedSize < 1 || parsedSize > 100) {
      global.notify("Seitengröße (1-100) wählen", "error");
      return;
    }

    try {
      const successKey = apiKey.trim() ? await Security.setGeminiKey(apiKey.trim()) : true;
      const successSize = await Security.setPageSize(parsedSize);

      if (successKey && successSize) {
        global.notify("Einstellungen gespeichert", "success");
        setTimeout(onClose, 1000);
      } else {
        global.notify("Fehler beim Speichern", "error");
      }
    } catch (error) {
      global.notify("Systemfehler beim Speichern", "error");
    }
  };

  if (!shouldRender) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
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

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Speichern</Text>
          </TouchableOpacity>
          
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: Theme.colors.overlayMedium, 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 100 
  },
  modalContainer: { 
    width: '90%', 
    maxHeight: '80%', 
    backgroundColor: Theme.colors.surface, 
    borderRadius: Theme.borderRadius.l, 
    overflow: 'hidden',
    elevation: 10,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: Theme.spacing.l, borderBottomWidth: 1, borderBottomColor: Theme.colors.border, alignItems: 'center' },
  headerTitle: { fontSize: Theme.fontSize.subHeader, fontWeight: Theme.fontWeight.bold, color: Theme.colors.text },
  closeBtnContainer: { padding: 5 },
  content: { padding: Theme.spacing.l },
  label: { fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.semibold, color: Theme.colors.text, marginBottom: 5 },
  description: { fontSize: Theme.fontSize.description, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.m, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: Theme.colors.border, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, fontSize: Theme.fontSize.body, marginBottom: Theme.spacing.l, color: Theme.colors.text },
  saveBtn: { backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center', marginBottom: Theme.spacing.m },
  saveBtnText: { color: Theme.colors.white, fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.bold }
});