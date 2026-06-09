import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, ActivityIndicator, Alert, Modal, SafeAreaView
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, ShieldAlert } from 'lucide-react-native';

import { getSurrenders, listSurrender, requestSurrender } from './services/tatkalService';
import SurrenderListItem from './components/SurrenderListItem';
import { useRailSaathi } from '../../context/RailSaathiContext';

export default function SurrenderMarketScreen() {
  const navigation = useNavigation();
  const { currentUser } = useRailSaathi();

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState(null);
  const [itemErrors, setItemErrors] = useState({});
  const [requestingId, setRequestingId] = useState(null);

  const [filters, setFilters] = useState({ from: '', to: '', date: '' });
  const [appliedFilters, setAppliedFilters] = useState({ from: '', to: '', date: '' });

  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [newTicket, setNewTicket] = useState({ pnr: '', from: '', to: '', date: '', class: '3A', train: '' });

  const fetchListings = useCallback(async (activeFilters) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = {};
      if (activeFilters.from) queryParams.from = activeFilters.from.toUpperCase().trim();
      if (activeFilters.to) queryParams.to = activeFilters.to.toUpperCase().trim();
      if (activeFilters.date) queryParams.date = activeFilters.date.trim();

      const res = await getSurrenders(queryParams);
      setListings(res.data || []);
    } catch (err) {
      console.error('[SurrenderMarketScreen] Fetch error:', err);
      setError('Failed to load surrender listings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchListings(appliedFilters); }, [fetchListings, appliedFilters]));

  const handleFilter = () => {
    setAppliedFilters(filters);
    fetchListings(filters);
  };

  const handleClear = () => {
    const cleared = { from: '', to: '', date: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
    fetchListings(cleared);
  };

  const handleRequest = (item) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = new Date(item.travel_date);
    const formattedDate = isNaN(date.getTime()) ? item.travel_date : `${date.getDate()} ${months[date.getMonth()]}`;

    Alert.alert(
      'Confirm Request',
      `Request this ticket from ${item.from_station} to ${item.to_station} on ${formattedDate}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Request',
          onPress: async () => {
            try {
              setRequestingId(item.id);
              setItemErrors(prev => ({ ...prev, [item.id]: null }));
              await requestSurrender(item.id);
              setListings(prev => prev.map(l => l.id === item.id ? { ...l, status: 'MATCHED' } : l));
            } catch (err) {
              const errMsg = err.response?.data?.error || 'Failed to request ticket.';
              setItemErrors(prev => ({ ...prev, [item.id]: errMsg }));
            } finally {
              setRequestingId(null);
            }
          }
        }
      ]
    );
  };

  const handleListTicket = async () => {
    const { pnr, from, to, date, class: cls, train } = newTicket;
    if (!pnr || pnr.length !== 10) return Alert.alert('Invalid PNR', 'Please enter a 10-digit PNR.');
    if (!from || !to || !date) return Alert.alert('Fields Required', 'From, To, and Date are required.');

    try {
      setModalLoading(true);
      await listSurrender({
        pnr,
        from_station: from.toUpperCase().trim(),
        to_station: to.toUpperCase().trim(),
        travel_date: date.trim(),
        class: cls.toUpperCase().trim(),
        train_number: train.trim() || null
      });
      Alert.alert('Success', 'Your ticket has been listed for surrender.');
      setShowModal(false);
      setNewTicket({ pnr: '', from: '', to: '', date: '', class: '3A', train: '' });
      fetchListings(appliedFilters);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to list ticket. Check your input.';
      Alert.alert('Listing Failed', msg);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={{ padding: 4, marginRight: 8 }} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#111111" size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Surrender Market</Text>
          <Text style={{ fontSize: 11, color: '#555555', marginTop: 2 }}>Request a confirmed Tatkal ticket from verified passengers.</Text>
        </View>
        <TouchableOpacity style={styles.listBtn} onPress={() => setShowModal(true)}>
          <Text style={{ color: '#E8621A', fontSize: 11, fontWeight: '600' }}>+ List My Ticket</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <TextInput
          style={styles.filterInput}
          placeholder="From"
          placeholderTextColor="#AAAAAA"
          value={filters.from}
          onChangeText={val => setFilters(p => ({ ...p, from: val }))}
          autoCapitalize="characters"
        />
        <TextInput
          style={styles.filterInput}
          placeholder="To"
          placeholderTextColor="#AAAAAA"
          value={filters.to}
          onChangeText={val => setFilters(p => ({ ...p, to: val }))}
          autoCapitalize="characters"
        />
        <TextInput
          style={styles.filterInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#AAAAAA"
          value={filters.date}
          onChangeText={val => setFilters(p => ({ ...p, date: val }))}
        />
        <TouchableOpacity style={styles.filterOutlineBtn} onPress={handleFilter}>
          <Text style={{ color: '#E8621A', fontSize: 13, fontWeight: '600' }}>Filter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ paddingVertical: 8, paddingHorizontal: 4 }} onPress={handleClear}>
          <Text style={{ color: '#E8621A', fontSize: 13, fontWeight: '600' }}>Clear</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#E8621A" /></View>
      ) : error ? (
        <View style={styles.center}>
          <View style={styles.errorCard}>
            <ShieldAlert color="#E8621A" size={40} style={{ marginBottom: 12 }} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchListings(appliedFilters)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: '#777777', fontSize: 14, textAlign: 'center' }}>No tickets available for your route. Check back soon.</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <SurrenderListItem
              surrender={item}
              onRequest={handleRequest}
              isRequesting={requestingId === item.id}
            />
          )}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>List Confirmed Ticket</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="10-digit PNR"
              placeholderTextColor="#AAAAAA"
              keyboardType="numeric"
              maxLength={10}
              value={newTicket.pnr}
              onChangeText={val => setNewTicket(p => ({ ...p, pnr: val.replace(/[^0-9]/g, '') }))}
            />
            <View style={{ flexDirection: 'row' }}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginRight: 8 }]}
                placeholder="From (e.g. NDLS)"
                placeholderTextColor="#AAAAAA"
                autoCapitalize="characters"
                value={newTicket.from}
                onChangeText={val => setNewTicket(p => ({ ...p, from: val }))}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="To (e.g. MMCT)"
                placeholderTextColor="#AAAAAA"
                autoCapitalize="characters"
                value={newTicket.to}
                onChangeText={val => setNewTicket(p => ({ ...p, to: val }))}
              />
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Travel Date (YYYY-MM-DD)"
              placeholderTextColor="#AAAAAA"
              value={newTicket.date}
              onChangeText={val => setNewTicket(p => ({ ...p, date: val }))}
            />
            <View style={{ flexDirection: 'row' }}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginRight: 8 }]}
                placeholder="Class (e.g. 3A)"
                placeholderTextColor="#AAAAAA"
                autoCapitalize="characters"
                value={newTicket.class}
                onChangeText={val => setNewTicket(p => ({ ...p, class: val }))}
              />
              <TextInput
                style={[styles.modalInput, { flex: 1 }]}
                placeholder="Train No. (Optional)"
                placeholderTextColor="#AAAAAA"
                keyboardType="numeric"
                value={newTicket.train}
                onChangeText={val => setNewTicket(p => ({ ...p, train: val }))}
              />
            </View>

            {modalLoading ? (
              <ActivityIndicator color="#E8621A" size="large" style={{ marginVertical: 12 }} />
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowModal(false)}>
                  <Text style={{ color: '#555555', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={handleListTicket}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>List Ticket</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111111' },
  listBtn: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
  filterBar: { flexDirection: 'row', padding: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', alignItems: 'center' },
  filterInput: { flex: 1, height: 36, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 8, marginRight: 6, fontSize: 13, backgroundColor: '#F9F9F9', color: '#111111' },
  filterOutlineBtn: { borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#FFFFFF', marginRight: 6 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', width: '100%' },
  errorText: { fontSize: 14, color: '#555555', textAlign: 'center', marginBottom: 16 },
  retryBtn: { borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 },
  retryBtnText: { color: '#E8621A', fontSize: 14, fontWeight: '600' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 16, textAlign: 'center' },
  modalInput: { height: 44, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 12, marginBottom: 12, fontSize: 14, color: '#111111', backgroundColor: '#FFFFFF' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtn: { flex: 1, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F5F5F5', marginRight: 8 },
  submitBtn: { backgroundColor: '#E8621A', marginLeft: 8 }
});
