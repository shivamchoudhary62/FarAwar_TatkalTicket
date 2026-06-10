import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const formatTime = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return isToday ? `Today ${timeStr}` : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'PENDING': return { backgroundColor: '#FFF9E6', color: '#B27D00', border: '1px solid #FFEAA8' };
    case 'FIRED': return { backgroundColor: '#E1F5FE', color: '#0288D1', border: '1px solid #B3E5FC' };
    case 'CONFIRMED': return { backgroundColor: '#E8F5E9', color: '#27AE60', border: '1px solid #C8E6C9' };
    case 'CANCELLED': return { backgroundColor: '#F5F5F5', color: '#777777', border: '1px solid #E0E0E0' };
    case 'FAILED': return { backgroundColor: '#FFEBEE', color: '#CC0000', border: '1px solid #FFCDD2' };
    default: return { backgroundColor: '#F5F5F5', color: '#555555', border: '1px solid #E0E0E0' };
  }
};

export default function TatkalTable({ requests = [], onSimulateFire, firingIds = {} }) {
  const [sortField, setSortField] = useState('urgency_score');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedRows, setExpandedRows] = useState({});

  const handleSort = (field) => {
    setSortDirection(sortField === field && sortDirection === 'desc' ? 'asc' : 'desc');
    setSortField(field);
  };

  const sortedRequests = [...requests].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (aVal == null) return sortDirection === 'asc' ? -1 : 1;
    if (bVal == null) return sortDirection === 'asc' ? 1 : -1;
    if (sortField === 'urgency_score') {
      aVal = parseFloat(aVal); bVal = parseFloat(bVal);
    } else if (['travel_date', 'scheduled_fire_time', 'created_at'].includes(sortField)) {
      aVal = new Date(aVal).getTime(); bVal = new Date(bVal).getTime();
    }
    return aVal < bVal ? (sortDirection === 'asc' ? -1 : 1) : (sortDirection === 'asc' ? 1 : -1);
  });

  const renderSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={13} style={{ marginLeft: '6px', opacity: 0.4 }} />;
    return sortDirection === 'asc'
      ? <ArrowUp size={13} style={{ marginLeft: '6px', color: 'var(--color-orange)' }} />
      : <ArrowDown size={13} style={{ marginLeft: '6px', color: 'var(--color-orange)' }} />;
  };

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.headerRow}>
            <th style={{ ...styles.th, width: '40px' }}></th>
            <th style={styles.th} onClick={() => handleSort('urgency_score')}>
              <div style={styles.thContent}>Urgency {renderSortIcon('urgency_score')}</div>
            </th>
            <th style={styles.th}>Primary Booker</th>
            <th style={styles.th}>Route & Class</th>
            <th style={styles.th} onClick={() => handleSort('travel_date')}>
              <div style={styles.thContent}>Travel Date {renderSortIcon('travel_date')}</div>
            </th>
            <th style={styles.th} onClick={() => handleSort('scheduled_fire_time')}>
              <div style={styles.thContent}>Fire Time {renderSortIcon('scheduled_fire_time')}</div>
            </th>
            <th style={styles.th}>Document</th>
            <th style={styles.th} onClick={() => handleSort('status')}>
              <div style={styles.thContent}>Status {renderSortIcon('status')}</div>
            </th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedRequests.map((req) => {
            const isExpanded = !!expandedRows[req.id];
            const isFiring = !!firingIds[req.id];
            const hasHighUrgency = parseFloat(req.urgency_score) > 7.0;
            const passList = Array.isArray(req.passengers) ? req.passengers : [];
            const primaryPassenger = passList[0] || {};
            const coPassengerCount = Math.max(0, passList.length - 1);

            return (
              <React.Fragment key={req.id}>
                <tr 
                  style={{ ...styles.row, backgroundColor: isExpanded ? '#FFFDFB' : '#FFFFFF', cursor: 'pointer' }}
                  onClick={() => setExpandedRows(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
                >
                  <td style={styles.tdToggle}>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</td>
                  <td style={styles.td}>
                    <span style={{
                      fontWeight: hasHighUrgency ? '700' : '600',
                      color: hasHighUrgency ? 'var(--color-sos)' : 'var(--color-text-primary)',
                      fontSize: '15px'
                    }}>{parseFloat(req.urgency_score).toFixed(1)}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.bookerContainer}>
                      <span style={styles.bookerName}>{primaryPassenger.name || 'Unknown'}</span>
                      <span style={styles.bookerId}>{primaryPassenger.irctc_id || 'No ID'}</span>
                      {coPassengerCount > 0 && (
                        <span style={styles.passengerCountBadge}>+{coPassengerCount} passenger{coPassengerCount > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.routeContainer}>
                      <strong>{req.from_station} ➔ {req.to_station}</strong>
                      <span style={styles.subRouteInfo}>Train {req.train_number} • Class {req.class}</span>
                    </div>
                  </td>
                  <td style={styles.td}>{req.travel_date}</td>
                  <td style={styles.td}>{formatTime(req.scheduled_fire_time)}</td>
                  <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                    {req.urgency_document_url ? (
                      <a href={req.urgency_document_url} target="_blank" rel="noreferrer" style={styles.docLink}>
                        <FileText size={14} style={{ marginRight: '4px' }} /> Verify
                      </a>
                    ) : <span style={styles.noDoc}>None</span>}
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...getStatusStyle(req.status) }}>{req.status}</span>
                    {req.simulated_pnr && <div style={styles.pnrText}>PNR: {req.simulated_pnr}</div>}
                  </td>
                  <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                    {req.status === 'PENDING' && (
                      <button type="button" disabled={isFiring} style={styles.fireBtn} onClick={() => onSimulateFire(req.id)}>
                        {isFiring ? <><Loader2 size={12} style={styles.spinner} /> Booking...</> : 'Simulate Fire'}
                      </button>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr style={styles.expandedRow} onClick={(e) => e.stopPropagation()}>
                    <td colSpan={9} style={styles.expandedTd}>
                      <div style={styles.expandedContent}>
                        <h4 style={styles.expandedTitle}>Passenger Details & Preferences</h4>
                        <div style={styles.passengerGrid}>
                          {passList.map((p, idx) => (
                            <div key={idx} style={styles.passengerCard}>
                              <div style={styles.passengerHeader}>
                                <span style={styles.passengerNameIndex}>#{idx + 1} {p.name}</span>
                                {idx === 0 && <span style={styles.primaryBadge}>Primary</span>}
                              </div>
                              <div style={styles.passengerMeta}>
                                <div><strong>IRCTC ID:</strong> {p.irctc_id || '—'}</div>
                                <div><strong>Age/Gender:</strong> {p.age} yrs / {p.gender}</div>
                                <div><strong>Seat Preference:</strong> {p.berth_preference || 'None'}</div>
                                <div><strong>Meal:</strong> {p.meal_preference || 'NONE'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {req.is_urgent && (
                          <div style={styles.urgencyAlert}>
                            <strong>Urgency Statement:</strong> {req.urgency_reason || 'URGENT'} - Verified by RailSaathi Identity Protocol.
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  tableContainer: { backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #F0F0F0', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', overflowX: 'auto', width: '100%' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', color: '#111111' },
  headerRow: { borderBottom: '2px solid #E0E0E0', backgroundColor: '#F9F9F9' },
  th: { padding: '16px 20px', fontWeight: '600', color: '#555555', cursor: 'pointer', userSelect: 'none', transition: 'background-color 150ms ease' },
  thContent: { display: 'flex', alignItems: 'center' },
  row: { borderBottom: '1px solid #F0F0F0', transition: 'background-color 100ms ease' },
  tdToggle: { padding: '14px 10px', textAlign: 'center', color: '#888888', verticalAlign: 'middle' },
  td: { padding: '14px 20px', verticalAlign: 'middle' },
  bookerContainer: { display: 'flex', flexDirection: 'column', gap: '2px' },
  bookerName: { fontWeight: '600', color: '#111111' },
  bookerId: { fontSize: '12px', color: '#777777' },
  passengerCountBadge: { alignSelf: 'flex-start', backgroundColor: '#FFF3EC', color: 'var(--color-orange)', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' },
  routeContainer: { display: 'flex', flexDirection: 'column', gap: '2px' },
  subRouteInfo: { fontSize: '12px', color: '#666666' },
  docLink: { display: 'inline-flex', alignItems: 'center', color: 'var(--color-orange)', fontWeight: '600', fontSize: '13px', textDecoration: 'none' },
  noDoc: { color: '#AAAAAA', fontSize: '13px', fontStyle: 'italic' },
  badge: { display: 'inline-block', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', textAlign: 'center' },
  pnrText: { fontSize: '11px', color: '#27AE60', fontWeight: '700', marginTop: '4px' },
  fireBtn: { backgroundColor: 'var(--color-orange)', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 150ms ease', outline: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  spinner: { animation: 'spin 1s linear infinite' },
  expandedRow: { backgroundColor: '#FAFBFD', borderBottom: '1px solid #E5EBF2' },
  expandedTd: { padding: '20px 30px' },
  expandedContent: { display: 'flex', flexDirection: 'column', gap: '12px' },
  expandedTitle: { fontSize: '13px', fontWeight: '700', color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  passengerGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' },
  passengerCard: { backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5EBF2', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  passengerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #F0F4F8', paddingBottom: '6px' },
  passengerNameIndex: { fontWeight: '600', fontSize: '13px', color: '#111111' },
  primaryBadge: { backgroundColor: '#E3F2FD', color: '#0D47A1', fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px' },
  passengerMeta: { fontSize: '12px', color: '#555555', display: 'flex', flexDirection: 'column', gap: '4px' },
  urgencyAlert: { backgroundColor: '#FFF5F0', borderLeft: '4px solid var(--color-orange)', padding: '10px 14px', borderRadius: '4px', fontSize: '12px', color: '#C9551A', fontWeight: '500', marginTop: '8px' }
};
