import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Trash2, CheckCircle, Search } from 'lucide-react-native';
import { getPassengerByIrctc } from '../services/tatkalService';

const GENDER_OPTIONS = [{ label: 'M', value: 'M' }, { label: 'F', value: 'F' }, { label: 'T', value: 'T' }];
const BERTH_OPTIONS = ['LB', 'MB', 'UB', 'SL', 'SU'];
const MEAL_OPTIONS = ['VEG', 'NON-VEG', 'NONE'];

export default function PassengerCard({ passenger, idx, accountHolderName, updatePassenger, removePassenger }) {
  const isAccountHolder = idx === 0;
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const handleFetchProfile = async () => {
    if (!passenger.irctc_id) {
      return setFetchError('Please enter a valid IRCTC ID.');
    }
    try {
      setFetching(true);
      setFetchError(null);
      const res = await getPassengerByIrctc(passenger.irctc_id);
      const profile = res.data;
      
      updatePassenger(idx, 'name', profile.name);
      updatePassenger(idx, 'age', profile.age);
      updatePassenger(idx, 'gender', profile.gender);
      updatePassenger(idx, 'verified', true);
    } catch (err) {
      console.error('[PassengerCard] Fetch profile failed:', err);
      setFetchError(err.response?.data?.error || 'Passenger profile not found.');
      updatePassenger(idx, 'verified', false);
    } finally {
      setFetching(false);
    }
  };

  const handleClearProfile = () => {
    updatePassenger(idx, 'irctc_id', '');
    updatePassenger(idx, 'name', '');
    updatePassenger(idx, 'age', '');
    updatePassenger(idx, 'gender', 'M');
    updatePassenger(idx, 'verified', false);
    setFetchError(null);
  };

  return (
    <View style={[styles.card, isAccountHolder && styles.holderCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>{isAccountHolder ? 'Passenger 1 (Account Holder)' : `Passenger ${idx + 1}`}</Text>
        {!isAccountHolder && (
          <TouchableOpacity style={{ padding: 4 }} onPress={() => removePassenger(idx)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <Trash2 color="#CC0000" size={18} />
          </TouchableOpacity>
        )}
      </View>

      {isAccountHolder ? (
        <View style={styles.verifiedRow}>
          <CheckCircle color="#27AE60" size={16} style={{ marginRight: 6 }} />
          <Text style={styles.verifiedText}>Verified Booker (IRCTC ID: {passenger.irctc_id})</Text>
        </View>
      ) : passenger.verified ? (
        <View style={styles.verifiedRow}>
          <CheckCircle color="#27AE60" size={16} style={{ marginRight: 6 }} />
          <Text style={styles.verifiedText}>Verified Passenger (IRCTC ID: {passenger.irctc_id})</Text>
          <TouchableOpacity onPress={handleClearProfile} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isAccountHolder && !passenger.verified && (
        <View style={styles.fetchSection}>
          <Text style={styles.inputLabel}>Enter IRCTC ID</Text>
          <View style={styles.fetchRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              value={passenger.irctc_id}
              onChangeText={(val) => updatePassenger(idx, 'irctc_id', val.trim())}
              placeholder="IRCTC username"
              placeholderTextColor="#AAAAAA"
              autoCapitalize="none"
            />
            {fetching ? (
              <ActivityIndicator color="#E8621A" style={{ paddingHorizontal: 12 }} />
            ) : (
              <TouchableOpacity style={styles.fetchBtn} onPress={handleFetchProfile}>
                <Search color="#FFFFFF" size={16} style={{ marginRight: 4 }} />
                <Text style={styles.fetchBtnText}>Fetch</Text>
              </TouchableOpacity>
            )}
          </View>
          {fetchError && <Text style={styles.errorText}>{fetchError}</Text>}
        </View>
      )}

      {/* Profile Details (Read-only if account holder or verified) */}
      {(isAccountHolder || passenger.verified) && (
        <View style={styles.profileDetails}>
          <View style={styles.detailRow}>
            <View style={{ flex: 1.5 }}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{isAccountHolder ? accountHolderName : passenger.name}</Text>
            </View>
            <View style={{ flex: 0.6 }}>
              <Text style={styles.detailLabel}>Age</Text>
              <Text style={styles.detailValue}>{passenger.age}</Text>
            </View>
            <View style={{ flex: 0.6 }}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>{passenger.gender}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Preferences Section */}
      <View style={styles.preferencesSection}>
        <Text style={styles.inputLabel}>Berth Preference (Optional)</Text>
        <View style={styles.berthContainer}>
          {BERTH_OPTIONS.map((b) => {
            const selected = passenger.berth_preference === b;
            return (
              <TouchableOpacity
                key={b}
                style={[styles.berthCapsule, selected && styles.activeBerthCapsule]}
                onPress={() => updatePassenger(idx, 'berth_preference', selected ? '' : b)}
              >
                <Text style={[styles.berthCapsuleText, selected && styles.activeBerthCapsuleText]}>{b}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Meal Preference</Text>
        <View style={styles.mealContainer}>
          {MEAL_OPTIONS.map((m) => {
            const selected = (passenger.meal_preference || 'NONE') === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.mealCapsule, selected && styles.activeMealCapsule]}
                onPress={() => updatePassenger(idx, 'meal_preference', m)}
              >
                <Text style={[styles.mealCapsuleText, selected && styles.activeMealCapsuleText]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  holderCard: { borderLeftWidth: 4, borderLeftColor: '#E8621A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#1A3557' },
  inputLabel: { fontSize: 12, color: '#555555', fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111111', backgroundColor: '#FFFFFF' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', padding: 8, borderRadius: 8, marginBottom: 12 },
  verifiedText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#27AE60' },
  clearBtn: { paddingVertical: 2, paddingHorizontal: 8, borderWidth: 1, borderColor: '#27AE60', borderRadius: 6 },
  clearBtnText: { fontSize: 11, fontWeight: '600', color: '#27AE60' },
  fetchSection: { marginBottom: 12 },
  fetchRow: { flexDirection: 'row', alignItems: 'center' },
  fetchBtn: { backgroundColor: '#E8621A', flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16 },
  fetchBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  errorText: { color: '#CC0000', fontSize: 12, marginTop: 4, fontWeight: '500' },
  profileDetails: { backgroundColor: '#F9F9F9', borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  detailRow: { flexDirection: 'row' },
  detailLabel: { fontSize: 10, color: '#777777', fontWeight: '600', marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111111' },
  preferencesSection: { marginTop: 8 },
  berthContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  berthCapsule: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginHorizontal: 3, backgroundColor: '#FFFFFF' },
  activeBerthCapsule: { backgroundColor: '#E8621A', borderColor: '#E8621A' },
  berthCapsuleText: { fontSize: 12, fontWeight: '600', color: '#555555' },
  activeBerthCapsuleText: { color: '#FFFFFF' },
  mealContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  mealCapsule: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginHorizontal: 3, backgroundColor: '#FFFFFF' },
  activeMealCapsule: { backgroundColor: '#1A3557', borderColor: '#1A3557' },
  mealCapsuleText: { fontSize: 12, fontWeight: '600', color: '#555555' },
  activeMealCapsuleText: { color: '#FFFFFF' }
});
