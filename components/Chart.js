// components/Chart.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Update: heightOverride hinzugefügt für kompakte Darstellung im Accordion

import React, { useState, useMemo } from 'react';
import { View, Dimensions, StyleSheet, TouchableOpacity, Text, PanResponder } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, G, Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { Theme } from './Theme';
import { AppConstants } from '../constants/AppConstants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { HEIGHT: DEFAULT_HEIGHT, PADDING, FILTERS } = AppConstants.CHART;

const CHART_TYPES = {
  LINE: 'LINE',
  BAR: 'BAR'
};

export default function Chart({ data, aggregation, onFilterChange, heightOverride }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [chartType, setChartType] = useState(CHART_TYPES.LINE);
  const [activeIndex, setActiveIndex] = useState(null);

  // Nutzt den Override oder den Standardwert aus den Constants
  const chartHeight = heightOverride || DEFAULT_HEIGHT; 
  const chartWidth = SCREEN_WIDTH - 30;

  const minMax = useMemo(() => {
    if (!data || data.length === 0) return null;
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;
    const paddingBuffer = range * 0.1;
    
    return {
      adjMin: min - paddingBuffer,
      adjRange: (max + paddingBuffer) - (min - paddingBuffer)
    };
  }, [data]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt) => {
      if (!data || data.length < 2) return;
      const touchX = evt.nativeEvent.locationX;
      const availableWidth = chartWidth - PADDING * 2;
      let index = Math.round(((touchX - PADDING) / availableWidth) * (data.length - 1));
      index = Math.max(0, Math.min(index, data.length - 1));
      setActiveIndex(index);
    },
    onPanResponderRelease: () => setActiveIndex(null),
    onPanResponderTerminate: () => setActiveIndex(null),
  }), [data, chartWidth]);

  const handleFilterPress = (filter) => {
    setActiveFilter(filter);
    let timeLimit = 0;
    const now = new Date();
    if (filter === '3M') now.setMonth(now.getMonth() - 3);
    else if (filter === '6M') now.setMonth(now.getMonth() - 6);
    else if (filter === '1Y') now.setFullYear(now.getFullYear() - 1);
    timeLimit = (filter === 'ALL') ? 0 : now.getTime();
    if (onFilterChange) onFilterChange(timeLimit);
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

  const renderTooltip = () => {
    if (activeIndex === null || !data || !data[activeIndex] || !minMax) return null;
    const d = data[activeIndex];
    const { adjMin, adjRange } = minMax;
    const x = PADDING + (activeIndex * (chartWidth - PADDING * 2)) / (data.length - 1);
    const y = chartHeight - PADDING - ((d.value - adjMin) / adjRange) * (chartHeight - PADDING * 2);
    const boxX = x > chartWidth / 2 ? x - 110 : x + 10;

    return (
      <G>
        <Line x1={x} y1={PADDING} x2={x} y2={chartHeight - PADDING} stroke={Theme.colors.border} strokeDasharray="4,4" />
        <Circle cx={x} cy={y} r="6" fill={Theme.colors.primary} stroke={Theme.colors.white} strokeWidth="2" />
        <Rect x={boxX} y={y - 45} width={100} height={40} rx="5" fill={Theme.colors.surface} stroke={Theme.colors.border} />
        <SvgText x={boxX + 5} y={y - 30} fontSize="10" fontWeight="bold" fill={Theme.colors.text}>{d.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</SvgText>
        <SvgText x={boxX + 5} y={y - 15} fontSize="9" fill={Theme.colors.textSecondary}>{new Date(d.timestamp).toLocaleDateString('de-DE')}</SvgText>
      </G>
    );
  };

  const renderLineChart = () => {
    const { adjMin, adjRange } = minMax;
    const points = data.map((d, i) => {
      const x = PADDING + (i * (chartWidth - PADDING * 2)) / (data.length - 1);
      const y = chartHeight - PADDING - ((d.value - adjMin) / adjRange) * (chartHeight - PADDING * 2);
      return `${x},${y}`;
    });
    const dLine = `M ${points.join(' L ')}`;
    const dArea = `${dLine} L ${points[points.length - 1].split(',')[0]},${chartHeight} L ${points[0].split(',')[0]},${chartHeight} Z`;
    return (
      <>
        <Path d={dLine} fill="none" stroke={Theme.colors.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <Path d={dArea} fill="url(#gradLine)" />
      </>
    );
  };

  const renderBarChart = () => {
    const { adjMin, adjRange } = minMax;
    const fullBarWidth = (chartWidth - PADDING * 2) / data.length;
    const gap = fullBarWidth * 0.2;
    const barWidth = fullBarWidth - gap;

    return data.map((d, i) => {
      const x = PADDING + (i * fullBarWidth) + (gap / 2);
      const barHeight = Math.max(2, ((d.value - adjMin) / adjRange) * (chartHeight - PADDING * 2));
      const y = chartHeight - PADDING - barHeight;
      const radius = Math.min(barWidth / 2, 5);
      return (
        <Path key={`bar-${i}`} d={`M ${x},${chartHeight - PADDING} L ${x},${y + radius} Q ${x},${y} ${x + radius},${y} L ${x + barWidth - radius},${y} Q ${x + barWidth},${y} ${x + barWidth},${y + radius} L ${x + barWidth},${chartHeight - PADDING} Z`} fill={activeIndex === i ? Theme.colors.primary : "url(#gradBar)"} />
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.infoText}>{getAggregationLabel()}</Text>
        <View style={styles.typeSwitcher}>
          <TouchableOpacity onPress={() => setChartType(CHART_TYPES.LINE)} style={[styles.typeBtn, chartType === CHART_TYPES.LINE && styles.typeBtnActive]}>
            <Text style={[styles.typeBtnText, chartType === CHART_TYPES.LINE && styles.typeBtnTextActive]}>📈</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setChartType(CHART_TYPES.BAR)} style={[styles.typeBtn, chartType === CHART_TYPES.BAR && styles.typeBtnActive]}>
            <Text style={[styles.typeBtnText, chartType === CHART_TYPES.BAR && styles.typeBtnTextActive]}>📊</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chartArea} {...panResponder.panHandlers}>
        <Svg height={chartHeight} width={chartWidth}>
          <Defs>
            <LinearGradient id="gradLine" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Theme.colors.primary} stopOpacity="0.2" />
              <Stop offset="1" stopColor={Theme.colors.primary} stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="gradBar" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Theme.colors.primary} stopOpacity="0.8" />
              <Stop offset="1" stopColor={Theme.colors.primary} stopOpacity="0.4" />
            </LinearGradient>
          </Defs>
          {data && data.length >= 2 ? (
            <>
              {chartType === CHART_TYPES.LINE ? renderLineChart() : renderBarChart()}
              {renderTooltip()}
            </>
          ) : (
            <SvgText x={chartWidth / 2} y={chartHeight / 2} textAnchor="middle" fill={Theme.colors.textSecondary} fontSize="12">
              Keine Daten.
            </SvgText>
          )}
        </Svg>
      </View>
      
      {/* Filterleiste nur im Haupt-Chart anzeigen (nicht im Accordion) */}
      {!heightOverride && (
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity key={f} onPress={() => handleFilterPress(f)} style={[styles.filterBtn, activeFilter === f && styles.filterBtnActive]}>
              <Text style={[styles.filterBtnText, activeFilter === f && styles.filterBtnTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Theme.colors.surface, borderRadius: Theme.borderRadius.l, paddingVertical: Theme.spacing.m, marginBottom: Theme.spacing.l, elevation: 2, alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: Theme.spacing.l, marginBottom: 5 },
  infoText: { fontSize: 10, color: Theme.colors.textSecondary, textTransform: 'uppercase' },
  typeSwitcher: { flexDirection: 'row', borderWidth: 1, borderColor: Theme.colors.border, borderRadius: 15, overflow: 'hidden' },
  typeBtn: { paddingVertical: 2, paddingHorizontal: 8 },
  typeBtnActive: { backgroundColor: Theme.colors.primary },
  typeBtnText: { fontSize: 10 },
  typeBtnTextActive: { color: Theme.colors.white },
  chartArea: { width: '100%', alignItems: 'center' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  filterBtnActive: { backgroundColor: Theme.colors.primary },
  filterBtnText: { color: Theme.colors.textSecondary, fontWeight: Theme.fontWeight.semibold, fontSize: Theme.fontSize.caption },
  filterBtnTextActive: { color: Theme.colors.white }
});