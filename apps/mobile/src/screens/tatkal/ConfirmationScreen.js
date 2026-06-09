import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Check, Train, ShieldAlert } from 'lucide-react-native';

export default function ConfirmationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { request } = route.params;

  const handleBackToHome = () => {
    // Reset the navigation stack so the user cannot go back to CountdownScreen
    navigation.reset({
      index: 0,
      routes: [{ name: 'TatkalHomeScreen' }],
    });
  };

  const formatTime = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '10:00:02 AM';
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return '10:00:02 AM';
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Success Header */}
        <View style={styles.header}>
          <View style={styles.checkmarkCircle}>
            <Check color="#FFFFFF" size={40} strokeWidth={3} />
          </View>
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>Your Tatkal request was successfully fired.</Text>
        </View>

        {/* Confirmation Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>PNR NUMBER</Text>
          <Text style={styles.pnrValue}>{request.simulated_pnr}</Text>

          <View style={styles.divider} />

          {/* Route Section */}
          <View style={styles.routeRow}>
            <Text style={styles.stationText}>{request.from_station}</Text>
            <View style={styles.routeIconLine}>
              <View style={styles.line} />
              <Train color="#E8621A" size={16} />
              <View style={styles.line} />
            </View>
            <Text style={styles.stationText}>{request.to_station}</Text>
          </View>

          {/* Details Rows */}
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Travel Date</Text>
              <Text style={styles.gridValue}>{formatDate(request.travel_date)}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Class</Text>
              <Text style={styles.gridValue}>{request.class}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Confirmed At:</Text>
            <Text style={styles.infoValue}>{formatTime(request.updated_at)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Passengers:</Text>
            <Text style={styles.infoValue}>{request.passengers?.length || 0} Passenger(s)</Text>
          </View>
        </View>

        {/* Important Disclaimer Note Card */}
        <View style={styles.disclaimerCard}>
          <ShieldAlert color="#E8621A" size={18} style={styles.disclaimerIcon} />
          <Text style={styles.disclaimerText}>
            ⚠️ This is a simulated PNR for demo purposes. Live IRCTC integration is the production next step.
          </Text>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('MyBookingsScreen')}
          >
            <Text style={styles.primaryButtonText}>📋 My Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineButton} onPress={handleBackToHome}>
            <Text style={styles.outlineButtonText}>← Back to Home</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 32, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  checkmarkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#27AE60', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#27AE60', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  title: { fontSize: 24, fontWeight: '700', color: '#111111', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#555555', textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  cardLabel: { fontSize: 12, color: '#555555', fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  pnrValue: { fontSize: 28, fontWeight: '700', fontFamily: 'Courier New', color: '#E8621A', letterSpacing: 4, textAlign: 'center', marginBottom: 12 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 14 },
  routeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, marginBottom: 16 },
  stationText: { fontSize: 20, fontWeight: '700', color: '#111111' },
  routeIconLine: { flexDirection: 'row', alignItems: 'center', flex: 1, marginHorizontal: 16 },
  line: { height: 1.5, backgroundColor: '#E0E0E0', flex: 1, marginHorizontal: 4 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, backgroundColor: '#F9F9F9', borderRadius: 10, padding: 12 },
  gridCell: { flex: 1 },
  gridLabel: { fontSize: 11, color: '#555555', marginBottom: 4 },
  gridValue: { fontSize: 14, fontWeight: '700', color: '#111111' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  infoLabel: { fontSize: 13, color: '#555555' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#111111' },
  disclaimerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3EC', borderColor: '#E8621A', borderWidth: 1, borderRadius: 8, padding: 12, width: '100%', marginBottom: 32 },
  disclaimerIcon: { marginRight: 10 },
  disclaimerText: { fontSize: 12, color: '#555555', flex: 1, lineHeight: 16 },
  footer: { width: '100%' },
  primaryButton: { backgroundColor: '#E8621A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 12 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  outlineButton: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', width: '100%' },
  outlineButtonText: { color: '#E8621A', fontSize: 14, fontWeight: '600' }
});
