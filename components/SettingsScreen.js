// components/SettingsScreen.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Integration von PrimaryButton für konsistentes UI

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Theme } from './Theme';
import { Security } from './Security';
import ScreenHeader from './ScreenHeader';
import PrimaryButton from './PrimaryButton'; // Neu importiert

export default function SettingsScreen({ navigation }) {
  const [apiKey, setApiKey] = useState('');
  const [pageSize, setPageSize] = useState('');
  const [isSaving, setIsSaving] = useState(false); // Neuer Lade-State

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

    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScreenHeader 
          title="Einstellungen" 
          onClose={() => navigation.goBack()} 
        />

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

          <PrimaryButton 
            title="Einstellungen speichern"
            onPress={handleSave}
            loading={isSaving}
          />
          
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
  content: { padding: Theme.spacing.l, flex: 1 },
  label: { fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.semibold, color: Theme.colors.text, marginBottom: 5 },
  description: { fontSize: Theme.fontSize.description, color: Theme.colors.textSecondary, marginBottom: Theme.spacing.m, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: Theme.colors.border, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.m, fontSize: Theme.fontSize.body, marginBottom: Theme.spacing.l, color: Theme.colors.text }
});