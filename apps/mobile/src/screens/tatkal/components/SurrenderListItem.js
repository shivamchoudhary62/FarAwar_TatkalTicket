import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

export default function SurrenderListItem({ surrender, onRequest, isRequesting }) {
  if (!surrender) return null;

  const isAvailable = surrender.status === 'LISTED';

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

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.routeText}>
          {surrender.from_station} → {surrender.to_station}
        </Text>
        <View style={[
          styles.statusPill,
          isAvailable ? styles.availablePill : styles.matchedPill
        ]}>
          <Text style={styles.statusPillText}>
            {isAvailable ? 'Available' : 'Matched'}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          {formatDate(surrender.travel_date)}  ·  {surrender.class}
        </Text>
        <Text style={styles.pnrLabel}>
          PNR: <Text style={styles.pnrValue}>{surrender.pnr ? surrender.pnr.slice(0, 4) + '••••••' : ''}</Text>
        </Text>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.button, !isAvailable && styles.disabledButton]}
          onPress={() => onRequest(surrender)}
          disabled={!isAvailable || isRequesting}
          activeOpacity={0.75}
        >
          {isRequesting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {isAvailable ? 'Request This Ticket' : 'Matched'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: '#E0E0E0' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  routeText: { fontSize: 16, fontWeight: '700', color: '#111111' },
  statusPill: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  availablePill: { backgroundColor: '#27AE60' },
  matchedPill: { backgroundColor: '#E8621A' },
  statusPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  infoText: { fontSize: 14, color: '#555555' },
  pnrLabel: { fontSize: 12, color: '#AAAAAA' },
  pnrValue: { fontFamily: 'Courier New', color: '#555555', fontWeight: '600' },
  actionContainer: { width: '100%' },
  button: { backgroundColor: '#E8621A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', width: '100%' },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  disabledButton: { backgroundColor: '#CCCCCC' }
});
