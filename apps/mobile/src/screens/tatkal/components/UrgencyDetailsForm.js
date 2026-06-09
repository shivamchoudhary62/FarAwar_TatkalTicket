import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Star, FileText } from 'lucide-react-native';
import UrgencyScoreCard from './UrgencyScoreCard';

const URGENCY_REASONS = [
  { value: 'medical', label: 'Medical' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'official', label: 'Official' },
  { value: 'personal', label: 'Personal' }
];

export default function UrgencyDetailsForm({ formData, setFormData }) {
  const getEstimatedUrgencyScore = () => {
    if (!formData.is_urgent) return 0;
    const baseScores = { medical: 9.0, bereavement: 8.0, official: 7.0, personal: 5.0 };
    let score = baseScores[formData.urgency_reason] || 5.0;
    if (formData.urgency_document_url) score += 1.0;
    return Math.min(score, 10.0).toFixed(1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepTitle}>Urgency Declaration</Text>
      
      <View style={styles.toggleRow}>
        <View style={styles.toggleTextContainer}>
          <Text style={styles.toggleLabel}>Is this an urgent trip?</Text>
          <Text style={styles.toggleDesc}>Urgent quota requests are prioritized.</Text>
        </View>
        <Switch
          value={formData.is_urgent}
          onValueChange={(val) => setFormData(prev => ({ ...prev, is_urgent: val }))}
          trackColor={{ false: '#E0E0E0', true: '#FFF3EC' }}
          thumbColor={formData.is_urgent ? '#E8621A' : '#F5F5F5'}
        />
      </View>

      {formData.is_urgent && (
        <View style={styles.urgencySection}>
          <Text style={styles.inputLabel}>Urgency Reason</Text>
          <View style={styles.reasonContainer}>
            {URGENCY_REASONS.map((r) => {
              const selected = formData.urgency_reason === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.reasonCapsule, selected && styles.activeReasonCapsule]}
                  onPress={() => setFormData(prev => ({ ...prev, urgency_reason: r.value }))}
                >
                  <Text style={[styles.reasonCapsuleText, selected && styles.activeReasonCapsuleText]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={() => setFormData(prev => ({ ...prev, urgency_document_url: 'https://supabase.co/mock_doc.pdf' }))}
          >
            <FileText color="#E8621A" size={18} style={styles.uploadIcon} />
            <Text style={styles.uploadBtnText}>
              {formData.urgency_document_url ? 'Document Attached (1)' : 'Attach Verification Doc'}
            </Text>
          </TouchableOpacity>

          <UrgencyScoreCard
            score={parseFloat(getEstimatedUrgencyScore())}
            reason={formData.urgency_reason}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  stepTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 20 },
  inputLabel: { fontSize: 12, color: '#555555', fontWeight: '600', marginBottom: 6 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 16 },
  toggleTextContainer: { flex: 1, marginRight: 16 },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: '#111111', marginBottom: 2 },
  toggleDesc: { fontSize: 12, color: '#555555' },
  urgencySection: { marginTop: 8 },
  reasonContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  reasonCapsule: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, marginBottom: 8, backgroundColor: '#FFFFFF' },
  activeReasonCapsule: { backgroundColor: '#1A3557', borderColor: '#1A3557' },
  reasonCapsuleText: { fontSize: 13, fontWeight: '600', color: '#555555' },
  activeReasonCapsuleText: { color: '#FFFFFF' },
  uploadBtn: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E8621A', borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 16 },
  uploadIcon: { marginRight: 8 },
  uploadBtnText: { color: '#E8621A', fontSize: 14, fontWeight: '600' }
});
