// components/DeleteConfirmationModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Sicherheitsabfrage vor dem Löschen der Datenbank

import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';

export default function DeleteConfirmationModal({ visible, onClose, onConfirm }) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header mit standardisiertem X */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Daten löschen</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtnContainer}>
              <Ionicons name="close" size={24} color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Ionicons 
              name="warning-outline" 
              size={48} 
              color={Theme.colors.error} 
              style={styles.warningIcon} 
            />
            <Text style={styles.message}>
              Möchtest du wirklich alle Portfolios und den gesamten Verlauf unwiderruflich löschen?
            </Text>
            <Text style={styles.subMessage}>
              Dein API-Key bleibt in den Einstellungen erhalten.
            </Text>

            <TouchableOpacity style={styles.deleteBtn} onPress={onConfirm}>
              <Text style={styles.deleteBtnText}>Ja, alles löschen</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: Theme.colors.overlayMedium, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalContainer: { 
    width: '85%', 
    backgroundColor: Theme.colors.surface, 
    borderRadius: Theme.borderRadius.l, 
    overflow: 'hidden',
    elevation: 5,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: Theme.spacing.l, 
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border, 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontSize: Theme.fontSize.subHeader, 
    fontWeight: Theme.fontWeight.bold, 
    color: Theme.colors.text 
  },
  closeBtnContainer: { padding: 5 },
  content: { 
    padding: Theme.spacing.l, 
    alignItems: 'center' 
  },
  warningIcon: { marginBottom: Theme.spacing.m },
  message: { 
    fontSize: Theme.fontSize.body, 
    color: Theme.colors.text, 
    textAlign: 'center', 
    fontWeight: Theme.fontWeight.semibold,
    marginBottom: Theme.spacing.s
  },
  subMessage: { 
    fontSize: Theme.fontSize.description, 
    color: Theme.colors.textSecondary, 
    textAlign: 'center', 
    marginBottom: Theme.spacing.xl 
  },
  deleteBtn: { 
    backgroundColor: Theme.colors.error, 
    width: '100%', 
    padding: Theme.spacing.m, 
    borderRadius: Theme.borderRadius.m, 
    alignItems: 'center',
    marginBottom: Theme.spacing.s
  },
  deleteBtnText: { 
    color: Theme.colors.white, 
    fontSize: Theme.fontSize.body, 
    fontWeight: Theme.fontWeight.bold 
  },
  cancelBtn: { 
    width: '100%', 
    padding: Theme.spacing.m, 
    alignItems: 'center' 
  },
  cancelBtnText: { 
    color: Theme.colors.textSecondary, 
    fontSize: Theme.fontSize.body, 
    fontWeight: Theme.fontWeight.medium 
  },
});