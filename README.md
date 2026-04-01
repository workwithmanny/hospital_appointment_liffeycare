# LiffeyCare

A modern hospital appointment management platform built with Next.js, TypeScript, Supabase, and Tailwind CSS. LiffeyCare streamlines healthcare delivery by connecting patients, doctors, and administrators through a secure, intuitive interface.

**Live Site:** [lifferycare.online](https://lifferycare.online)

---

## About This Project

This is a final year project submitted by **Adeniyi Emmanuel** as part of the **BSc Computing** program at **Dorset College Dublin**, 2026.

---

## Features

### Patient Features
- Browse and search doctors by specialty and availability
- Book, reschedule, and cancel appointments
- Real-time appointment status tracking
- Secure direct messaging with doctors
- File upload and sharing for medical documents
- View appointment history and session notes
- Receive email notifications for appointments

### Doctor Features
- Manage weekly availability and working hours
- Configure consultation pricing
- View and manage patient appointments
- Secure messaging with patients
- Access patient medical history and session notes
- Appointment management dashboard

### Admin Features
- Analytics dashboard with appointment insights
- Doctor approval and verification workflow
- User management and role assignment
- System activity logging
- Ban/suspend user accounts
- Platform-wide configuration settings

### Core Platform Features
- Role-based access control (RBAC)
- Secure authentication with Supabase Auth
- Real-time database updates
- Email notifications via Resend
- File storage and management
- Responsive design for all devices
- Comprehensive test coverage

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI |
| **Backend** | Next.js API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Email** | Resend |
| **Payments** | Stripe |
| **Testing** | Jest, React Testing Library |
| **CI/CD** | GitHub Actions |

### Core Dependencies

```json
{
  "@supabase/ssr": "^0.9.0",
  "@supabase/supabase-js": "^2.57.4",
  "next": "^14.2.33",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "resend": "^4.8.0",
  "stripe": "^21.0.1",
  "tailwindcss": "^3.4.17",
  "zod": "^3.25.76",
  "lucide-react": "^1.0.1"
}
```

---

## Project Structure

```
liffeycare/
├── app/                    # Next.js app router
│   ├── admin/              # Admin dashboard routes
│   ├── doctor/             # Doctor portal routes
│   ├── patient/            # Patient portal routes
│   ├── auth/               # Authentication routes
│   └── api/                # API endpoints
├── components/             # Reusable React components
├── lib/                    # Utility libraries
│   ├── auth/               # Authentication guards and session
│   ├── appointments/       # Appointment services
│   ├── booking/            # Booking logic
│   └── chat/               # Messaging utilities
├── hooks/                  # Custom React hooks
├── supabase/
│   ├── migrations/           # Database migrations
│   └── schema.sql          # Database schema
├── tests/                  # Unit and integration tests
└── docs/                   # Documentation
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Git
- Supabase account
- Resend account (for email notifications)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/liffeycare.git
   cd liffeycare
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   ```

4. Configure environment variables (see Environment Variables section)

5. Initialize the database
   ```bash
   npx supabase db push
   ```

### Running Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## Email Notifications

LiffeyCare uses **Resend** for transactional email notifications.

### Setup

1. Sign up at [Resend.com](https://resend.com)
2. Get your API Key from the dashboard
3. Add environment variables:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@liffeycare.app
   ```

### Triggered Events

- **Booking Confirmed** - Confirmation email with appointment details
- **24-Hour Reminder** - Automated reminder before appointment
- **Appointment Cancelled** - Cancellation notification
- **Doctor Emergency Cancel** - Urgent cancellation notice

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage

# Run CI checks (lint + typecheck + test)
npm run ci
```

---

## CI/CD

GitHub Actions runs on every push to `main` and all pull requests:

1. Linting (ESLint)
2. Type checking (TypeScript)
3. Unit tests (Jest)

### Local CI Testing

```bash
npm run ci
```

---

## Deployment

This application is deployed to **Vercel**.

**Production URL:** [https://lifferycare.online](https://lifferycare.online)

### Deployment Steps

1. Connect your GitHub repository to Vercel
2. Add environment variables in the Vercel dashboard
3. Deploy on push to main branch

---

## Database Schema

Core tables:

- **profiles** - User accounts (patients, doctors, admins)
- **appointments** - Scheduled consultations
- **doctor_availability** - Doctor working hours
- **departments** - Medical departments
- **messages** - Patient-doctor conversations
- **contact_messages** - Contact form submissions
- **system_logs** - Audit trail

See `supabase/migrations/` for full schema definitions.

### Running Migrations

```bash
# Apply pending migrations
npx supabase db push

# Reset database (development only)
npx supabase db reset
```

---

## Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@liffeycare.app

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_test_xxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxx

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## Authentication

LiffeyCare uses **Supabase Auth** (OAuth2/JWT) with role-based access control.

### Roles

| Role | Capabilities |
|------|--------------|
| **patient** | Book appointments, view doctors, chat with doctors |
| **doctor** | Manage availability, view appointments, message patients |
| **admin** | System configuration, doctor approvals, analytics |

### Guards

RBAC guards in `lib/auth/guards.ts`:

```typescript
export function requireRole(...roles: Role[]) {
  return (session: Session | null) => {
    if (!session) throw new Error("Unauthorized");
    if (!roles.includes(session.user.role)) throw new Error("Forbidden");
    return session;
  };
}
```

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/appointments` | List user appointments |
| `POST /api/appointments` | Create appointment |
| `GET /api/doctor/availability` | Get available slots |
| `POST /api/messages/send` | Send message |
| `GET /api/admin/analytics` | Get admin analytics |
| `POST /api/auth/*` | Authentication endpoints |

---

## Troubleshooting

### Development Issues

**Port 3000 already in use**
```bash
# Use different port
npm run dev -- -p 3001
```

**Modules not found**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors**
```bash
# Delete build cache and rebuild
rm -rf .next tsconfig.tsbuildinfo
npm run build
```

### Database Issues

**Supabase connection refused**
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify API keys in `.env.local`
- Test connection: `npx supabase status`

**Migrations failed**
```bash
# Reset database (development only)
npx supabase db reset

# Then re-run migrations
npx supabase db push
```

### Notifications Not Sending

**Resend emails failing**
- Check API key format: should start with `re_`
- Verify sender email domain in Resend dashboard
- Check email recipient is valid

---

## License

This project is part of academic coursework submitted to Dorset College Dublin.

---

**Author:** Adeniyi Emmanuel  
**Institution:** Dorset College Dublin  
**Program:** BSc Computing  
**Year:** 2026
