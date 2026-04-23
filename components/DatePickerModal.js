// components/DatePickerModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Neu: Eigenständige Komponente für die Datums-Auswahl

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';

export default function DatePickerModal({ visible, onClose, onSelectQuick, onOpenNative }) {
  if (!visible) return null;

  return (
    <View style={styles.subOverlayContainer}>
      <TouchableOpacity 
        style={styles.subOverlayBackdrop} 
        activeOpacity={1} 
        onPress={onClose} 
      />
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
                onPress={() => onSelectQuick(d.getTime())}
              >
                <Text style={styles.quickBtnText}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.fullWidthBtn} onPress={onOpenNative}>
          <Ionicons name="calendar" size={20} color={Theme.colors.primary} />
          <Text style={styles.fullWidthBtnText}>Anderes Datum wählen</Text>
        </TouchableOpacity>
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
  quickSelectRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: Theme.spacing.m 
  },
  quickBtn: { 
    flex: 1, 
    backgroundColor: Theme.colors.background, 
    padding: 12, 
    borderRadius: Theme.borderRadius.m, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: Theme.colors.border 
  },
  quickBtnText: { 
    fontWeight: Theme.fontWeight.semibold, 
    color: Theme.colors.primary 
  },
  divider: { 
    height: 1, 
    backgroundColor: Theme.colors.border, 
    marginVertical: Theme.spacing.m 
  },
  fullWidthBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    padding: 12, 
    backgroundColor: Theme.colors.background, 
    borderRadius: Theme.borderRadius.m, 
    borderWidth: 1, 
    borderColor: Theme.colors.border 
  },
  fullWidthBtnText: { 
    color: Theme.colors.primary, 
    fontWeight: Theme.fontWeight.semibold 
  }
});