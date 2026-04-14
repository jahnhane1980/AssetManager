// components/AddAssetButton.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Fokus: Kapselung des Floating Action Buttons (FAB) mit Navigation-Hook

import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Theme } from './Theme';

export default function AddAssetButton() {
  const navigation = useNavigation();

  const handlePress = () => {
    console.log("[DEBUG] AddAssetButton: Navigiere zu AddAsset");
    navigation.navigate('AddAsset', { initialProvider: null });
  };

  return (
    <TouchableOpacity style={styles.fab} onPress={handlePress}>
      <Ionicons name="add" size={32} color={Theme.colors.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: { 
    position: 'absolute', 
    right: 25, 
    bottom: 25, 
    backgroundColor: Theme.colors.primary, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 99
  }
});