// components/Chart.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Hinzufügen eines Umschalters zwischen Linien- und Balkendiagramm

import React, { useState } from 'react';
import { View, Dimensions, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Theme } from './Theme';
import { AppConstants } from '../constants/AppConstants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { HEIGHT, PADDING, FILTERS } = AppConstants.CHART;

// Chart Typen Konstanten
const CHART_TYPES = {
  LINE: 'LINE',
  BAR: 'BAR'
};

export default function Chart({ data, aggregation, onFilterChange }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  // State für den aktuellen Chart-Typ (Default: Linie)
  const [chartType, setChartType] = useState(CHART_TYPES.LINE);

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

  const getAggregationLabel = () => {
    switch (aggregation) {
      case 'DAILY': return 'Täglich';
      case 'WEEKLY': return 'Wöchentlich';
      case 'MONTHLY': return 'Monatlich';
      case 'YEARLY': return 'Jährlich';
      default: return '';
    }
  };

  // Hilfsfunktion zum Berechnen der Min/Max Werte
  const getMinMax = () => {
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;
    const paddingBuffer = range * 0.1;
    
    return {
      min, max, range,
      adjMin: min - paddingBuffer,
      adjMax: max + paddingBuffer,
      adjRange: (max + paddingBuffer) - (min - paddingBuffer)
    };
  };

  // Render-Logik für das Liniendiagramm (bestehend)
  const renderLineChart = (chartWidth) => {
    const { adjMin, adjRange } = getMinMax();

    const points = data.map((d, i) => {
      // X-Koordinate: Startet bei PADDING, endet bei chartWidth - PADDING
      const x = PADDING + (i * (chartWidth - PADDING * 2)) / (data.length - 1);
      const y = HEIGHT - PADDING - ((d.value - adjMin) / adjRange) * (HEIGHT - PADDING * 2);
      return `${x},${y}`;
    });

    const dLine = `M ${points.join(' L ')}`;
    const dArea = `${dLine} L ${points[points.length - 1].split(',')[0]},${HEIGHT} L ${points[0].split(',')[0]},${HEIGHT} Z`;

    return (
      <>
        <Path
          d={dLine}
          fill="none"
          stroke={Theme.colors.primary}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d={dArea}
          fill="url(#gradLine)"
        />
      </>
    );
  };

  // Render-Logik für das Balkendiagramm (neu)
  const renderBarChart = (chartWidth) => {
    const { adjMin, adjRange } = getMinMax();
    
    // Berechne die verfügbare Breite für Balken (Gesamtbreite minus Padding)
    const availableWidth = chartWidth - PADDING * 2;
    // Berechne die Breite pro Balken
    const fullBarWidth = availableWidth / data.length;
    // Definiere einen Spalt zwischen Balken (z.B. 20% der Gesamtbreite)
    const gap = fullBarWidth * 0.2;
    // Tatsächliche Breite des Balkens
    const barWidth = fullBarWidth - gap;

    const bars = data.map((d, i) => {
      // X-Koordinate des Balken-Anfangs
      const x = PADDING + (i * fullBarWidth) + (gap / 2);
      
      // Y-Koordinate (Höhe) berechnen. Wenn der Wert unter min liegt, Balken sehr klein machen
      const valueRatio = (d.value - adjMin) / adjRange;
      const barHeight = Math.max(2, valueRatio * (HEIGHT - PADDING * 2));
      const y = HEIGHT - PADDING - barHeight;

      // Pfad für einen Balken mit abgerundeten Ecken oben
      const radius = Math.min(barWidth / 2, 5); // Radius für Ecken
      
      return (
        <Path
          key={`bar-${i}`}
          d={`
            M ${x},${HEIGHT - PADDING}
            L ${x},${y + radius}
            Q ${x},${y} ${x + radius},${y}
            L ${x + barWidth - radius},${y}
            Q ${x + barWidth},${y} ${x + barWidth},${y + radius}
            L ${x + barWidth},${HEIGHT - PADDING}
            Z
          `}
          fill="url(#gradBar)"
        />
      );
    });

    return <>{bars}</>;
  };

  const renderChart = () => {
    if (!data || data.length < 2) {
      return (
        <View style={[styles.chartArea, { justifyContent: 'center' }]}>
          <Text style={styles.noDataText}>
            {data && data.length === 1 
              ? "Sammle mehr Daten für den Verlauf..." 
              : "Keine Daten für diesen Zeitraum."}
          </Text>
        </View>
      );
    }

    const chartWidth = SCREEN_WIDTH - 30; // Konsistente Breite

    return (
      <View style={styles.chartArea}>
        <Svg height={HEIGHT} width={chartWidth}>
          <Defs>
            {/* Gradient für Linie (Fläche) */}
            <LinearGradient id="gradLine" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Theme.colors.primary} stopOpacity="0.2" />
              <Stop offset="1" stopColor={Theme.colors.primary} stopOpacity="0" />
            </LinearGradient>
            
            {/* Gradient für Balken */}
            <LinearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Theme.colors.primary} stopOpacity="0.8" />
              <Stop offset="1" stopColor={Theme.colors.primary} stopOpacity="0.4" />
            </LinearGradient>
          </Defs>
          
          {/* Dynamisches Rendering basierend auf chartType */}
          {chartType === CHART_TYPES.LINE 
            ? renderLineChart(chartWidth) 
            : renderBarChart(chartWidth)
          }
        </Svg>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Kopfzeile mit Aggregation (links) und Umschalter (rechts) */}
      <View style={styles.headerRow}>
        <Text style={styles.infoText}>Auflösung: {getAggregationLabel()}</Text>
        
        <View style={styles.typeSwitcher}>
          {/* Button für Linie */}
          <TouchableOpacity 
            onPress={() => setChartType(CHART_TYPES.LINE)} 
            style={[styles.typeBtn, chartType === CHART_TYPES.LINE && styles.typeBtnActive]}
          >
            <Text style={[styles.typeBtnText, chartType === CHART_TYPES.LINE && styles.typeBtnTextActive]}>Linie</Text>
          </TouchableOpacity>
          
          {/* Button für Balken */}
          <TouchableOpacity 
            onPress={() => setChartType(CHART_TYPES.BAR)} 
            style={[styles.typeBtn, chartType === CHART_TYPES.BAR && styles.typeBtnActive]}
          >
            <Text style={[styles.typeBtnText, chartType === CHART_TYPES.BAR && styles.typeBtnTextActive]}>Balken</Text>
          </TouchableOpacity>
        </View>
      </View>

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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Theme.spacing.l,
    marginBottom: 5
  },
  infoText: {
    fontSize: 10,
    color: Theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  typeSwitcher: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 15,
    overflow: 'hidden'
  },
  typeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: Theme.colors.surface
  },
  typeBtnActive: {
    backgroundColor: Theme.colors.primary
  },
  typeBtnText: {
    fontSize: 10,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.textSecondary
  },
  typeBtnTextActive: {
    color: Theme.colors.white
  },
  chartArea: {
    height: HEIGHT,
    width: '100%',
    alignItems: 'center'
  },
  noDataText: { 
    color: Theme.colors.textSecondary,
    fontSize: Theme.fontSize.caption,
    textAlign: 'center',
    paddingHorizontal: 20
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