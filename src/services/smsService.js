import { supabase } from '../supabaseClient';

// Texts the client that their booking is confirmed.
// Never throws: a failed SMS must not undo or block the booking confirmation.
export async function sendBookingConfirmationSms(bookingId) {
  try {
    const { data, error } = await supabase.functions.invoke('send-booking-sms', {
      body: { booking_id: bookingId },
    });
    if (error) throw error;
    return data; // { sent: true } or { sent: false, reason }
  } catch (err) {
    console.error('Booking confirmation SMS failed:', err);
    return { sent: false, reason: 'error' };
  }
}
