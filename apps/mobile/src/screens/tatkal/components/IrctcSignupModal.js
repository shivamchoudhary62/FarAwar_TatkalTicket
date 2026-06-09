import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Modal
} from 'react-native';
import { X, CheckCircle } from 'lucide-react-native';

const OCCUPATION_OPTIONS = ['Private', 'Public', 'Government', 'Self Employed', 'Student', 'Professional', 'Others'];
const GENDER_OPTIONS = ['M', 'F', 'T'];

export default function IrctcSignupModal({ visible, onClose, onSignupSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [form, setForm] = useState({
    irctc_id: '',
    email: '',
    dob: '',
    gender: 'M',
    marital_status: 'Single',
    occupation: 'Private',
    address: '',
    pin_code: '',
    state: '',
    city: '',
    mobile_otp: '',
    email_otp: ''
  });

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!form.irctc_id || form.irctc_id.length < 3 || form.irctc_id.length > 35) {
        return setError('IRCTC ID must be between 3 and 35 alphanumeric characters.');
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.dob || !form.dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return setError('Please enter Date of Birth in YYYY-MM-DD format.');
      }
      setStep(3);
    } else if (step === 3) {
      if (!form.email || !form.email.includes('@')) {
        return setError('Please enter a valid email address.');
      }
      if (!form.address || !form.pin_code || !form.state || !form.city) {
        return setError('Please complete all address fields.');
      }
      setStep(4);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    if (form.mobile_otp !== '654321' || form.email_otp !== '123456') {
      return setError('Invalid OTP. Use simulated codes: Mobile OTP = 654321, Email OTP = 123456.');
    }

    try {
      setLoading(true);
      await onSignupSuccess(form);
      setStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>IRCTC Official Sign-Up</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color="#111111" size={24} />
          </TouchableOpacity>
        </View>

        {/* Stepper */}
        <View style={styles.stepper}>
          {[1, 2, 3, 4].map((num) => (
            <React.Fragment key={num}>
              <View style={[styles.stepCircle, step === num && styles.activeStep, step > num && styles.completedStep]}>
                <Text style={[styles.stepText, (step >= num) && styles.activeStepText]}>
                  {step > num ? '✓' : num}
                </Text>
              </View>
              {num < 4 && <View style={[styles.stepLine, step > num && styles.activeStepLine]} />}
            </React.Fragment>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === 1 && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Step 1: Login Details</Text>
              <Text style={styles.inputLabel}>IRCTC User ID (username)</Text>
              <TextInput
                style={styles.input}
                value={form.irctc_id}
                onChangeText={(val) => setForm(prev => ({ ...prev, irctc_id: val.replace(/[^a-zA-Z0-9_]/g, '') }))}
                placeholder="Choose a unique ID (e.g. raj_kumar12)"
                placeholderTextColor="#AAAAAA"
                maxLength={35}
                autoCapitalize="none"
              />
              <Text style={styles.helperText}>3 to 35 alphanumeric characters. Letters, numbers, and underscores only.</Text>
            </View>
          )}

          {step === 2 && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Step 2: Personal Details</Text>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                value={form.dob}
                onChangeText={(val) => setForm(prev => ({ ...prev, dob: val }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#AAAAAA"
                maxLength={10}
              />
              
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderContainer}>
                {GENDER_OPTIONS.map((g) => {
                  const selected = form.gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderBox, selected && styles.activeGenderBox]}
                      onPress={() => setForm(prev => ({ ...prev, gender: g }))}
                    >
                      <Text style={[styles.genderText, selected && styles.activeGenderText]}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Occupation</Text>
              <View style={styles.capsuleContainer}>
                {OCCUPATION_OPTIONS.slice(0, 4).map((o) => {
                  const selected = form.occupation === o;
                  return (
                    <TouchableOpacity
                      key={o}
                      style={[styles.capsule, selected && styles.activeCapsule]}
                      onPress={() => setForm(prev => ({ ...prev, occupation: o }))}
                    >
                      <Text style={[styles.capsuleText, selected && styles.activeCapsuleText]}>{o}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Step 3: Contact & Address</Text>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(val) => setForm(prev => ({ ...prev, email: val }))}
                placeholder="E.g. raj@gmail.com"
                placeholderTextColor="#AAAAAA"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput
                style={styles.input}
                value={form.address}
                onChangeText={(val) => setForm(prev => ({ ...prev, address: val }))}
                placeholder="Street name, Building No."
                placeholderTextColor="#AAAAAA"
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>PIN Code</Text>
                  <TextInput
                    style={styles.input}
                    value={form.pin_code}
                    onChangeText={(val) => setForm(prev => ({ ...prev, pin_code: val.replace(/[^0-9]/g, '') }))}
                    placeholder="PIN"
                    placeholderTextColor="#AAAAAA"
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={form.city}
                    onChangeText={(val) => setForm(prev => ({ ...prev, city: val }))}
                    placeholder="City Name"
                    placeholderTextColor="#AAAAAA"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>State</Text>
              <TextInput
                style={styles.input}
                value={form.state}
                onChangeText={(val) => setForm(prev => ({ ...prev, state: val }))}
                placeholder="E.g. Delhi"
                placeholderTextColor="#AAAAAA"
              />
            </View>
          )}

          {step === 4 && (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Step 4: Contact Verification</Text>
              <Text style={styles.infoText}>We have simulated OTP transmission. Verify your credentials using the codes below:</Text>
              <View style={styles.otpCard}>
                <Text style={styles.otpCardText}>🔑 **Simulated OTP Codes**</Text>
                <Text style={styles.otpCardText}>Mobile OTP: **654321**</Text>
                <Text style={styles.otpCardText}>Email OTP: **123456**</Text>
              </View>

              <Text style={styles.inputLabel}>Enter Mobile OTP</Text>
              <TextInput
                style={styles.input}
                value={form.mobile_otp}
                onChangeText={(val) => setForm(prev => ({ ...prev, mobile_otp: val }))}
                placeholder="Enter 6-digit Mobile OTP"
                placeholderTextColor="#AAAAAA"
                keyboardType="numeric"
                maxLength={6}
              />

              <Text style={styles.inputLabel}>Enter Email OTP</Text>
              <TextInput
                style={styles.input}
                value={form.email_otp}
                onChangeText={(val) => setForm(prev => ({ ...prev, email_otp: val }))}
                placeholder="Enter 6-digit Email OTP"
                placeholderTextColor="#AAAAAA"
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
          )}

          {/* Navigation */}
          <View style={styles.footer}>
            {loading ? (
              <ActivityIndicator size="large" color="#E8621A" />
            ) : (
              <View style={styles.footerRow}>
                {step > 1 && (
                  <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.primaryButton, step > 1 && { flex: 1.5, marginLeft: 12 }]}
                  onPress={step === 4 ? handleSubmit : handleNext}
                >
                  <Text style={styles.primaryButtonText}>{step === 4 ? 'Verify & Register' : 'Next'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1A3557' },
  closeBtn: { padding: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  activeStep: { backgroundColor: '#1A3557' },
  completedStep: { backgroundColor: '#27AE60' },
  stepText: { fontSize: 13, fontWeight: '700', color: '#555555' },
  activeStepText: { color: '#FFFFFF' },
  stepLine: { width: 30, height: 2, backgroundColor: '#E0E0E0', marginHorizontal: 8 },
  activeStepLine: { backgroundColor: '#27AE60' },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 24 },
  formSection: { width: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 16 },
  inputLabel: { fontSize: 12, color: '#555555', fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111111', backgroundColor: '#FFFFFF' },
  helperText: { fontSize: 11, color: '#777777', marginTop: 4 },
  infoText: { fontSize: 13, color: '#555555', lineHeight: 18, marginBottom: 16 },
  otpCard: { backgroundColor: '#FFF3EC', borderLeftWidth: 4, borderLeftColor: '#E8621A', borderRadius: 10, padding: 12, marginBottom: 16 },
  otpCardText: { fontSize: 12, color: '#E8621A', fontWeight: '600', lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  genderContainer: { flexDirection: 'row', marginTop: 4 },
  genderBox: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginHorizontal: 3, backgroundColor: '#FFFFFF' },
  activeGenderBox: { borderColor: '#E8621A', backgroundColor: '#FFF3EC', borderWidth: 1.5 },
  genderText: { fontSize: 13, fontWeight: '600', color: '#555555' },
  activeGenderText: { color: '#E8621A' },
  capsuleContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  capsule: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, marginBottom: 8, backgroundColor: '#FFFFFF' },
  activeCapsule: { backgroundColor: '#1A3557', borderColor: '#1A3557' },
  capsuleText: { fontSize: 13, fontWeight: '600', color: '#555555' },
  activeCapsuleText: { color: '#FFFFFF' },
  footer: { marginTop: 32 },
  footerRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  backButtonText: { color: '#E8621A', fontSize: 16, fontWeight: '600' },
  primaryButton: { flex: 2, backgroundColor: '#E8621A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  errorBanner: { backgroundColor: '#FFEBEE', borderRadius: 10, padding: 12, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#CC0000' },
  errorText: { fontSize: 13, color: '#CC0000', lineHeight: 18 }
});
