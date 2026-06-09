import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  SafeAreaView
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Clock, ShieldAlert } from 'lucide-react-native';

// API Service
import { getRequest, fireRequest, cancelRequest } from './services/tatkalService';

// Sub-components
import BookingStatusCard from './components/BookingStatusCard';
import CountdownTimer from './components/CountdownTimer';
import UrgencyScoreCard from './components/UrgencyScoreCard';

export default function CountdownScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { request } = route.params;

  // Timers and State
  const fireTimeMs = new Date(request.scheduled_fire_time).getTime();
  const initialSeconds = Math.max(0, Math.floor((fireTimeMs - Date.now()) / 1000));

  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [status, setStatus] = useState(request.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Animation opacity for FIRING state
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // 1. Countdown Timer Interval (1 second ticks)
  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  // 2. Database Polling Interval (every 5 seconds)
  useEffect(() => {
    let pollInterval;

    const performPoll = async () => {
      try {
        const res = await getRequest(request.id);
        const currentStatus = res.data?.status;

        if (currentStatus) {
          setStatus(currentStatus);
          
          if (currentStatus === 'CONFIRMED') {
            clearInterval(pollInterval);
            navigation.navigate('ConfirmationScreen', { request: res.data });
          } else if (currentStatus === 'FAILED') {
            clearInterval(pollInterval);
            setError('The automated booking request has failed.');
          }
        }
      } catch (err) {
        console.error('[CountdownScreen] Polling check failed:', err);
      }
    };

    // Run poll once immediately and set up interval
    performPoll();
    pollInterval = setInterval(performPoll, 5000);

    // Memory Leak Cleanup
    return () => clearInterval(pollInterval);
  }, [request.id, navigation]);

  // 3. Opacity Firing Animation (loops when status === 'FIRED')
  useEffect(() => {
    if (status === 'FIRED') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.2,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.timing(opacityAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      opacityAnim.setValue(1);
    }
  }, [status, opacityAnim]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this scheduled Tatkal automation?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await cancelRequest(request.id);
              Alert.alert('Cancelled', 'Your request has been cancelled.');
              navigation.navigate('TatkalHomeScreen');
            } catch (err) {
              console.error('[CountdownScreen] Cancellation failed:', err);
              Alert.alert('Error', 'Failed to cancel request. Please try again.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDemoFire = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fireRequest(request.id);
      navigation.navigate('ConfirmationScreen', { request: res.data });
    } catch (err) {
      console.error('[CountdownScreen] Demo fire request failed:', err);
      const errMsg = err.response?.data?.error || 'Failed to trigger demo fire simulation.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E8621A" />
        <Text style={styles.loadingText}>Processing booking transaction...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* State B: Firing Animation */}
        {status === 'FIRED' ? (
          <View style={styles.timerContainer}>
            <Animated.Text style={[styles.firingText, { opacity: opacityAnim }]}>
              Firing request...
            </Animated.Text>
            <Text style={styles.subtext}>Awaiting IRCTC gateway callback</Text>
          </View>
        ) : (
          // State A: Counting Down
          <CountdownTimer secondsLeft={secondsLeft} />
        )}

        {/* Urgency Score visual tracker */}
        {request.is_urgent && (
          <UrgencyScoreCard
            score={parseFloat(request.urgency_score || 0)}
            reason={request.urgency_reason}
          />
        )}

        {/* Journey Card details */}
        <BookingStatusCard request={request} />

        {error && (
          <View style={styles.errorCard}>
            <ShieldAlert color="#CC0000" size={24} style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {status === 'PENDING' && (
            <TouchableOpacity style={styles.outlineButton} onPress={handleCancel}>
              <Text style={styles.outlineButtonText}>Cancel Request</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={handleDemoFire}>
            <Text style={styles.primaryButtonText}>🚀 Demo Fire</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { flex: 1, paddingHorizontal: 16, paddingVertical: 32, justifyContent: 'space-between' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  timerContainer: { alignItems: 'center', marginTop: 20 },
  timerText: { fontSize: 56, fontWeight: '700', color: '#E8621A', fontVariant: ['tabular-nums'], letterSpacing: 1 },
  firingText: { fontSize: 40, fontWeight: '700', color: '#E8621A', textAlign: 'center' },
  subtext: { fontSize: 14, color: '#555555', marginTop: 6, fontWeight: '600', letterSpacing: 2 },
  badgeRow: { alignItems: 'center', marginTop: 12 },
  urgencyBadge: { backgroundColor: '#FFF3EC', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E8621A' },
  urgencyBadgeText: { color: '#E8621A', fontSize: 13, fontWeight: '700' },
  actions: { marginTop: 20, width: '100%' },
  primaryButton: { backgroundColor: '#E8621A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', width: '100%' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  outlineButton: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 12 },
  outlineButtonText: { color: '#E8621A', fontSize: 14, fontWeight: '600' },
  loadingText: { marginTop: 16, fontSize: 15, color: '#555555', fontWeight: '600' },
  errorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, borderLeftWidth: 4, borderLeftColor: '#CC0000', marginVertical: 12 },
  errorIcon: { marginRight: 10 },
  errorText: { fontSize: 13, color: '#CC0000', flex: 1 }
});
