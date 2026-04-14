// components/MenuModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Umstellung auf JS-View mit Animation und Android-Z-Order Fix

import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Platform,
  Animated,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';
import LogService from '../services/LogService';

export default function MenuModal({ visible, onClose, onOpenSettings, onOpenHistory, onOpenDeleteConfirm, onOpenBackup }) {
  const [shouldRender, setShouldRender] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log(`[DEBUG] MenuModal: visible Prop geändert zu ${visible}`);
    if (visible) {
      setShouldRender(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, fadeAnim]);

  // Back-Handler für Android
  useEffect(() => {
    if (visible) {
      const backAction = () => {
        onClose();
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, [visible, onClose]);

  const handleShareLogs = async () => {
    await LogService.shareLogs();
    onClose();
  };

  if (!shouldRender) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => { onOpenHistory(); onClose(); }}
        >
          <Ionicons name="analytics-outline" size={20} color={Theme.colors.text} style={styles.icon} />
          <Text style={styles.menuText}>Verlauf</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => { onOpenBackup(); onClose(); }}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={Theme.colors.text} style={styles.icon} />
          <Text style={styles.menuText}>Backup & Restore</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={handleShareLogs}
        >
          <Ionicons name="document-text-outline" size={20} color={Theme.colors.text} style={styles.icon} />
          <Text style={styles.menuText}>Logs senden</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => { onOpenSettings(); onClose(); }}
        >
          <Ionicons name="settings-outline" size={20} color={Theme.colors.text} style={styles.icon} />
          <Text style={styles.menuText}>Einstellungen</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => { onOpenDeleteConfirm(); onClose(); }}
        >
          <Ionicons name="trash-outline" size={20} color={Theme.colors.error} style={styles.icon} />
          <Text style={[styles.menuText, { color: Theme.colors.error }]}>Daten löschen</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    zIndex: 1000, // Deutlich erhöht
    elevation: 20 // Wichtig für Android, um über FAB zu liegen
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Theme.colors.overlayLight
  },
  menuContainer: { 
    position: 'absolute', 
    right: 15, 
    top: Platform.OS === 'ios' ? 70 : 30, 
    backgroundColor: Theme.colors.surface, 
    borderRadius: Theme.borderRadius.m, 
    width: 220, 
    elevation: 25, // Über dem Overlay-Hintergrund
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden'
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Theme.spacing.m, 
    paddingHorizontal: Theme.spacing.l 
  },
  icon: { marginRight: 15 },
  menuText: { fontSize: Theme.fontSize.body, color: Theme.colors.text, fontWeight: Theme.fontWeight.medium },
  divider: { height: 1, backgroundColor: Theme.colors.border }
});