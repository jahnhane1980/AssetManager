// components/MenuModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fix: Platform Import hinzugefügt

import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  Platform // Fix: Import hinzugefügt
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';

export default function MenuModal({ visible, onClose, onOpenSettings, onOpenHistory }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
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
              onPress={() => { onOpenSettings(); onClose(); }}
            >
              <Ionicons name="settings-outline" size={20} color={Theme.colors.text} style={styles.icon} />
              <Text style={styles.menuText}>Einstellungen</Text>
            </TouchableOpacity>

          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  menuContainer: { 
    position: 'absolute', 
    right: 15, 
    top: Platform.OS === 'ios' ? 70 : 30, 
    backgroundColor: Theme.colors.surface, 
    borderRadius: Theme.borderRadius.m, 
    width: 180,
    elevation: 5,
    shadowColor: '#000',
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
  menuText: { fontSize: 16, color: Theme.colors.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: Theme.colors.border }
});