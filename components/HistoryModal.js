// components/HistoryModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Schließen-Icon Farbe auf Primärfarbe vereinheitlicht

import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';

export default function HistoryModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vermögensverlauf</Text>
          {/* Farbe auf Primärfarbe angepasst */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtnContainer}>
            <Ionicons name="close" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.dummyChart}>
            <Ionicons name="analytics" size={64} color={Theme.colors.border} />
            <Text style={styles.dummyText}>Hier kommt die detaillierte Historie hin.</Text>
          </View>
          
          <Text style={styles.sectionTitle}>Letzte Aktivitäten</Text>
          <View style={styles.dummyList}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.dummyItem}>
                <Ionicons name="time-outline" size={20} color={Theme.colors.textSecondary} style={{marginRight: 10}} />
                <Text style={styles.itemText}>Dummy Eintrag #{i} - Daten folgen</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: Theme.spacing.l, 
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: Theme.spacing.m,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1, 
    borderBottomColor: Theme.colors.border 
  },
  headerTitle: { fontSize: Theme.fontSize.header, fontWeight: Theme.fontWeight.bold, color: Theme.colors.text },
  closeBtnContainer: { padding: 5 }, // Style-Name vereinheitlicht
  content: { padding: Theme.spacing.l },
  dummyChart: { 
    height: 200, 
    backgroundColor: Theme.colors.surface, 
    borderRadius: Theme.borderRadius.m, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: Theme.spacing.l,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed'
  },
  dummyText: { marginTop: 15, color: Theme.colors.textSecondary, textAlign: 'center' },
  sectionTitle: { fontSize: Theme.fontSize.subHeader, fontWeight: Theme.fontWeight.semibold, color: Theme.colors.text, marginBottom: Theme.spacing.m },
  dummyList: { gap: Theme.spacing.s },
  dummyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, padding: Theme.spacing.m, borderRadius: Theme.borderRadius.s },
  itemText: { color: Theme.colors.text }
});