// components/HistoryModal.js
// Modus: Code-Buddy | Regel 6: Full-Body | Regel 7: Prettify
// Refactoring: Umstellung auf FlatList und fixiertes Pagination-Layout

import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Modal, 
  TouchableOpacity, 
  FlatList,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from './Theme';
import AssetRepository from '../repositories/AssetRepository';
import { Security } from './Security';

export default function HistoryModal({ visible, onClose }) {
  const [history, setHistory] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchHistory = useCallback(async (page, size) => {
    setIsLoading(true);
    try {
      const offset = (page - 1) * size;
      const data = await AssetRepository.getHistory(0, size + 1, offset, 'DESC');
      
      if (data.length > size) {
        setHasMore(true);
        setHistory(data.slice(0, size));
      } else {
        setHasMore(false);
        setHistory(data);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Historie:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      const init = async () => {
        const size = await Security.getPageSize();
        setPageSize(size);
        setCurrentPage(1);
        await fetchHistory(1, size);
      };
      init();
    }
  }, [visible, fetchHistory]);

  const handleNextPage = () => {
    if (hasMore && !isLoading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchHistory(nextPage, pageSize);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1 && !isLoading) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchHistory(prevPage, pageSize);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.historyItem}>
      <View style={styles.itemInfo}>
        <Ionicons name="time-outline" size={18} color={Theme.colors.textSecondary} style={styles.icon} />
        <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
      </View>
      <Text style={styles.valueText}>
        {item.value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vermögensverlauf</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtnContainer}>
            <Ionicons name="close" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.sectionTitle}>Aktivitäten (Seite {currentPage})</Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={history}
              renderItem={renderItem}
              keyExtractor={(item, index) => item.timestamp?.toString() || index.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Keine Einträge vorhanden.</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Fixierte Pagination-Controls */}
        <View style={styles.paginationFooter}>
          <TouchableOpacity 
            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} 
            onPress={handlePrevPage}
            disabled={currentPage === 1 || isLoading}
          >
            <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? Theme.colors.border : Theme.colors.white} />
            <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>Zurück</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.pageBtn, !hasMore && styles.pageBtnDisabled]} 
            onPress={handleNextPage}
            disabled={!hasMore || isLoading}
          >
            <Text style={[styles.pageBtnText, !hasMore && styles.pageBtnTextDisabled]}>Weiter</Text>
            <Ionicons name="chevron-forward" size={20} color={!hasMore ? Theme.colors.border : Theme.colors.white} />
          </TouchableOpacity>
        </View>
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
  closeBtnContainer: { padding: 5 },
  mainContent: { flex: 1, paddingHorizontal: Theme.spacing.l, paddingTop: Theme.spacing.l },
  sectionTitle: { fontSize: Theme.fontSize.subHeader, fontWeight: Theme.fontWeight.semibold, color: Theme.colors.text, marginBottom: Theme.spacing.m },
  listContent: { paddingBottom: Theme.spacing.m },
  historyItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: Theme.colors.surface, 
    padding: Theme.spacing.m, 
    borderRadius: Theme.borderRadius.m,
    marginBottom: Theme.spacing.s,
    elevation: 1,
    shadowColor: Theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemInfo: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 8 },
  dateText: { color: Theme.colors.textSecondary, fontSize: Theme.fontSize.caption },
  valueText: { color: Theme.colors.text, fontWeight: Theme.fontWeight.bold, fontSize: Theme.fontSize.body },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: Theme.colors.textSecondary, fontStyle: 'italic' },
  paginationFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: Theme.spacing.l,
    paddingBottom: Platform.OS === 'ios' ? 40 : Theme.spacing.l,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    gap: Theme.spacing.m 
  },
  pageBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    backgroundColor: Theme.colors.primary, 
    padding: Theme.spacing.m, 
    borderRadius: Theme.borderRadius.m, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  pageBtnDisabled: { backgroundColor: Theme.colors.border },
  pageBtnText: { color: Theme.colors.white, fontWeight: Theme.fontWeight.bold, marginHorizontal: 5 },
  pageBtnTextDisabled: { color: Theme.colors.textSecondary }
});