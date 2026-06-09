import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Modal, ScrollView, SafeAreaView } from 'react-native';
import { Star, FileText, Square, CheckSquare, X } from 'lucide-react-native';
import UrgencyScoreCard from './UrgencyScoreCard';

const URGENCY_REASONS = [
  { value: 'medical', label: 'Medical' },
  { value: 'bereavement', label: 'Bereavement' },
  { value: 'official', label: 'Official' },
  { value: 'personal', label: 'Personal' }
];

export default function UrgencyDetailsForm({ formData, setFormData, agreedToTerms, setAgreedToTerms }) {
  const [showTermsModal, setShowTermsModal] = useState(false);

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

      {/* Terms & Conditions Section */}
      <View style={styles.termsWrapper}>
        <TouchableOpacity 
          style={styles.checkboxContainer} 
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          activeOpacity={0.75}
        >
          {agreedToTerms ? (
            <CheckSquare color="#E8621A" size={22} style={styles.checkboxIcon} />
          ) : (
            <Square color="#AAAAAA" size={22} style={styles.checkboxIcon} />
          )}
          <Text style={styles.checkboxLabel}>
            I agree to the{' '}
            <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>
              Tatkal Booking Terms & Conditions
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Terms & Conditions Modal */}
      <Modal visible={showTermsModal} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tatkal Booking Terms</Text>
            <TouchableOpacity onPress={() => setShowTermsModal(false)} style={styles.closeBtn} hitSlop={{top:10, bottom:10, left:10, right:10}}>
              <X color="#111111" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>1. Booking Windows & Timings</Text>
              <Text style={styles.sectionBody}>
                - **AC Classes (2A/3A/CC/EC/3E)**: Pre-fill booking fires at **10:00 AM** local time on the day prior to travel.
              </Text>
              <Text style={styles.sectionBody}>
                - **Non-AC Classes (SL/FC/2S)**: Pre-fill booking fires at **11:00 AM** local time on the day prior to travel.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>2. Passenger Limitations</Text>
              <Text style={styles.sectionBody}>
                - A maximum of **4 passengers** per PNR is permitted for online Tatkal e-tickets under official IRCTC rules.
              </Text>
              <Text style={styles.sectionBody}>
                - All requests submitted via RailSaathi are automatically capped at 4 passengers.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>3. Ticket Cancellation & Refund Rules</Text>
              <Text style={styles.sectionBody}>
                - **Confirmed Tickets**: **STRICTLY NON-REFUNDABLE**. No refund will be granted for the cancellation of confirmed Tatkal tickets.
              </Text>
              <Text style={styles.sectionBody}>
                - **Surrender Option**: Confirmed tickets cannot be cancelled for a refund, but they can be listed on the **RailSaathi Surrender Market** to allow reallocation and transfer to another verified traveler.
              </Text>
              <Text style={styles.sectionBody}>
                - **Waitlisted Tickets**: Cancellations of waitlisted Tatkal tickets incur standard clerkage deductions according to existing Railway rules.
              </Text>
              <Text style={styles.sectionBody}>
                - **Exceptions**: A full refund is granted if the train is delayed by more than 3 hours, cancelled, or if the passenger is not provided accommodation in the booked class.
              </Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>4. Official Tatkal Charges (Per Passenger)</Text>
              <Text style={styles.sectionBody}>
                Charges are added on top of the normal ticket fare as follows:
              </Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 2 }]}>Class</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell]}>Min (₹)</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell]}>Max (₹)</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Second sitting (2S)</Text>
                  <Text style={styles.tableCell}>10</Text>
                  <Text style={styles.tableCell}>15</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Sleeper (SL)</Text>
                  <Text style={styles.tableCell}>100</Text>
                  <Text style={styles.tableCell}>200</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>AC Chair Car (CC)</Text>
                  <Text style={styles.tableCell}>125</Text>
                  <Text style={styles.tableCell}>225</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>AC 3 Tier (3A)</Text>
                  <Text style={styles.tableCell}>300</Text>
                  <Text style={styles.tableCell}>400</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>AC 2 Tier (2A)</Text>
                  <Text style={styles.tableCell}>400</Text>
                  <Text style={styles.tableCell}>500</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>Executive (EC)</Text>
                  <Text style={styles.tableCell}>400</Text>
                  <Text style={styles.tableCell}>500</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>5. Anti-Hoarding & Overlap Rules</Text>
              <Text style={styles.sectionBody}>
                - **Anti-Hoarding**: Only one active request per user per booking date per train is permitted. Duplicate requests are blocked at both the API and database levels.
              </Text>
              <Text style={styles.sectionBody}>
                - **Account Holder Mandate**: The account holder's name must be included in the passengers list.
              </Text>
              <Text style={styles.sectionBody}>
                - **Journey Overlap Lock**: Confirmed bookings lock all passengers from booking overlapping journeys.
              </Text>
              <Text style={styles.sectionBody}>
                - **Concessions**: No concessions (senior citizen, student, etc.) apply under the Tatkal scheme.
              </Text>
            </View>

            <View style={[styles.sectionCard, styles.disclaimerCard]}>
              <Text style={styles.disclaimerHeader}>⚠️ Booking Simulation Disclaimer</Text>
              <Text style={styles.disclaimerText}>
                RailSaathi does not connect directly to the live IRCTC booking systems. 
                All transaction executions, PNR generations, and booking results are simulated 
                for demonstration and MVP purposes.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity 
            style={styles.modalAcceptBtn} 
            onPress={() => { setAgreedToTerms(true); setShowTermsModal(false); }}
            activeOpacity={0.75}
          >
            <Text style={styles.modalAcceptBtnText}>Accept & Agree</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
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
  uploadBtnText: { color: '#E8621A', fontSize: 14, fontWeight: '600' },
  
  // Terms & Conditions Style
  termsWrapper: { marginTop: 24, paddingVertical: 8 },
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 4 },
  checkboxIcon: { marginRight: 10, marginTop: 1 },
  checkboxLabel: { flex: 1, fontSize: 14, color: '#555555', lineHeight: 20 },
  termsLink: { color: '#E8621A', fontWeight: '600', textDecorationLine: 'underline' },

  // Modal Style
  modalContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  modalHeader: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1A3557' },
  closeBtn: { padding: 4 },
  modalScrollContent: { padding: 16 },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  sectionHeader: { fontSize: 15, fontWeight: '700', color: '#1A3557', marginBottom: 8 },
  sectionBody: { fontSize: 13, color: '#555555', lineHeight: 18, marginBottom: 6 },
  modalAcceptBtn: { backgroundColor: '#E8621A', borderRadius: 12, paddingVertical: 16, margin: 16, alignItems: 'center', justifyContent: 'center' },
  modalAcceptBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  // Charges Table Style
  table: { marginTop: 12, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#FFFFFF' },
  tableHeaderRow: { backgroundColor: '#FFF3EC', borderBottomWidth: 2, borderBottomColor: '#E8621A' },
  tableCell: { flex: 1, fontSize: 12, color: '#555555', textAlign: 'left' },
  tableHeaderCell: { fontWeight: '700', color: '#1A3557' },

  // Disclaimer Style
  disclaimerCard: { backgroundColor: '#FFF8F8', borderColor: '#FFEBEE', borderLeftWidth: 4 },
  disclaimerHeader: { fontSize: 14, fontWeight: '700', color: '#CC0000', marginBottom: 6 },
  disclaimerText: { fontSize: 12, color: '#777777', lineHeight: 16 }
});
