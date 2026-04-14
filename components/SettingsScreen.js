// components/SettingsScreen.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Umstellung von JS-Modal auf echten Navigation-Screen

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { Security } from './Security';

export default function SettingsScreen({ navigation }) {
  const [apiKey, setApiKey] = useState('');
  const [pageSize, setPageSize] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

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
        setTimeout(() => navigation.goBack(), 1000);
      } else {
        global.notify("Fehler beim Speichern", "error");
      }
    } catch (error) {
      global.notify("Systemfehler beim Speichern", "error");
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Einstellungen</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtnContainer}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Theme.colors.background 
  },
  keyboardContainer: { 
    flex: 1 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: Theme.spacing.l, 
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border, 
    alignItems: 'center',
    backgroundColor: Theme.colors.surface
  },
  headerTitle: { fontSize: Theme.fontSize.subHeader, fontWeight: Theme.fontWeight.bold, color: Theme.colors.text },
  closeBtnContainer: { padding: 5 },
  content: { padding: Theme.spacing.l, flex: 1 },
  label: { fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.semibold, color: Theme.colors.text, marginBottom: 5 },
  description: { fontSize: Theme.fontSize.description, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.m, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: Theme.colors.border, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, fontSize: Theme.fontSize.body, marginBottom: Theme.spacing.l, color: Theme.colors.text },
  saveBtn: { backgroundColor: Theme.colors.primary, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, alignItems: 'center', marginBottom: Theme.spacing.m },
  saveBtnText: { color: Theme.colors.white, fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.bold }
});