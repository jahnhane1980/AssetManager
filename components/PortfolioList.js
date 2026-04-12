// components/PortfolioList.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Darstellung der Portfolio-Einträge

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from './Theme';

export default function PortfolioList({ portfolios }) {
  if (!portfolios || portfolios.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Noch keine Portfolios angelegt.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subTitle}>Deine Portfolios</Text>
      {portfolios.map((p, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.providerName}>{p.provider}</Text>
            <Text style={styles.providerValue}>
              {p.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Theme.spacing.m,
  },
  subTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: Theme.spacing.s, 
    color: Theme.colors.text 
  },
  card: { 
    backgroundColor: Theme.colors.surface, 
    padding: Theme.spacing.m, 
    borderRadius: Theme.borderRadius.m, 
    marginBottom: Theme.spacing.s, 
    elevation: 1 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  providerName: { 
    fontSize: 16, 
    fontWeight: '500' 
  },
  providerValue: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  emptyContainer: {
    padding: Theme.spacing.l,
    alignItems: 'center'
  },
  emptyText: {
    color: Theme.colors.textSecondary,
    fontStyle: 'italic'
  }
});