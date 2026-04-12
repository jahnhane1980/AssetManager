// components/Chart.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: FontWeights auf Theme.js umgestellt

import React, { useState } from 'react';
import { View, Dimensions, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Theme } from './Theme';
import { AppConstants } from '../constants/AppConstants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { HEIGHT, PADDING, FILTERS } = AppConstants.CHART;

export default function Chart({ data, onFilterChange }) {
  const [activeFilter, setActiveFilter] = useState('ALL');

  const handleFilterPress = (filter) => {
    setActiveFilter(filter);
    
    let timeLimit = 0;
    const now = new Date();
    
    if (filter === '3M') {
      now.setMonth(now.getMonth() - 3);
      timeLimit = now.getTime();
    } else if (filter === '6M') {
      now.setMonth(now.getMonth() - 6);
      timeLimit = now.getTime();
    } else if (filter === '1Y') {
      now.setFullYear(now.getFullYear() - 1);
      timeLimit = now.getTime();
    }
    
    if (onFilterChange) {
      onFilterChange(timeLimit);
    }
  };

  const renderChart = () => {
    if (!data || data.length < 2) {
      return (
        <View style={[styles.chartArea, { justifyContent: 'center' }]}>
          <Text style={{ color: Theme.colors.textSecondary }}>Nicht genügend Daten für den Zeitraum.</Text>
        </View>
      );
    }

    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = data.map((d, i) => {
      const x = PADDING + (i * (SCREEN_WIDTH - PADDING * 5)) / (data.length - 1);
      const y = HEIGHT - PADDING - ((d.value - min) / range) * (HEIGHT - PADDING * 2);
      return `${x},${y}`;
    });

    const d = `M ${points.join(' L ')}`;

    return (
      <View style={styles.chartArea}>
        <Svg height={HEIGHT} width={SCREEN_WIDTH - 30}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Theme.colors.primary} stopOpacity="0.2" />
              <Stop offset="1" stopColor={Theme.colors.primary} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Path
            d={d}
            fill="none"
            stroke={Theme.colors.primary}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d={`${d} L ${points[points.length - 1].split(',')[0]},${HEIGHT} L ${points[0].split(',')[0]},${HEIGHT} Z`}
            fill="url(#grad)"
          />
        </Svg>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderChart()}
      
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity 
            key={f} 
            onPress={() => handleFilterPress(f)} 
            style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterBtnText, activeFilter === f && styles.filterBtnTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.l,
    paddingVertical: Theme.spacing.m,
    marginBottom: Theme.spacing.l,
    elevation: 2,
    alignItems: 'center'
  },
  chartArea: {
    height: HEIGHT,
    width: '100%',
    alignItems: 'center'
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  filterBtnActive: {
    backgroundColor: Theme.colors.primary
  },
  filterBtnText: {
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeight.semibold,
    fontSize: Theme.fontSize.caption
  },
  filterBtnTextActive: {
    color: Theme.colors.white
  }
});