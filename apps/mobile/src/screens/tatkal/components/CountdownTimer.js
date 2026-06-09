import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CountdownTimer({ secondsLeft }) {
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
      <Text style={styles.subtext}>HH : MM : SS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: 16 },
  timerText: { fontSize: 56, fontWeight: '700', color: '#E8621A', fontVariant: ['tabular-nums'], letterSpacing: 1 },
  subtext: { fontSize: 14, color: '#555555', marginTop: 6, fontWeight: '600', letterSpacing: 2 }
});
