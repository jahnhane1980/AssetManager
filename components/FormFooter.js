// components/FormFooter.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Neu: Eigenständige Footer-Komponente für Formular-Screens

import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { Theme } from './Theme';
import PrimaryButton from './PrimaryButton';

export default function FormFooter({ title, onSave, loading }) {
  return (
    <View style={styles.footer}>
      <PrimaryButton 
        title={title}
        onPress={onSave}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { 
    padding: Theme.spacing.l, 
    paddingBottom: Platform.OS === 'ios' ? 40 : Theme.spacing.l, 
    backgroundColor: Theme.colors.surface, 
    borderTopWidth: 1, 
    borderTopColor: Theme.colors.border 
  }
});