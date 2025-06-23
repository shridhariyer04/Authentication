# 🔐 Next.js Full-Stack Authentication System

A robust and secure **authentication system** built using modern technologies and production-ready practices. It features user signup, login (email + Google), OTP verification, password recovery, activity tracking, and more — all built with scalability and security in mind.


https://github.com/shridhariyer04/Authentication/issues/1#issue-3166388889



## ✨ Features

- ✅ **Email & Password Signup / Signin**
- ✅ **Google OAuth** using NextAuth.js
- ✅ **OTP-based email verification** (during signup and password reset)
- ✅ **Password reset with Resend**
- ✅ **Secure session management** via NextAuth
- ✅ **Activity Logging** with filters & dashboard
- ✅ **Brute force protection** (email/IP based)
- ✅ **Cron job for cleaning used/expired tokens**
- ✅ **Profile dashboard** to view user info
- ✅ **TypeScript + Drizzle ORM** for safety & type inference
- ✅ **Neon Database (Postgres)** + Drizzle ORM
- ✅ **Beautiful Tailwind UI dashboard**

---

## 🧠 Tech Stack

| Layer           | Stack                                  |
|----------------|-----------------------------------------|
| Frontend       | Next.js (App Router) + Tailwind CSS     |
| Auth Provider  | NextAuth.js (Email + Google)            |
| Database       | Neon (PostgreSQL)                       |
| ORM            | Drizzle ORM                             |
| Email Service  | Resend (OTP + reset emails)             |
| Scheduler      | Cron job for token cleanup              |
| Validation     | Zod (form + server validation)          |
| Language       | TypeScript                              |

---

## 🗃️ Database Overview

| Table           | Purpose                                                                 |
|----------------|-------------------------------------------------------------------------|
| `users`        | Stores all user info including name, email, and `isActive` flag         |
| `accounts`     | Linked OAuth accounts (Google login via NextAuth)                       |
| `verification_tokens` | Stores OTP tokens for email verification and password reset       |
| `activity_logs`| Tracks all user actions: login, logout, failed attempts, etc.           |

All tables are typed with Drizzle ORM and auto-migrated on schema change.

---

## 🛠️ Folder Structure

```
.
├── app/
│   ├── api/                    # Auth, user, activity endpoints
│   └── dashboard/              # Auth + Activity UI
├── lib/
│   ├── db/                     # Drizzle config, schemas
│   ├── auth/                   # NextAuth config
│   ├── logger/                 # Activity logger class
│   └── utils/                  # Helpers, validators, cron
├── public/
├── .env.example                # Environment variable template
└── README.md
```

---

## 🔐 Authentication Flow

### 1. **Signup Process:**
   - User can register via Email or Google OAuth
   - OTP sent using Resend email service
   - Verification token saved in `verification_tokens` table
   - On successful verification, `users.isActive` is set to `true`

### 2. **Login Process:**
   - Email + Password authentication or Google OAuth
   - Built-in brute-force protection via rate limiter
   - All authentication actions logged in `activity_logs`

### 3. **Password Recovery:**
   - User enters email address
   - OTP sent for identity verification
   - Once verified, password is updated securely

---

## 📊 Activity Logs

Each user action (login, logout, profile update, OTP verification, etc.) is logged via a centralized logger:

- **IP address & user agent** captured for security
- Stored in `activity_logs` table with timestamps
- **Filterable** by category, action, success status, date range
- Accessible via `/dashboard/activity` page

---

## 🧹 Automated Cleanup

A scheduled **cron job** runs periodically to clean up:
- Used OTP tokens
- Expired verification tokens
- Stale session data

> **Learning Point:** This project demonstrates how to set up and test backend-only cron tasks that handle sensitive data cleanup automatically.

---

## 📸 Screenshots

<!-- 📸 ADD SCREENSHOT: Login/Signup page -->
### Authentication Pages


<!-- 📸 ADD SCREENSHOT: OTP verification screen -->
### OTP Verification


<!-- 📸 ADD SCREENSHOT: User dashboard -->
### User Dashboard
https://github.com/shridhariyer04/Authentication/issues/4#issue-3166397435

<!-- 📸 ADD SCREENSHOT: Activity logs page -->
### Activity Logs

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/auth-system.git
cd auth-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Fill in the required values:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/dbname

# Email Service
RESEND_API_KEY=your-resend-api-key

# NextAuth
NEXTAUTH_SECRET=your-super-secret-key
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Run Database Migrations

```bash
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application running!

---

## 🔄 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/verify-otp` | POST | Verify OTP for signup/reset |
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/forgot-password` | POST | Send OTP for password reset |
| `/api/auth/reset-password` | POST | Reset password using OTP |
| `/api/user/activity-logs` | GET | Fetch paginated activity logs |
| `/api/user/activity-summary` | GET | Get activity summary by category |

---

## 🧠 Key Learning Highlights

- **Security First:** Implemented brute force protection with custom rate limiting
- **Email Integration:** Seamless OTP flow using Resend API
- **Modern Stack:** NextAuth.js integration with Drizzle ORM
- **Token Management:** Secure token handling with automated cleanup
- **Clean Architecture:** Proper separation of concerns with logging abstractions
- **Type Safety:** Full TypeScript implementation with Zod validation

---

## 🛡️ Security Features

- **Rate Limiting:** Prevents brute force attacks on login endpoints
- **OTP Verification:** Secure email-based verification for critical actions
- **Session Management:** Secure session handling via NextAuth.js
- **Input Validation:** Server-side validation using Zod schemas
- **Activity Monitoring:** Comprehensive logging for security auditing

---

## 📦 Dependencies

### Core Dependencies
- **Next.js** - React framework with App Router
- **NextAuth.js** - Authentication framework
- **Drizzle ORM** - Type-safe database ORM
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Static type checking

### Services
- **Neon Database** - Serverless PostgreSQL
- **Resend** - Email delivery service

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: https://github.com/shridhariyer04
- Portfolio: https://shridhariyer-portfolio.vercel.app/portfolio
- LinkedIn:www.linkedin.com/in/shridhar-iyer-94a526272

---

## ⭐️ Show Your Support

If this project helped you, please consider giving it a ⭐️ on GitHub!

[![GitHub stars](https://img.shields.io/github/stars/yourusername/auth-system.svg?style=social&label=Star)](https://github.com/yourusername/auth-system)

---

## 🔮 Future Enhancements

- [ ] Two-factor authentication (2FA)
- [ ] Social login with more providers
- [ ] Advanced user roles and permissions
- [ ] Email templates customization
- [ ] Mobile app support
- [ ] Admin dashboard for user management
