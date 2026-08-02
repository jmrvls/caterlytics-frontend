import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
}

// Renamed from getBookings -> getAllBookings to match the Vue file
export async function getAllBookings() {
  const response = await axios.get(`${API_URL}/bookings`, getAuthHeaders());
  // Backend returns { bookings: [...] }, so unwrap it here to return a plain array
  return response.data.bookings || [];
}

export async function createBooking(bookingData) {
  const response = await axios.post(`${API_URL}/bookings`, bookingData, getAuthHeaders());
  return response.data;
}

export async function updateBookingStatus(id, status) {
  const response = await axios.patch(`${API_URL}/bookings/${id}/status`, { status }, getAuthHeaders());
  return response.data;
}

export async function deleteBooking(id) {
  const response = await axios.delete(`${API_URL}/bookings/${id}`, getAuthHeaders());
  return response.data;
}

// Client-side conflict check (no dedicated /check-conflict endpoint on the backend yet,
// used here for a real-time warning in the modal before the form is submitted.
// The backend still does the authoritative check on POST — see createBooking above).
export async function checkDateConflict(eventDate) {
  const allBookings = await getAllBookings();
  const existing = allBookings.filter(
    (b) =>
      b.event_date === eventDate &&
      ['Pending', 'Confirmed'].includes(b.booking_status)
  );
  return {
    conflict: existing.length > 0,
    existingBookings: existing
  };
}