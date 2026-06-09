import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { UserPlus } from 'lucide-react-native';
import PassengerCard from './PassengerCard';

export default function PassengerListEditor({ passengers, onChangePassengers, accountHolderName }) {
  
  const updatePassenger = (index, field, value) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    onChangePassengers(updated);
  };

  const addPassenger = () => {
    if (passengers.length >= 6) return;
    const updated = [...passengers, { name: '', age: '', gender: 'M', berth_preference: '' }];
    onChangePassengers(updated);
  };

  const removePassenger = (index) => {
    if (index === 0) return;
    const updated = passengers.filter((_, idx) => idx !== index);
    onChangePassengers(updated);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionHeading}>Passenger Details</Text>
        <Text style={styles.countText}>{passengers.length} of 6 passengers</Text>
      </View>

      <ScrollView scrollEnabled={false} style={styles.scroll}>
        {passengers.map((passenger, idx) => (
          <PassengerCard
            key={idx}
            passenger={passenger}
            idx={idx}
            accountHolderName={accountHolderName}
            updatePassenger={updatePassenger}
            removePassenger={removePassenger}
          />
        ))}
      </ScrollView>

      {passengers.length < 6 && (
        <TouchableOpacity style={styles.addBtn} onPress={addPassenger}>
          <UserPlus color="#E8621A" size={18} style={styles.addIcon} />
          <Text style={styles.addBtnText}>Add Passenger</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: '#111111' },
  countText: { fontSize: 12, color: '#555555' },
  scroll: { marginBottom: 12 },
  addBtn: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 20 },
  addIcon: { marginRight: 8 },
  addBtnText: { color: '#E8621A', fontSize: 14, fontWeight: '600' }
});
