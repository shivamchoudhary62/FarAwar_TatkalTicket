import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';

const GENDER_OPTIONS = [{ label: 'M', value: 'M' }, { label: 'F', value: 'F' }, { label: 'T', value: 'T' }];
const BERTH_OPTIONS = ['LB', 'MB', 'UB', 'SL', 'SU'];

export default function PassengerCard({ passenger, idx, accountHolderName, updatePassenger, removePassenger }) {
  const isAccountHolder = idx === 0;
  return (
    <View style={[styles.card, isAccountHolder && styles.holderCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>{isAccountHolder ? 'Passenger 1 (Account Holder)' : `Passenger ${idx + 1}`}</Text>
        {!isAccountHolder && (
          <TouchableOpacity style={{ padding: 4 }} onPress={() => removePassenger(idx)}>
            <Trash2 color="#CC0000" size={18} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          style={[styles.input, isAccountHolder && styles.disabledInput]}
          value={isAccountHolder ? accountHolderName : passenger.name}
          onChangeText={(val) => updatePassenger(idx, 'name', val)}
          editable={!isAccountHolder}
          placeholder="Enter passenger name"
          placeholderTextColor="#AAAAAA"
        />
      </View>
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
          <Text style={styles.inputLabel}>Age</Text>
          <TextInput
            style={styles.input}
            value={passenger.age ? String(passenger.age) : ''}
            onChangeText={(val) => updatePassenger(idx, 'age', val.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            maxLength={3}
            placeholder="Age"
            placeholderTextColor="#AAAAAA"
          />
        </View>
        <View style={{ flex: 1.5 }}>
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.capsuleContainer}>
            {GENDER_OPTIONS.map((g) => {
              const selected = passenger.gender === g.value;
              return (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.capsule, selected && styles.activeCapsule]}
                  onPress={() => updatePassenger(idx, 'gender', g.value)}
                >
                  <Text style={[styles.capsuleText, selected && styles.activeCapsuleText]}>{g.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
      <View style={styles.inputGroup}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  holderCard: { borderLeftWidth: 4, borderLeftColor: '#E8621A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#1A3557' },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, color: '#555555', fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111111', backgroundColor: '#FFFFFF' },
  disabledInput: { backgroundColor: '#F5F5F5', color: '#555555' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  capsuleContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 3, backgroundColor: '#F5F5F5' },
  capsule: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  activeCapsule: { backgroundColor: '#1A3557' },
  capsuleText: { fontSize: 13, fontWeight: '600', color: '#555555' },
  activeCapsuleText: { color: '#FFFFFF' },
  berthContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  berthCapsule: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginHorizontal: 3, backgroundColor: '#FFFFFF' },
  activeBerthCapsule: { backgroundColor: '#E8621A', borderColor: '#E8621A' },
  berthCapsuleText: { fontSize: 12, fontWeight: '600', color: '#555555' },
  activeBerthCapsuleText: { color: '#FFFFFF' }
});
