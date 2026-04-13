// components/Notification.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Globale Feedback-Komponente mit Auto-Hide Logik

import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';

export default function Notification({ notification, onHide }) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (notification) {
      // Einblenden
      Animated.spring(slideAnim, {
        toValue: 20,
        useNativeDriver: true,
        friction: 8,
      }).start();

      // Automatisches Ausblenden nach 3 Sekunden
      const timer = setTimeout(() => {
        hide();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const hide = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onHide());
  };

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success': return Theme.colors.success;
      case 'error': return Theme.colors.error;
      default: return Theme.colors.primary;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY: slideAnim }], backgroundColor: getBgColor() }
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={getIcon()} size={20} color={Theme.colors.white} />
        <Text style={styles.text}>{notification.message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    right: 20,
    borderRadius: Theme.borderRadius.m,
    padding: Theme.spacing.m,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { color: Theme.colors.white, fontWeight: Theme.fontWeight.semibold, fontSize: Theme.fontSize.caption, flex: 1 }
});