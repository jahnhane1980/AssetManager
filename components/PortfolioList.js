// components/PortfolioList.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Umstellung auf FlatList für bessere Performance
// Integration: Chart als ListHeaderComponent zur Vermeidung von Layout-Fehlern
// Neu: Provider-Einträge anklickbar machen

import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { Theme } from './Theme';
import { AppConstants } from '../constants/AppConstants';
import Chart from './Chart';

export default function PortfolioList({ portfolios, chartData, aggregation, onFilterChange, onProviderPress }) {
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Noch kein Eintrag';
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const displayPortfolios = AppConstants.PROVIDERS.map(providerName => {
    const existingData = portfolios.find(p => p.provider === providerName);
    return existingData || {
      provider: providerName,
      value: 0,
      timestamp: null
    };
  });

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => onProviderPress(item.provider)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={styles.infoColumn}>
          <Text style={styles.providerName}>{item.provider}</Text>
          <Text style={styles.dateText}>Stand: {formatDate(item.timestamp)}</Text>
        </View>
        <Text style={styles.providerValue}>
          {item.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Chart 
        data={chartData} 
        aggregation={aggregation}
        onFilterChange={onFilterChange} 
      />
      <Text style={styles.subTitle}>Aktueller Stand pro Anbieter</Text>
    </View>
  );

  return (
    <FlatList
      data={displayPortfolios}
      renderItem={renderItem}
      keyExtractor={(item) => item.provider}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: Theme.spacing.m,
    paddingBottom: 100, // Platz für FAB
  },
  headerContainer: {
    marginBottom: Theme.spacing.s,
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