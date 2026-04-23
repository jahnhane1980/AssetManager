// components/PortfolioList.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Update: Accordion-Logik mit Provider-Chart in renderItem integriert (Struktur & FlatList bleiben erhalten)

import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { AppConstants } from '../constants/AppConstants';
import Chart from './Chart';
import { FinanceUtils } from '../utils/FinanceUtils';

// LayoutAnimation für Android aktivieren
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PortfolioList({ portfolios, chartData, allAssets = [], aggregation, onFilterChange, onProviderPress }) {
  
  const [expandedProvider, setExpandedProvider] = useState(null);

  const toggleExpand = (providerName) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedProvider(expandedProvider === providerName ? null : providerName);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Noch kein Eintrag';
    const date = new Date(timestamp);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const displayPortfolios = AppConstants.PROVIDERS.map(providerName => {
    const existingData = portfolios.find(p => p.provider === providerName);
    return existingData || { provider: providerName, value: 0, timestamp: null };
  });

  const renderItem = ({ item }) => {
    const isExpanded = expandedProvider === item.provider;
    
    // Daten für das Provider-Chart filtern
    const providerChartData = FinanceUtils.processProviderChartData(allAssets, item.provider);

    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => toggleExpand(item.provider)}
          onLongPress={() => onProviderPress(item.provider)} 
          activeOpacity={0.7}
        >
          <View style={styles.row}>
            <View style={styles.infoColumn}>
              <Text style={styles.providerName}>{item.provider}</Text>
              <Text style={styles.dateText}>Stand: {formatDate(item.timestamp)}</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.providerValue}>
                {item.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </Text>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={Theme.colors.textSecondary} 
                style={{ marginLeft: 8 }}
              />
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            <Text style={styles.chartTitle}>Historie: {item.provider}</Text>
            <Chart 
              data={providerChartData} 
              aggregation={aggregation}
              heightOverride={160} 
            />
          </View>
        )}
      </View>
    );
  };

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
  listContent: { padding: Theme.spacing.m, paddingBottom: 100 },
  headerContainer: { marginBottom: Theme.spacing.s },
  subTitle: { fontSize: Theme.fontSize.subHeader, fontWeight: Theme.fontWeight.semibold, marginBottom: Theme.spacing.s, color: Theme.colors.text },
  cardContainer: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.m, marginBottom: Theme.spacing.s, elevation: 1, overflow: 'hidden' },
  card: { padding: Theme.spacing.m },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoColumn: { flex: 1 },
  providerName: { fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.medium, color: Theme.colors.text },
  dateText: { fontSize: Theme.fontSize.hint, color: Theme.colors.textSecondary, marginTop: 2 },
  valueContainer: { flexDirection: 'row', alignItems: 'center' },
  providerValue: { fontSize: Theme.fontSize.body, fontWeight: Theme.fontWeight.bold, color: Theme.colors.text },
  expandedContent: { paddingBottom: Theme.spacing.m },
  divider: { height: 1, backgroundColor: Theme.colors.border, marginBottom: Theme.spacing.m, marginHorizontal: Theme.spacing.m },
  chartTitle: { fontSize: 10, fontWeight: '600', color: Theme.colors.textSecondary, marginBottom: 8, textAlign: 'center', textTransform: 'uppercase' }
});
