// components/PortfolioList.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Zeigt alle definierten Provider mit Standardwert 0,00 € an, falls keine Daten vorliegen

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from './Theme';
import { AppConstants } from '../constants/AppConstants';

export default function PortfolioList({ portfolios }) {
  // Hilfsfunktion zur Datumsformatierung
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Wir mappen über die vordefinierten Provider aus den AppConstants.
   * Wenn Daten in 'portfolios' (aus der DB) existieren, nehmen wir diese.
   * Andernfalls erstellen wir einen Default-Eintrag mit 0,00 €.
   */
  const displayPortfolios = AppConstants.PROVIDERS.map(providerName => {
    const existingData = portfolios.find(p => p.provider === providerName);
    
    if (existingData) {
      return existingData;
    }

    // Fallback für Provider ohne Datenbank-Eintrag
    return {
      provider: providerName,
      value: 0,
      timestamp: Date.now()
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.subTitle}>Aktueller Stand pro Anbieter</Text>
      {displayPortfolios.map((p, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.infoColumn}>
              <Text style={styles.providerName}>{p.provider}</Text>
              <Text style={styles.dateText}>Stand: {formatDate(p.timestamp)}</Text>
            </View>
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
    fontSize: Theme.fontSize.subHeader, 
    fontWeight: Theme.fontWeight.semibold, 
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
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  infoColumn: {
    flex: 1,
  },
  providerName: { 
    fontSize: Theme.fontSize.body, 
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.text
  },
  dateText: {
    fontSize: Theme.fontSize.hint,
    color: Theme.colors.textSecondary,
    marginTop: 2
  },
  providerValue: { 
    fontSize: Theme.fontSize.body, 
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.text
  }
});