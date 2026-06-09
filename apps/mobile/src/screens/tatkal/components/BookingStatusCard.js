import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function BookingStatusCard({ request, onViewCountdown, onCancel }) {
  if (!request) return null;

  const {
    from_station, to_station, travel_date, class: trainClass,
    status, is_urgent, passengers
  } = request;

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (s) => {
    switch (s?.toUpperCase()) {
      case 'CONFIRMED': return '#27AE60';
      case 'CANCELLED': return '#888888';
      case 'FAILED': return '#CC0000';
      default: return '#E8621A'; // PENDING / FIRED
    }
  };

  const isPending = status === 'PENDING' || status === 'FIRED';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.routeText}>{from_station} → {to_station}</Text>
        <View style={styles.badgeRow}>
          {is_urgent && (
            <View style={[styles.badge, { backgroundColor: '#FFF3EC', borderColor: '#E8621A', borderWidth: 1, marginRight: 6 }]}>
              <Text style={{ color: '#E8621A', fontSize: 10, fontWeight: '700' }}>⚡ Urgent</Text>
            </View>
          )}
          <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.badgeText}>{status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoVal}>{formatDate(travel_date)}  ·  {trainClass}</Text>
        <Text style={styles.infoLabel}>{passengers?.length || 0} Passenger(s)</Text>
      </View>

      {onViewCountdown && isPending && (
        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.75} onPress={onViewCountdown}>
          <Text style={styles.primaryBtnText}>View Countdown</Text>
        </TouchableOpacity>
      )}

      {onCancel && status === 'PENDING' && (
        <TouchableOpacity style={styles.outlineBtn} activeOpacity={0.75} onPress={onCancel}>
          <Text style={styles.outlineBtnText}>Cancel Request</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginVertical: 10, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: '#E0E0E0', width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  routeText: { fontSize: 16, fontWeight: '700', color: '#111111' },
  badgeRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  infoVal: { fontSize: 14, color: '#111111', fontWeight: '600' },
  infoLabel: { fontSize: 13, color: '#555555' },
  primaryBtn: { backgroundColor: '#E8621A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', width: '100%', marginTop: 12 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  outlineBtn: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 12, paddingVertical: 10, alignItems: 'center', width: '100%', marginTop: 8 },
  outlineBtnText: { color: '#E8621A', fontSize: 14, fontWeight: '600' }
});
