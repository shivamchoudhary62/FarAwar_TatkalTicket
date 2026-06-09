import apiClient from '../../../services/apiClient';

/**
 * Submits a new prefilled Tatkal request.
 * 
 * @param {object} data - Pre-fill request data
 * @param {string} data.from_station - Source station code (e.g. 'NDLS')
 * @param {string} data.to_station - Destination station code (e.g. 'MMCT')
 * @param {string} data.travel_date - Travel date string in 'YYYY-MM-DD'
 * @param {string} [data.train_number] - Preference train number
 * @param {string} data.class - Booking class ('SL', '3A', '2A', '1A', 'GEN')
 * @param {Array<object>} data.passengers - List of passenger profiles (name, age, gender)
 * @param {boolean} data.is_urgent - True if urgent quota is requested
 * @param {string} [data.urgency_reason] - Urgency category ('medical', 'bereavement', 'official', 'personal')
 * @param {string} [data.urgency_document_url] - URL to uploaded document in storage
 * @returns {Promise<object>} Response shape: { data: requestObject, message: string }
 */
export const submitPrefill = async (data) => {
  try {
    const response = await apiClient.post('/tatkal/prefill', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves all Tatkal requests belonging to the authenticated user.
 * 
 * @returns {Promise<object>} Response shape: { data: Array<requestObject>, message: string }
 */
export const getMyRequests = async () => {
  try {
    const response = await apiClient.get('/tatkal/my-requests');
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Retrieves a single Tatkal request by ID.
 * 
 * @param {string} id - The request UUID
 * @returns {Promise<object>} Response shape: { data: requestObject, message: string }
 */
export const getRequest = async (id) => {
  try {
    const response = await apiClient.get(`/tatkal/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Manually triggers fire execution simulation for testing/demo purposes.
 * 
 * @param {string} id - The request UUID
 * @returns {Promise<object>} Response shape: { data: confirmedRequestObject, message: string }
 */
export const fireRequest = async (id) => {
  try {
    const response = await apiClient.post(`/tatkal/fire/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Cancels a PENDING Tatkal request.
 * 
 * @param {string} id - The request UUID
 * @returns {Promise<object>} Response shape: { data: cancelledRequestObject, message: string }
 */
export const cancelRequest = async (id) => {
  try {
    const response = await apiClient.post(`/tatkal/cancel/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Searches the ticket surrender market for available listings.
 * 
 * @param {object} [filters] - Query parameters to filter listings
 * @param {string} [filters.from] - Source station code
 * @param {string} [filters.to] - Destination station code
 * @param {string} [filters.date] - Date string (YYYY-MM-DD)
 * @param {string} [filters.class] - Seat class
 * @returns {Promise<object>} Response shape: { data: Array<surrenderObject>, message: string }
 */
export const getSurrenders = async (filters = {}) => {
  try {
    const response = await apiClient.get('/tatkal/surrenders', { params: filters });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lists a confirmed ticket for surrender reallocation.
 * 
 * @param {object} data - Ticket details
 * @param {string} data.pnr - 10-digit ticket PNR
 * @param {string} data.from_station - Source station code
 * @param {string} data.to_station - Destination station code
 * @param {string} data.travel_date - Date string (YYYY-MM-DD)
 * @param {string} [data.train_number] - Train code
 * @param {string} data.class - Seat class
 * @returns {Promise<object>} Response shape: { data: surrenderListingObject, message: string }
 */
export const listSurrender = async (data) => {
  try {
    const response = await apiClient.post('/tatkal/surrender', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Claims / requests a surrendered ticket listing in the marketplace.
 * 
 * @param {string} id - Surrender listing UUID
 * @returns {Promise<object>} Response shape: { data: updatedMatchedSurrenderObject, message: string }
 */
export const requestSurrender = async (id) => {
  try {
    const response = await apiClient.post(`/tatkal/surrenders/${id}/request`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetches active journey locks for the authenticated user.
 * Used to display "Your Journey Locks" on TatkalHomeScreen.
 *
 * @returns {Promise<object>} Response shape: { data: Array<lockObject>, message: string }
 */
export const getMyLocks = async () => {
  try {
    const response = await apiClient.get('/tatkal/my-locks');
    return response.data;
  } catch (error) {
    throw error;
  }
};
