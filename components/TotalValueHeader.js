// components/TotalValueHeader.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: FontWeights und FontSizes auf Theme.js umgestellt

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';

export default function TotalValueHeader({ totalValue, performance, onMenuPress }) {
  const isPositive = performance.nominal >= 0;

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.menuButton} 
        onPress={onMenuPress}
      >
        <Ionicons name="menu-outline" size={28} color={Theme.colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Gesamtvermögen</Text>
      
      <Text style={styles.amount}>
        {totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
      </Text>

      <Text style={[
        styles.perfText, 
        { color: isPositive ? Theme.colors.success : Theme.colors.error }
      ]}>
        {isPositive ? '+' : ''}
        {performance.nominal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} 
        ({performance.percent.toFixed(2)}%)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    padding: Theme.spacing.l, 
    backgroundColor: Theme.colors.surface, 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border, 
    position: 'relative' 
  },
  menuButton: { 
    position: 'absolute', 
    right: 15, 
    top: Platform.OS === 'ios' ? 10 : 15, 
    padding: 10, 
    zIndex: 10 
  },
  title: { 
    fontSize: Theme.fontSize.caption, 
    color: Theme.colors.textSecondary 
  },
  amount: { 
    fontSize: Theme.fontSize.display, 
    fontWeight: Theme.fontWeight.bold, 
    color: Theme.colors.text 
  },
  perfText: { 
    fontSize: Theme.fontSize.body, 
    fontWeight: Theme.fontWeight.semibold, 
    marginTop: 5 
  },
});