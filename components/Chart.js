// Chart.js
// Regel 6 & 7: Vollständiger Inhalt & Saubere Formatierung
// Refactoring: Nutzung von AppConstants

import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Theme } from './Theme';
import { AppConstants } from '../constants/AppConstants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const { HEIGHT, PADDING } = AppConstants.CHART;

export default function Chart({ data }) {
  if (!data || data.length < 2) return null;

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
    <View style={{ height: HEIGHT, width: '100%', alignItems: 'center' }}>
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
}