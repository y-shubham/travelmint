# TravelMint

A full-stack travel packages app where users discover, rate, and book trips; admins manage packages, users, and payments. Includes **email verification**, **forgot/reset password**, and **Razorpay** payment gateway.

---

## Features

- 🔎 Browse & search with filters: Offers, Top Rated, Latest, Most Rated  
- 📄 Package page: carousel, price (with discount badge), details, ratings & reviews  
- ⭐ Rate/review (1 per user per package)  
- 💳 Book & pay via **Razorpay PG**  
- 👤 Profile (update username, email, city, phone) + change password  
- ✉️ **Email verification** flow  
- 🔐 **Forgot / Reset password** via email link  
- 📦 Admin dashboard: Add/Update/Delete packages, list users, bookings + chart, payments, ratings/reviews, history  
- 🖼️ Image uploads to Firebase Storage

---

## Tech Stack

**Frontend:** React, React Router, Redux Toolkit, Tailwind classes, MUI Rating, Swiper, Recharts, timeago.js  
**Backend:** Node.js, Express, MongoDB/Mongoose, JWT, Nodemailer  
**Payments:** Razorpay Checkout  
**Storage:** Firebase Storage

---


> Make sure your server CORS allows `CLIENT_URL`.

---

## Quick Start

```bash
# Backend
npm install
npm run dev

# Frontend (new terminal)
cd client
npm install
npm run dev