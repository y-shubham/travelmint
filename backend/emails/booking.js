export default (name, booking) => `
  <div style="font-family:sans-serif">
    <h2>Booking confirmed 🎉</h2>
    <p>Hi ${name}, your package is booked.</p>
    <ul>
      <li>Package: ${booking.packageName}</li>
      <li>Date(s): ${booking.startDate}${
  booking.endDate ? " → " + booking.endDate : ""
}</li>
      <li>Guests: ${booking.guests}</li>
      <li>Total: ₹${Number(booking.total).toFixed(2)}</li>
      <li>Booking ID: ${booking.id}</li>
    </ul>
  </div>`;
