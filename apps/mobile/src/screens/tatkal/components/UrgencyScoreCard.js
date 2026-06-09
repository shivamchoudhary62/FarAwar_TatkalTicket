import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function UrgencyScoreCard({ score, reason }) {
  const normalizedScore = Math.max(0, Math.min(10, score || 0));
  const fillWidth = `${(normalizedScore / 10) * 100}%`;

  const getBarColor = (val) => {
    if (val >= 8) return '#E8621A';
    if (val >= 5) return '#F5A623';
    return '#27AE60';
  };

  const capitalize = (str) => {
    if (!str) return 'Personal';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.scoreNum}>{normalizedScore.toFixed(1)}</Text>
        <Text style={styles.label}>
          Urgency Score: <Text style={{ fontWeight: '700' }}>{normalizedScore.toFixed(1)} / 10</Text>
          {reason ? ` — ${capitalize(reason)}` : ''}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: fillWidth, backgroundColor: getBarColor(normalizedScore) }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginVertical: 10, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3, borderWidth: 1, borderColor: '#E0E0E0', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  scoreNum: { fontSize: 28, fontWeight: '800', color: '#111111', marginRight: 12 },
  label: { fontSize: 13, color: '#555555', flex: 1 },
  track: { height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, width: '100%', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 }
});
