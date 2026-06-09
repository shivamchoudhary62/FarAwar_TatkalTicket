import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const CLASS_OPTIONS = ['SL', '3A', '2A', 'CC', '2S', 'FC', 'EC'];

export default function JourneyDetailsForm({ formData, setFormData }) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, travel_date: selectedDate }));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>Journey Details</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>From Station</Text>
        <TextInput
          style={styles.input}
          value={formData.from_station}
          onChangeText={(val) => setFormData(prev => ({ ...prev, from_station: val }))}
          placeholder="E.g. NDLS"
          autoCapitalize="characters"
          maxLength={7}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>To Station</Text>
        <TextInput
          style={styles.input}
          value={formData.to_station}
          onChangeText={(val) => setFormData(prev => ({ ...prev, to_station: val }))}
          placeholder="E.g. MMCT"
          autoCapitalize="characters"
          maxLength={7}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Travel Date</Text>
        <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateSelectorText}>{formData.travel_date.toDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={formData.travel_date}
            mode="date"
            display="default"
            minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)} // Must be tomorrow or later
            onChange={onDateChange}
          />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Class</Text>
        <View style={styles.classGrid}>
          {CLASS_OPTIONS.map((c) => {
            const selected = formData.class === c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.classBox, selected && styles.activeClassBox]}
                onPress={() => setFormData(prev => ({ ...prev, class: c }))}
              >
                <Text style={[styles.classBoxText, selected && styles.activeClassBoxText]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Train Number (Optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.train_number}
          onChangeText={(val) => setFormData(prev => ({ ...prev, train_number: val.replace(/[^0-9]/g, '') }))}
          placeholder="E.g. 12951"
          keyboardType="numeric"
          maxLength={5}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  stepTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, color: '#555555', fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: '#111111', backgroundColor: '#FFFFFF' },
  dateSelector: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#FFFFFF' },
  dateSelectorText: { fontSize: 15, color: '#111111' },
  classGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  classBox: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginHorizontal: 3, backgroundColor: '#FFFFFF' },
  activeClassBox: { borderColor: '#E8621A', backgroundColor: '#FFF3EC', borderWidth: 1.5 },
  classBoxText: { fontSize: 13, fontWeight: '600', color: '#555555' },
  activeClassBoxText: { color: '#E8621A' }
});
