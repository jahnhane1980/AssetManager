// components/ScreenHeader.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Neu: Gemeinsame Komponente für Screen-Header zur Reduzierung von Redundanzen

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';

export default function ScreenHeader({ title, onClose }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity onPress={onClose} style={styles.closeBtnContainer}>
        <Ionicons name="close" size={24} color={Theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Theme.spacing.l, 
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: Theme.spacing.m,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border 
  },
  headerTitle: { 
    fontSize: Theme.fontSize.subHeader, 
    fontWeight: Theme.fontWeight.bold, 
    color: Theme.colors.text 
  },
  closeBtnContainer: { 
    padding: 5 
  }
});