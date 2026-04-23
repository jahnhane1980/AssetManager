// components/AssetInputRow.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Update: Punkt-Eingaben werden bei der Eingabe automatisch in Kommas umgewandelt

import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';

export default function AssetInputRow({ 
  row, 
  formattedDate,
  onProviderPress,
  onDatePress,
  onValueChange,
  onPickImage,
  onRemove,
  onPreviewPress
}) {
  // Sicherheits-Check: Falls row aus irgendeinem Grund undefined ist
  if (!row) return null;

  return (
    <View style={styles.rowCard}>
      <View style={styles.rowMain}>
        <View style={styles.selectors}>
          <TouchableOpacity style={styles.selectorBtn} onPress={onProviderPress}>
            <Text style={styles.selectorText} numberOfLines={1}>{row.provider}</Text>
            <Ionicons name="chevron-down" size={14} color={Theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.selectorBtn} onPress={onDatePress}>
            <Text style={styles.selectorText}>{formattedDate}</Text>
            <Ionicons name="calendar-outline" size={14} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputArea}>
          <TextInput
            style={[
              styles.input,
              row.status === 'ai-done' && styles.aiInput,
              row.status === 'ai-error' && styles.errorInput,
              row.status === 'processing' && styles.loadingInput
            ]}
            value={row.value}
            // Punkt durch Komma ersetzen, bevor der Wert weitergegeben wird
            onChangeText={(text) => onValueChange(text.replace(/\./g, ','))}
            placeholder="0,00"
            keyboardType="numeric"
          />
          
          <TouchableOpacity 
            style={styles.aiBtn} 
            onPress={onPickImage}
            disabled={row.status === 'processing'}
          >
            {row.status === 'processing' ? (
              <ActivityIndicator size="small" color={Theme.colors.primary} />
            ) : (
              <Ionicons 
                name="camera-outline" 
                size={24} 
                color={row.status === 'ai-done' ? Theme.colors.success : (row.status === 'ai-error' ? Theme.colors.error : Theme.colors.primary)} 
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onRemove} style={styles.deleteRowBtn}>
            <Ionicons name="trash-outline" size={20} color={Theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      {(row.status === 'ai-done' || row.status === 'ai-error') && (
        <TouchableOpacity onPress={onPreviewPress} style={styles.aiHintContainer}>
          <Text style={[styles.aiHint, row.status === 'ai-error' && { color: Theme.colors.error }]}>
            {row.status === 'ai-done' 
              ? "KI-Ergebnis – bitte prüfen! (Bild zeigen)" 
              : "Bitte manuell auslesen (Bild zeigen)"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rowCard: { 
    backgroundColor: Theme.colors.surface, 
    borderRadius: Theme.borderRadius.m, 
    padding: Theme.spacing.m, 
    marginBottom: Theme.spacing.m, 
    elevation: 2, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2 
  },
  rowMain: { gap: 10 },
  selectors: { flexDirection: 'row', gap: 10 },
  selectorBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: Theme.colors.background, 
    padding: 8, 
    borderRadius: Theme.borderRadius.s, 
    borderWidth: 1, 
    borderColor: Theme.colors.border 
  },
  selectorText: { fontSize: Theme.fontSize.caption, color: Theme.colors.text, fontWeight: Theme.fontWeight.medium },
  inputArea: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { 
    flex: 1, 
    backgroundColor: Theme.colors.background, 
    padding: 10, 
    borderRadius: Theme.borderRadius.s, 
    fontSize: Theme.fontSize.header, 
    fontWeight: Theme.fontWeight.bold, 
    color: Theme.colors.text, 
    textAlign: 'right', 
    borderWidth: 1, 
    borderColor: Theme.colors.border 
  },
  aiInput: { borderColor: Theme.colors.primary, backgroundColor: '#f0f7ff' },
  errorInput: { borderColor: Theme.colors.error, backgroundColor: '#fff0f0' },
  loadingInput: { opacity: 0.5 },
  aiBtn: { padding: 5 },
  deleteRowBtn: { padding: 5 },
  aiHintContainer: { alignSelf: 'flex-end', marginTop: 5 },
  aiHint: { fontSize: 10, color: Theme.colors.primary, fontWeight: Theme.fontWeight.semibold, textDecorationLine: 'underline' }
});
