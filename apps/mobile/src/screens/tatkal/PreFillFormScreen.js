import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';

// API Service & Context
import { submitPrefill } from './services/tatkalService';
import { useRailSaathi } from '../../context/RailSaathiContext';

// Extracted Sub-components
import PassengerListEditor from './components/PassengerListEditor';
import JourneyDetailsForm from './components/JourneyDetailsForm';
import UrgencyDetailsForm from './components/UrgencyDetailsForm';

export default function PreFillFormScreen() {
  const navigation = useNavigation();
  const { currentUser } = useRailSaathi();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overlapError, setOverlapError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    from_station: '',
    to_station: '',
    travel_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    class: '3A',
    train_number: '',
    passengers: [],
    is_urgent: false,
    urgency_reason: 'personal',
    urgency_document_url: ''
  });

  // Pre-fill fields from context on mount
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        class: currentUser.preferred_class || '3A',
        passengers: [{ name: currentUser.name || '', age: '', gender: 'M', berth_preference: '' }]
      }));
    }
  }, [currentUser]);

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.from_station || !formData.to_station) {
        return setError('Please enter both origin and destination stations.');
      }
      if (formData.from_station.toUpperCase() === formData.to_station.toUpperCase()) {
        return setError('Origin and Destination stations cannot be identical.');
      }
      setStep(2);
    } else if (step === 2) {
      const invalid = formData.passengers.some(p => !p.name || !p.age);
      if (invalid) {
        return setError('Please enter a valid name and age for every passenger.');
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        ...formData,
        from_station: formData.from_station.toUpperCase(),
        to_station: formData.to_station.toUpperCase(),
        travel_date: formData.travel_date.toISOString().split('T')[0]
      };

      const res = await submitPrefill(payload);
      navigation.navigate('CountdownScreen', { request: res.data });
    } catch (err) {
      console.error('[PreFillFormScreen] Submit failed:', err);
      const errCode = err.response?.data?.code;
      const errMsg = err.response?.data?.error || 'Failed to submit pre-fill request. Please check input parameters.';

      if (errCode === 'JOURNEY_OVERLAP_LOCK') {
        setOverlapError(errMsg);
        setError(null);
      } else {
        setOverlapError(null);
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <ArrowLeft color="#111111" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pre-Fill Tatkal</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Stepper Indicator */}
      <View style={styles.stepperContainer}>
        {[1, 2, 3].map((num) => {
          const isActive = step === num;
          const isCompleted = step > num;
          return (
            <React.Fragment key={num}>
              <View style={[styles.stepCircle, isActive && styles.activeStep, isCompleted && styles.completedStep]}>
                <Text style={[styles.stepText, (isActive || isCompleted) && styles.activeStepText]}>
                  {isCompleted ? '✓' : num}
                </Text>
              </View>
              {num < 3 && <View style={[styles.stepLine, step > num && styles.activeStepLine]} />}
            </React.Fragment>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {overlapError && (
          <View style={styles.overlapCard}>
            <Text style={styles.overlapIcon}>🔒</Text>
            <Text style={styles.overlapTitle}>Journey Conflict Detected</Text>
            <Text style={styles.overlapMessage}>{overlapError}</Text>
            <Text style={styles.overlapSubtext}>
              You or a co-passenger on this PNR already has an active journey
              overlapping with your requested travel time.
            </Text>
            <TouchableOpacity
              style={styles.overlapButton}
              onPress={() => { setOverlapError(null); setStep(1); }}
            >
              <Text style={styles.overlapButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {step === 1 && <JourneyDetailsForm formData={formData} setFormData={setFormData} />}
        
        {step === 2 && (
          <PassengerListEditor
            passengers={formData.passengers}
            onChangePassengers={(newList) => setFormData(prev => ({ ...prev, passengers: newList }))}
            accountHolderName={currentUser?.name || ''}
          />
        )}

        {step === 3 && <UrgencyDetailsForm formData={formData} setFormData={setFormData} />}

        {/* Navigation Buttons */}
        <View style={styles.footer}>
          {loading ? (
            <ActivityIndicator size="large" color="#E8621A" style={styles.loadingSpinner} />
          ) : (
            <View style={styles.footerRow}>
              {step > 1 && (
                <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.primaryButton, step > 1 && { flex: 1.5, marginLeft: 12 }]}
                onPress={step === 3 ? handleSubmit : handleNextStep}
              >
                <Text style={styles.primaryButtonText}>{step === 3 ? 'Submit Pre-fill' : 'Next'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111111' },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  activeStep: { backgroundColor: '#1A3557' },
  completedStep: { backgroundColor: '#E8621A' },
  stepText: { fontSize: 13, fontWeight: '700', color: '#555555' },
  activeStepText: { color: '#FFFFFF' },
  stepLine: { width: 40, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 8 },
  activeStepLine: { backgroundColor: '#E8621A' },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 24 },
  footer: { marginTop: 20 },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  backButtonText: { color: '#E8621A', fontSize: 16, fontWeight: '600' },
  primaryButton: { flex: 2, backgroundColor: '#E8621A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  loadingSpinner: { alignSelf: 'center' },
  errorBanner: { backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#CC0000' },
  errorText: { fontSize: 13, color: '#CC0000', lineHeight: 18 },
  overlapCard: { backgroundColor: '#FFF3EC', borderRadius: 12, padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#E8621A', alignItems: 'flex-start' },
  overlapIcon: { fontSize: 24, marginBottom: 8 },
  overlapTitle: { fontSize: 16, fontWeight: '700', color: '#111111', marginBottom: 6 },
  overlapMessage: { fontSize: 13, color: '#333333', lineHeight: 18, marginBottom: 8 },
  overlapSubtext: { fontSize: 12, color: '#555555', lineHeight: 16, marginBottom: 12 },
  overlapButton: { borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'flex-start' },
  overlapButtonText: { color: '#E8621A', fontSize: 14, fontWeight: '600' }
});
