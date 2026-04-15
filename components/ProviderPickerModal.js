// components/ProviderPickerModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Neu: Eigenständige Komponente für die Anbieter-Auswahl

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Theme } from './Theme';

export default function ProviderPickerModal({ visible, onClose, onSelect, providers }) {
  if (!visible) return null;

  return (
    <View style={styles.subOverlayContainer}>
      <TouchableOpacity 
        style={styles.subOverlayBackdrop} 
        activeOpacity={1} 
        onPress={onClose} 
      />
      <View style={styles.pickerContent}>
        <Text style={styles.pickerTitle}>Anbieter wählen</Text>
        <ScrollView style={{ maxHeight: 300 }}>
          {providers.map(p => (
            <TouchableOpacity 
              key={p} 
              style={styles.pickerItem} 
              onPress={() => onSelect(p)}
            >
              <Text style={styles.pickerItemText}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subOverlayContainer: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 110 
  },
  subOverlayBackdrop: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.4)' 
  },
  pickerContent: { 
    width: '85%', 
    backgroundColor: Theme.colors.surface, 
    borderRadius: Theme.borderRadius.l, 
    padding: Theme.spacing.l, 
    elevation: 5 
  },
  pickerTitle: { 
    fontSize: Theme.fontSize.subHeader, 
    fontWeight: Theme.fontWeight.bold, 
    marginBottom: Theme.spacing.l, 
    textAlign: 'center' 
  },
  pickerItem: { 
    paddingVertical: Theme.spacing.m, 
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border 
  },
  pickerItemText: { 
    fontSize: Theme.fontSize.body, 
    color: Theme.colors.text, 
    textAlign: 'center' 
  }
});