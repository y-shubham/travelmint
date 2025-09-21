export default (name, p) => `
  <div style="font-family:sans-serif">
    <h2>Payment received</h2>
    <p>Hi ${name}, your payment was captured successfully.</p>
    <ul>
      <li>Order ID: ${p.order_id}</li>
      <li>Payment ID: ${p.id}</li>
      <li>Amount: ₹${(p.amount / 100).toFixed(2)}</li>
      <li>Method: ${p.method || "-"}</li>
      <li>Status: ${p.status}</li>
    </ul>
  </div>`;
