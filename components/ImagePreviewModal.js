// components/ImagePreviewModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify

import React from 'react';
import { 
  StyleSheet, 
  View, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  Text, 
  Image, 
  Platform 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from './Theme';
import Notification from './Notification';

export default function ImagePreviewModal({ 
  visible, 
  imageUri, 
  amount, 
  onAmountChange, 
  onBlur, 
  onClose, 
  showFeedback 
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.previewOverlay}>
        <View style={styles.previewHeader}>
          <View style={styles.previewInputContainer}>
            <TextInput
              style={styles.previewInput}
              value={amount}
              onChangeText={onAmountChange}
              onBlur={onBlur}
              keyboardType="numeric"
              autoFocus={false}
              placeholder="0,00"
            />
            <Text style={styles.previewCurrency}>€</Text>
            {showFeedback && (
              <View style={styles.successBadge}>
                <MaterialCommunityIcons name="check-circle" size={20} color={Theme.colors.success} />
              </View>
            )}
          </View>
          
          <TouchableOpacity onPress={onClose} style={styles.previewCloseBtn}>
            <Ionicons name="close" size={28} color={Theme.colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              style={styles.previewImage} 
              resizeMode="contain" 
            />
          ) : (
            <Text style={{color: '#fff'}}>Bild nicht verfügbar</Text>
          )}
        </View>
        
        <Notification />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  previewOverlay: { flex: 1, backgroundColor: '#000' },
  previewHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Theme.spacing.l, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    paddingBottom: Theme.spacing.m, 
    backgroundColor: Theme.colors.surface 
  },
  previewInputContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    position: 'relative' 
  },
  previewInput: { 
    fontSize: 24, 
    fontWeight: Theme.fontWeight.bold, 
    color: Theme.colors.text, 
    minWidth: 80, 
    textAlign: 'right', 
    borderBottomWidth: 2, 
    borderBottomColor: Theme.colors.primary, 
    paddingHorizontal: 5 
  },
  previewCurrency: { 
    fontSize: 24, 
    fontWeight: Theme.fontWeight.bold, 
    color: Theme.colors.text, 
    marginLeft: 5 
  },
  previewCloseBtn: { padding: 5 },
  imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '100%', height: '100%' },
  successBadge: { position: 'absolute', right: -30, top: 5 }
});