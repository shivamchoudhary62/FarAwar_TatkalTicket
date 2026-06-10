import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, CheckCircle, RefreshCw, Layers, Search } from 'lucide-react';
import supabase from '../services/supabase-client';
import TatkalTable from '../components/TatkalTable';

export default function TatkalPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firingIds, setFiringIds] = useState({});
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const isMock = !supabase.auth || supabase.supabaseUrl.includes('mockproject.supabase.co');

  const generateMockRequests = () => {
    return [
      {
        id: 'mock-req-1',
        from_station: 'NDLS',
        to_station: 'BCT',
        travel_date: '2026-06-15',
        train_number: '12952',
        class: '3A',
        passengers: [
          { name: 'Rajesh Kumar', age: 42, gender: 'M', irctc_id: 'rajesh42', berth_preference: 'LB', meal_preference: 'VEG' },
          { name: 'Sunita Kumar', age: 39, gender: 'F', irctc_id: 'sunita39', berth_preference: 'UB', meal_preference: 'VEG' }
        ],
        is_urgent: true,
        urgency_reason: 'Medical Emergency - Hospital treatment checkup',
        urgency_document_url: 'https://example.com/medical_cert.pdf',
        urgency_score: 9.2,
        scheduled_fire_time: new Date(Date.now() + 600000).toISOString(),
        status: 'PENDING',
        simulated_pnr: null,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'mock-req-2',
        from_station: 'HWH',
        to_station: 'NDLS',
        travel_date: '2026-06-16',
        train_number: '12301',
        class: 'SL',
        passengers: [
          { name: 'Amit Sharma', age: 28, gender: 'M', irctc_id: 'amit_sharma', berth_preference: 'SL', meal_preference: 'NONE' }
        ],
        is_urgent: true,
        urgency_reason: 'Bereavement - Sudden family member funeral',
        urgency_document_url: 'https://example.com/death_cert.pdf',
        urgency_score: 8.5,
        scheduled_fire_time: new Date(Date.now() + 1200000).toISOString(),
        status: 'PENDING',
        simulated_pnr: null,
        created_at: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'mock-req-3',
        from_station: 'MAS',
        to_station: 'SBC',
        travel_date: '2026-06-14',
        train_number: '12627',
        class: '2A',
        passengers: [
          { name: 'Vijay Krishnan', age: 34, gender: 'M', irctc_id: 'vijay_k', berth_preference: 'LB', meal_preference: 'VEG' }
        ],
        is_urgent: false,
        urgency_reason: null,
        urgency_document_url: null,
        urgency_score: 3.5,
        scheduled_fire_time: new Date(Date.now() - 86400000).toISOString(),
        status: 'CONFIRMED',
        simulated_pnr: '4284910482',
        created_at: new Date(Date.now() - 90000000).toISOString()
      },
      {
        id: 'mock-req-4',
        from_station: 'NDLS',
        to_station: 'JAT',
        travel_date: '2026-06-17',
        train_number: '12425',
        class: '3A',
        passengers: [
          { name: 'Priya Patel', age: 31, gender: 'F', irctc_id: 'priya_patel', berth_preference: 'MB', meal_preference: 'NON-VEG' }
        ],
        is_urgent: true,
        urgency_reason: 'Official duty - Critical government exam duty',
        urgency_document_url: 'https://example.com/duty_order.pdf',
        urgency_score: 5.8,
        scheduled_fire_time: new Date(Date.now() + 1800000).toISOString(),
        status: 'PENDING',
        simulated_pnr: null,
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'mock-req-5',
        from_station: 'PNBE',
        to_station: 'NDLS',
        travel_date: '2026-06-12',
        train_number: '12393',
        class: 'SL',
        passengers: [
          { name: 'Ramesh Yadav', age: 55, gender: 'M', irctc_id: 'ramesh_y', berth_preference: 'LB', meal_preference: 'NONE' }
        ],
        is_urgent: false,
        urgency_reason: null,
        urgency_document_url: null,
        urgency_score: 1.2,
        scheduled_fire_time: new Date(Date.now() - 172800000).toISOString(),
        status: 'CANCELLED',
        simulated_pnr: null,
        created_at: new Date(Date.now() - 180000000).toISOString()
      }
    ];
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      if (isMock) {
        setRequests(generateMockRequests());
      } else {
        const { data, error: dbError } = await supabase
          .from('tatkal_requests')
          .select('*')
          .order('urgency_score', { ascending: false });

        if (dbError) throw dbError;
        setRequests(data || []);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Tatkal requests query fallback:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [isMock]);

  useEffect(() => {
    fetchRequests();

    // Subscribe to Postgres changes on tatkal_requests for real-time monitoring
    const channel = supabase
      .channel('tatkal-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tatkal_requests' }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRequests]);

  const handleSimulateFire = async (id) => {
    setFiringIds(prev => ({ ...prev, [id]: true }));
    console.log(`[TATKAL_FIRE] request_id=${id} status=FIRING at=${new Date().toISOString()}`);

    try {
      if (isMock) {
        // Wait 2s simulated network delay
        await new Promise(r => setTimeout(r, 2000));
        const fakePnr = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        setRequests(prev => prev.map(req => 
          req.id === id ? { ...req, status: 'CONFIRMED', simulated_pnr: fakePnr } : req
        ));
        console.log(`[TATKAL_FIRE] request_id=${id} status=CONFIRMED pnr=${fakePnr} at=${new Date().toISOString()}`);
      } else {
        // Update database status to FIRED first
        await supabase
          .from('tatkal_requests')
          .update({ status: 'FIRED', updated_at: new Date() })
          .eq('id', id);

        await new Promise(r => setTimeout(r, 2000));

        const fakePnr = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const { error: confErr } = await supabase
          .from('tatkal_requests')
          .update({ status: 'CONFIRMED', simulated_pnr: fakePnr, updated_at: new Date() })
          .eq('id', id);

        if (confErr) throw confErr;
        console.log(`[TATKAL_FIRE] request_id=${id} status=CONFIRMED pnr=${fakePnr} at=${new Date().toISOString()}`);
        fetchRequests();
      }
    } catch (err) {
      console.error('Simulation fire failed:', err);
      if (isMock) {
        setRequests(prev => prev.map(req => 
          req.id === id ? { ...req, status: 'FAILED' } : req
        ));
      } else {
        await supabase.from('tatkal_requests').update({ status: 'FAILED' }).eq('id', id);
        fetchRequests();
      }
    } finally {
      setFiringIds(prev => ({ ...prev, [id]: false }));
    }
  };

  // Compute Metrics
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const highUrgencyCount = requests.filter(r => parseFloat(r.urgency_score) > 7.0 && r.status === 'PENDING').length;
  const confirmedCount = requests.filter(r => r.status === 'CONFIRMED').length;

  // Search & Filter list
  const filteredRequests = requests.filter(req => {
    const passengers = Array.isArray(req.passengers) ? req.passengers : [];
    const bookerName = (passengers[0]?.name || '').toLowerCase();
    const trainNum = (req.train_number || '').toLowerCase();
    const stationFrom = req.from_station.toLowerCase();
    const stationTo = req.to_station.toLowerCase();
    const search = searchQuery.toLowerCase();

    const matchesSearch = 
      bookerName.includes(search) || 
      trainNum.includes(search) || 
      stationFrom.includes(search) || 
      stationTo.includes(search);

    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Tatkal Assist Queue</h1>
          <p style={styles.subheading}>Real-time automated pre-fill schedule monitoring</p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchRequests}>
          <RefreshCw size={14} style={{ marginRight: '8px' }} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <Layers size={20} color="var(--color-navy)" />
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Total Requests</span>
            <span style={styles.statValue}>{totalCount}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <Clock size={20} color="#F5A623" />
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Pending Queue</span>
            <span style={{ ...styles.statValue, color: '#B27D00' }}>{pendingCount}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <AlertTriangle size={20} color="var(--color-sos)" />
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>High Urgency (&gt;7.0)</span>
            <span style={{ ...styles.statValue, color: 'var(--color-sos)' }}>{highUrgencyCount}</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <CheckCircle size={20} color="var(--color-success)" />
          <div style={styles.statInfo}>
            <span style={styles.statLabel}>Success Bookings</span>
            <span style={{ ...styles.statValue, color: 'var(--color-success)' }}>{confirmedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div style={styles.controlsRow}>
        <div style={styles.searchBox}>
          <Search size={18} color="#888888" style={{ marginRight: '8px' }} />
          <input 
            type="text" 
            placeholder="Search by booker, train, or station..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.filterBox}>
          <label htmlFor="status-select" style={styles.filterLabel}>Status:</label>
          <select 
            id="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.statusSelect}
          >
            <option value="All">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Requests table */}
      {error ? (
        <div style={styles.errorCard}>
          <span style={styles.errorText}>Failed to retrieve Tatkal queue from database.</span>
          <button style={styles.retryBtn} onClick={fetchRequests}>Retry</button>
        </div>
      ) : loading ? (
        <div style={styles.loadingWrapper}>
          <div style={styles.spinner}></div>
          <span>Loading scheduled Tatkal queue...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div style={styles.emptyWrapper}>
          <Clock size={48} color="#CCCCCC" style={{ marginBottom: '12px' }} />
          <p style={styles.emptyText}>No requests found matching your filter criteria.</p>
        </div>
      ) : (
        <TatkalTable 
          requests={filteredRequests} 
          onSimulateFire={handleSimulateFire}
          firingIds={firingIds}
        />
      )}

      <footer style={styles.footer}>
        <span>Last updated: {lastUpdated}</span>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heading: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    marginBottom: '4px'
  },
  subheading: {
    fontSize: '14px',
    color: 'var(--color-text-secondary)'
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--color-orange)',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    color: 'var(--color-white)',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    outline: 'none'
  },
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    border: '1px solid #F0F0F0'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    borderRight: '1px solid #F0F0F0',
    paddingRight: '10px'
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase'
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111111'
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    padding: '8px 16px',
    flex: 1,
    minWidth: '280px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    width: '100%',
    color: '#111111'
  },
  filterBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-text-secondary)'
  },
  statusSelect: {
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    color: '#111111',
    backgroundColor: '#FFFFFF',
    outline: 'none',
    cursor: 'pointer'
  },
  loadingWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #F0F0F0'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #F3F3F3',
    borderTop: '4px solid var(--color-orange)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  emptyWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '300px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #F0F0F0'
  },
  emptyText: {
    color: '#777777',
    fontSize: '15px',
    fontWeight: '500'
  },
  errorCard: {
    border: '1px solid var(--color-orange)',
    backgroundColor: '#FFF5F0',
    borderRadius: '8px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  errorText: {
    color: 'var(--color-orange)',
    fontWeight: '600'
  },
  retryBtn: {
    backgroundColor: 'var(--color-orange)',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  footer: {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    marginTop: '8px'
  }
};
