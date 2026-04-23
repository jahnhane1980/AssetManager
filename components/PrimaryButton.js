// components/PrimaryButton.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Neu: Gemeinsame Button-Komponente mit Lade-Status und Varianten-Unterstützung

import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  View 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';

export default function PrimaryButton({ 
  title, 
  onPress, 
  loading = false, 
  disabled = false, 
  icon = null,
  variant = 'primary', // 'primary', 'outline', 'google'
  style = {} 
}) {
  const isInverse = variant === 'outline';
  const isGoogle = variant === 'google';
  
  const buttonStyles = [
    styles.button,
    variant === 'outline' && styles.outlineButton,
    variant === 'google' && styles.googleButton,
    (disabled || loading) && styles.disabled,
    style
  ];

  const textStyles = [
    styles.text,
    variant === 'outline' && styles.outlineText,
    isGoogle && styles.googleText
  ];

  const iconColor = isInverse ? Theme.colors.primary : Theme.colors.white;

  return (
    <TouchableOpacity 
      style={buttonStyles} 
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={isInverse ? Theme.colors.primary : Theme.colors.white} />
      ) : (
        <View style={styles.content}>
          {icon && <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />}
          <Text style={textStyles}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Theme.colors.primary,
    padding: Theme.spacing.m,
    borderRadius: Theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: Theme.colors.white,
    fontSize: Theme.fontSize.body,
    fontWeight: Theme.fontWeight.bold,
  },
  outlineText: {
    color: Theme.colors.primary,
  },
  googleText: {
    color: Theme.colors.white,
  }
});