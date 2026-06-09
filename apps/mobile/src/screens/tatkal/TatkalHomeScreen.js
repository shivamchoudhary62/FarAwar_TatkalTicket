import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Clock, ShieldAlert, ArrowRight, BookOpen } from 'lucide-react-native';

// API Service & Custom Hook
import { cancelRequest, getMyLocks } from './services/tatkalService';
import useTatkal from './hooks/useTatkal';

// Booking Status Card Component (Created in subsequent slice)
import BookingStatusCard from './components/BookingStatusCard';

// Placeholder path to Member 1 context hook
import { useRailSaathi } from '../../context/RailSaathiContext';

export default function TatkalHomeScreen() {
  const navigation = useNavigation();
  const { currentUser } = useRailSaathi();

  const { activeRequest, loading, error, refetch } = useTatkal();

  const [locks, setLocks] = useState([]);
  const [locksExpanded, setLocksExpanded] = useState(false);

  const fetchLocks = async () => {
    try {
      const res = await getMyLocks();
      setLocks(res.data || []);
    } catch (e) {
      // Non-critical — silently fail
      setLocks([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
      fetchLocks();
    }, [refetch])
  );

  const handleCancel = (requestId) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this Tatkal booking request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRequest(requestId);
              Alert.alert('Success', 'Your Tatkal request has been cancelled.');
              refetch();
            } catch (err) {
              console.error('[TatkalHomeScreen] Cancel error:', err);
              Alert.alert('Error', 'Failed to cancel the request. Please try again.');
            }
          }
        }
      ]
    );
  };

  // State 1: Loading
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E8621A" />
      </View>
    );
  }

  // Error State
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.errorCard}>
          <ShieldAlert color="#E8621A" size={40} style={styles.errorIcon} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // State 3 & 4: Has Active/Pending or Confirmed Request
  if (activeRequest) {
    const isPending = activeRequest.status === 'PENDING' || activeRequest.status === 'FIRED';

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.screenTitle}>Tatkal Assist</Text>
          
          <BookingStatusCard
            request={activeRequest}
            onViewCountdown={isPending ? () => navigation.navigate('CountdownScreen', { request: activeRequest }) : undefined}
            onCancel={activeRequest.status === 'PENDING' ? () => handleCancel(activeRequest.id) : undefined}
          />

          {!isPending && (
            // State 4 - Confirmed details PNR display
            <View style={styles.actionCard}>
              <Text style={styles.cardHeader}>Simulated PNR Generated</Text>
              <Text style={styles.pnrText}>{activeRequest.simulated_pnr}</Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('MyBookingsScreen')}
              >
                <Text style={styles.primaryButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // State 2: Empty (No active requests)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Text style={styles.screenTitle}>Tatkal Assist</Text>
          <Text style={styles.subtitle}>Book before 10 AM, beat the bots.</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('PreFillFormScreen')}
        >
          <Text style={styles.primaryButtonText}>Book Tatkal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => navigation.navigate('SurrenderMarketScreen')}
        >
          <Text style={styles.outlineButtonText}>Surrender Market</Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Clock color="#E8621A" size={24} style={styles.infoIcon} />
          <Text style={styles.infoTitle}>How Pre-Fill Automation Works</Text>
          <Text style={styles.infoBody}>
            tout bots beat passengers because they bypass manual entry fields. 
            By submitting journey and passenger details in advance, our 
            automated engine fires your booking request at exactly 10:00 AM (AC) or 11:00 AM (Non-AC), 
            giving you bot-level execution speeds legally.
          </Text>
        </View>

        {locks.length > 0 && (
          <View style={styles.locksSection}>
            <TouchableOpacity style={styles.locksHeader} onPress={() => setLocksExpanded(!locksExpanded)}>
              <Text style={styles.locksTitle}>🔒 Active Journey Locks</Text>
              <View style={styles.locksPill}>
                <Text style={styles.locksPillText}>{locks.length} active</Text>
              </View>
              <Text style={styles.locksChevron}>{locksExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {locksExpanded && locks.map((lock) => (
              <View key={lock.id} style={styles.lockCard}>
                <Text style={styles.lockRoute}>{lock.from_station} → {lock.to_station}</Text>
                <Text style={styles.lockWindow}>
                  {new Date(lock.departure_datetime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                  {' → '}
                  {new Date(lock.arrival_datetime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                </Text>
                <View style={styles.pnrBadge}>
                  <Text style={styles.pnrBadgeText}>PNR: {lock.pnr || '—'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 24 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', paddingHorizontal: 16 },
  headerSection: { marginBottom: 32 },
  screenTitle: { fontSize: 24, fontWeight: '700', color: '#111111', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#555555' },
  primaryButton: { backgroundColor: '#E8621A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 12 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  outlineButton: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 24 },
  outlineButtonText: { color: '#E8621A', fontSize: 14, fontWeight: '600' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, marginTop: 8 },
  infoIcon: { marginBottom: 12 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: '#111111', marginBottom: 8 },
  infoBody: { fontSize: 13, color: '#555555', lineHeight: 18 },
  actionCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, marginTop: 16, alignItems: 'center' },
  badgeContainer: { width: '100%', alignItems: 'flex-start', marginBottom: 12 },
  badge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 12 },
  pendingBadge: { backgroundColor: '#FFF3EC' },
  pendingBadgeText: { color: '#E8621A', fontSize: 12, fontWeight: '600' },
  confirmedBadge: { backgroundColor: '#E8F5E9' },
  confirmedBadgeText: { color: '#27AE60', fontSize: 12, fontWeight: '600' },
  cardHeader: { fontSize: 16, fontWeight: '700', color: '#111111', marginBottom: 4 },
  cardSubtext: { fontSize: 14, color: '#555555', marginBottom: 20 },
  pnrText: { fontSize: 32, fontWeight: '700', fontFamily: 'Courier New', color: '#E8621A', letterSpacing: 2, marginVertical: 16 },
  errorCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, alignItems: 'center', shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, width: '100%' },
  errorIcon: { marginBottom: 16 },
  errorText: { fontSize: 14, color: '#555555', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24 },
  retryButtonText: { color: '#E8621A', fontSize: 14, fontWeight: '600' },
  locksSection: { marginTop: 24, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  locksHeader: { flexDirection: 'row', alignItems: 'center' },
  locksTitle: { fontSize: 14, fontWeight: '600', color: '#555555', flex: 1 },
  locksPill: { backgroundColor: '#FFF3EC', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 10, marginRight: 8 },
  locksPillText: { fontSize: 11, fontWeight: '600', color: '#E8621A' },
  locksChevron: { fontSize: 12, color: '#999999' },
  lockCard: { backgroundColor: '#FAFAFA', borderRadius: 10, padding: 12, marginTop: 10, borderLeftWidth: 3, borderLeftColor: '#E8621A' },
  lockRoute: { fontSize: 14, fontWeight: '700', color: '#111111', marginBottom: 4 },
  lockWindow: { fontSize: 12, color: '#555555', marginBottom: 6 },
  pnrBadge: { backgroundColor: '#FFF3EC', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8, alignSelf: 'flex-start' },
  pnrBadgeText: { fontSize: 11, fontWeight: '600', color: '#E8621A', fontFamily: 'Courier New' }
});
