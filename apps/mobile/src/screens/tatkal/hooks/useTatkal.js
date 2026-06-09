import { useState, useEffect, useCallback } from 'react';
import { getMyRequests } from '../services/tatkalService';

const useTatkal = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyRequests();
      setRequests(res.data || []);
    } catch (err) {
      console.error('[useTatkal] Fetch requests error:', err);
      setError('Failed to retrieve your booking requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const activeRequest = requests.find(
    r => r.status === 'PENDING' || r.status === 'FIRED'
  );
  const confirmedRequests = requests.filter(r => r.status === 'CONFIRMED');

  return {
    requests,
    activeRequest,
    confirmedRequests,
    loading,
    error,
    refetch: fetchRequests
  };
};

export default useTatkal;
