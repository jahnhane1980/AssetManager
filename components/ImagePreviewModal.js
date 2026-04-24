// components/ImagePreviewModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Umstellung von nativem Modal auf animierte JS-View
// Update: Nutzt FinanceUtils für die automatische Punkt-zu-Komma Korrektur & decimal-pad

import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  TextInput, 
  Text, 
  Image, 
  Platform,
  Animated,
  BackHandler
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Theme } from './Theme';
import { FinanceUtils } from '../utils/FinanceUtils';

export default function ImagePreviewModal({ 
  visible, 
  imageUri, 
  amount, 
  onAmountChange, 
  onBlur, 
  onClose, 
  showFeedback 
}) {
  // Animation & Rendering States
  const [shouldRender, setShouldRender] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShouldRender(false));
    }
  }, [visible, fadeAnim]);

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

  if (!shouldRender) return null;

  return (
    <Animated.View style={[styles.previewOverlay, { opacity: fadeAnim }]}>
      <View style={styles.previewHeader}>
        <View style={styles.previewInputContainer}>
          <TextInput
            style={styles.previewInput}
            value={amount}
            onChangeText={(text) => onAmountChange(FinanceUtils.sanitizeCurrencyInput(text))}
            onBlur={onBlur}
            keyboardType="decimal-pad"
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  previewOverlay: { 
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100
  },
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