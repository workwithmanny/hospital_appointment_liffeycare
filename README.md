# LiffeyCare - Hospital Appointment Management Platform

A modern, full-featured hospital appointment management web application built with Next.js 14, TypeScript, Supabase, Tailwind CSS, and integrated notification services. LiffeyCare streamlines appointment booking, doctor-patient interactions, and healthcare management with a clean, clinical-grade interface.

## 🏥 Overview

LiffeyCare is a comprehensive healthcare platform that enables:

- **Patients** to browse doctors, book appointments, manage their health records, and communicate with healthcare providers
- **Doctors** to manage availability, view appointments, consult with patients, and handle pricing
- **Admins** to oversee analytics, approve doctors, manage system settings, and monitor operations

The platform emphasizes trust, clarity, and streamlined healthcare delivery with real-time notifications via email and SMS.

## 🎯 Key Features

- **Appointment Management**
  - Real-time appointment booking with slot availability
  - Appointment history and status tracking (scheduled, completed, cancelled)
  - Email and SMS reminders (24-hour, confirmation, cancellation)

- **Doctor Management**
  - Doctor registration and approval workflow
  - Availability scheduling (day/time, lunch breaks)
  - Consultation pricing configuration
  - Patient management interface

- **Patient Experience**
  - Intuitive appointment booking form
  - Doctor search and filtering
  - Session notes and medical history
  - In-app messaging with doctors

- **Real-time Notifications**
  - **Resend** for transactional emails
  - **Twilio** for SMS reminders
  - Event-driven dispatcher system

- **Admin Dashboard**
  - Analytics and insights
  - Doctor approval management
  - System settings and configuration
  - Activity logging

- **Security & Authentication**
  - Supabase authentication with role-based access control (RBAC)
  - Session management
  - Protected routes and API endpoints

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI |
| **Backend** | Next.js API Routes (Node.js) |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **Email** | Resend |
| **SMS** | Twilio |
| **Testing** | Jest, React Testing Library |
| **Linting** | ESLint, Next.js ESLint config |
| **Type Checking** | TypeScript |
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
  "twilio": "^5.9.0",
  "tailwindcss": "^3.4.17",
  "zod": "^3.25.76",
  "lucide-react": "^1.0.1"
}
```

## 📁 Project Structure

```
liffeycare/
├── app/
│   ├── (auth)/                 # Authentication routes
│   ├── admin/                  # Admin dashboard
│   ├── doctor/                 # Doctor routes
│   ├── patient/                # Patient routes
│   ├── api/                    # API endpoints
│   │   ├── appointments/       # Appointment CRUD
│   │   ├── auth/               # Auth endpoints
│   │   ├── doctor/             # Doctor data endpoints
│   │   ├── messages/           # Messaging endpoints
│   │   └── seed-appointment/   # Test data seeding
│   └── session/                # Consultation sessions
├── lib/
│   ├── auth/                   # Authentication utilities
│   │  ├── guards.ts            # RBAC guards
│   │  └── session.ts           # Session management
│   ├── booking/                # Booking service
│   ├── notifications/          # Notification system
│   │  ├── dispatcher.ts        # Event dispatcher
│   │  └── providers/           # Email/SMS providers
│   │      ├── resend.ts        # Resend integration
│   │      └── twilio.ts        # Twilio integration
│   ├── supabase/               # Database clients
│   │  ├── admin.ts             # Supabase admin client
│   │  ├── client.ts            # Browser client
│   │  └── server.ts            # Server client
│   └── types.ts                # TypeScript interfaces
├── components/
│   └── ui/                     # Reusable UI components
├── supabase/
│   ├── schema.sql              # Database schema
│   └── migrations/             # Database migrations
├── tests/                      # Unit tests
├── docs/
│   └── uat-checklist.md        # Testing checklist
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD
├── jest.config.ts              # Jest configuration
├── jest.setup.ts               # Jest setup file
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (Check with `node --version`)
- **npm** or **yarn**
- **Git**
- Supabase account (free tier available)
- Twilio account (SMS notifications)
- Resend account (email notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/liffeycare.git
   cd liffeycare
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables** (see [Environment Variables](#-environment-variables) section)

5. **Initialize the database**
   ```bash
   # Create tables and seed initial data
   npx supabase db push
   ```

### Running Locally

**Development Server**
```bash
npm run dev
# Server runs on http://localhost:3000
```

Visit `http://localhost:3000` in your browser.

**Production Build**
```bash
npm run build
npm start
```

**Type Checking**
```bash
npm run typecheck
```

**Linting**
```bash
npm run lint
```

## 🔔 Notifications Configuration

### Resend (Email Notifications)

Resend is used for transactional emails. Configure the following:

#### Setup Steps

1. **Sign up at [Resend.com](https://resend.com)**
2. **Get your API Key** from the dashboard
3. **Add environment variables:**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@liffeycare.app
   ```

#### Implementation

The email provider is located in [lib/notifications/providers/resend.ts](lib/notifications/providers/resend.ts):

```typescript
import { Resend } from "resend";

export async function sendEmailReminder(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { skipped: true, provider: "resend" };
  
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "noreply@liffeycare.app",
    to,
    subject,
    html
  });
  
  return { skipped: false, provider: "resend", result };
}
```

#### Triggered Events

- **Booking Confirmed** - Confirmation email with appointment details
- **24-Hour Reminder** - Automated reminder before appointment
- **Appointment Cancelled** - Cancellation notification
- **Doctor Emergency Cancel** - Urgent cancellation notice

#### Email Templates

Emails are generated dynamically in the dispatcher. To customize templates:
1. Edit [lib/notifications/dispatcher.ts](lib/notifications/dispatcher.ts)
2. Create HTML templates with appointment details
3. Test in development before deploying

---

### Twilio (SMS Notifications)

Twilio enables SMS reminders for appointment updates.

#### Setup Steps

1. **Sign up at [Twilio.com](https://www.twilio.com/console)**
2. **Create a Messaging Service** or get a phone number
3. **Get your credentials:**
   - Account SID
   - Auth Token
   - Twilio phone number

4. **Add environment variables:**
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_SMS_FROM=+1234567890
   ```

#### WhatsApp Integration

To enable WhatsApp notifications via Twilio:

1. **Enable WhatsApp in Twilio Console:**
   - Go to Messaging → Try it Out → Send an SMS
   - Request WhatsApp integration
   - Approve the WhatsApp Sender identity

2. **Update environment variable:**
   ```env
   TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
   ```

3. **Modify [lib/notifications/providers/twilio.ts](lib/notifications/providers/twilio.ts):**
   ```typescript
   // For WhatsApp
   const message = await client.messages.create({
     to: `whatsapp:${to}`,  // Add whatsapp: prefix
     from: process.env.TWILIO_WHATSAPP_FROM,
     body
   });
   ```

#### Implementation

The SMS provider is located in [lib/notifications/providers/twilio.ts](lib/notifications/providers/twilio.ts):

```typescript
import twilio from "twilio";

export async function sendSmsReminder(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM;
  if (!sid || !token || !from) return { skipped: true, provider: "twilio-sms" };

  const client = twilio(sid, token);
  const message = await client.messages.create({ to, from, body });
  return { skipped: false, provider: "twilio-sms", sid: message.sid };
}
```

#### International SMS

For international numbers:
- Use E.164 format: `+[country_code][number]`
- Example: `+353876543210` (Ireland)
- Check Twilio's supported countries in the console

#### Triggered Events

- **Booking Confirmed** - SMS confirmation with appointment time
- **24-Hour Reminder** - SMS reminder before appointment
- **Appointment Cancelled** - Cancellation SMS
- **Doctor Emergency Cancel** - Urgent SMS notification

---

### Notification Dispatcher

The dispatcher in [lib/notifications/dispatcher.ts](lib/notifications/dispatcher.ts) orchestrates multi-channel notifications:

```typescript
type ReminderEvent =
  | "booking_confirmed"
  | "appointment_24h_reminder"
  | "appointment_cancelled"
  | "doctor_emergency_cancel";

export async function dispatchReminder(
  event: ReminderEvent,
  payload: { email: string; phone?: string; name: string; slotTime: string }
) {
  // Sends email + SMS (if phone provided) in parallel
  const tasks: Promise<unknown>[] = [
    sendEmailReminder(payload.email, "LiffeyCare update", `<p>Hi ${payload.name}...</p>`)
  ];
  if (payload.phone) {
    tasks.push(sendSmsReminder(payload.phone, msg));
  }
  return Promise.all(tasks);
}
```

**Usage:**
```typescript
await dispatchReminder("booking_confirmed", {
  email: "patient@example.com",
  phone: "+353876543210",
  name: "John Doe",
  slotTime: "2024-03-25 14:00"
});
```

---

## 🧪 Testing

### Running Tests

**Run all tests**
```bash
npm test
```

**Watch mode** (re-run on file changes)
```bash
npm run test:watch
```

**Test coverage**
```bash
npm test -- --coverage
```

### Test Structure

Tests are located in the [tests/](tests/) directory:

```
tests/
├── auth.guards.test.ts     # RBAC and authentication guards
├── booking.service.test.ts # Appointment booking logic
└── ...other tests
```

### Test Setup

Configuration is in [jest.config.ts](jest.config.ts):
- **Test Environment:** jsdom (for React components)
- **Setup File:** [jest.setup.ts](jest.setup.ts)
- **Path Aliases:** `@/*` maps to root directory

### Writing Tests

Example test structure:
```typescript
import { describe, it, expect } from "@jest/globals";

describe("Booking Service", () => {
  it("should create an appointment", () => {
    const appointment = createAppointment({
      patientId: "123",
      doctorId: "456",
      slotTime: "2024-03-25T14:00:00Z"
    });
    
    expect(appointment).toBeDefined();
    expect(appointment.status).toBe("scheduled");
  });
});
```

### Testing API Routes

Use `jest.mock()` for Supabase and external services:

```typescript
jest.mock("@/lib/supabase/server", () => ({
  createServerClient: jest.fn()
}));

// Test your API route
const response = await POST(request);
expect(response.status).toBe(200);
```

### Testing Components

Use React Testing Library for component tests:

```typescript
import { render, screen } from "@testing-library/react";
import { BookingForm } from "@/app/patient/booking-form";

describe("BookingForm", () => {
  it("renders form fields", () => {
    render(<BookingForm />);
    expect(screen.getByLabelText(/doctor/i)).toBeInTheDocument();
  });
});
```

---

## 🚨 CI/CD Pipeline

LiffeyCare uses GitHub Actions for continuous integration. The pipeline runs on every push to `main`/`master` and all pull requests.

### Workflow File

[.github/workflows/ci.yml](.github/workflows/ci.yml)

### Pipeline Steps

1. **Checkout Code** - Pulls the latest code
2. **Setup Node.js** - Installs Node 20 with npm cache
3. **Install Dependencies** - `npm ci` (clean install)
4. **Linting** - `npm run lint` - Checks code style with ESLint
5. **Type Checking** - `npm run typecheck` - TypeScript validation
6. **Unit Tests** - `npm run test` - Jest test suite

### GitHub Actions Configuration

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main, master]

jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
```

### Local CI Testing

Run the same checks locally before pushing:

```bash
npm run ci
```

This runs: lint → typecheck → test

### Deployment Considerations

#### Pre-Deployment Checklist

Before deploying to production:

- ✅ All GitHub Actions pass
- ✅ Environment variables configured properly
- ✅ Database migrations applied
- ✅ Resend and Twilio credentials active
- ✅ Rate limiting configured
- ✅ CORS settings appropriate for domain
- ✅ Security headers set in next.config.mjs

#### Next Steps for CD

To add continuous deployment:

1. **Test Deployment** - Add build step
   ```yaml
   - run: npm run build
   ```

2. **Deploy to Vercel** - Add Vercel action
   ```yaml
   - uses: vercel/action@v4
     with:
       vercel-token: ${{ secrets.VERCEL_TOKEN }}
   ```

3. **Database Migrations** - Run migrations on deploy
   ```yaml
   - run: npx supabase db push --linked
   ```

---

## 🗄️ Database Schema

LiffeyCare uses Supabase (PostgreSQL) with the following core tables:

### Tables

**profiles** - User accounts (patients, doctors, admins)
```sql
id (UUID, PK)
role (TEXT: 'patient' | 'doctor' | 'admin')
full_name (TEXT)
phone (TEXT)
doctor_approved (BOOLEAN)
created_at (TIMESTAMPTZ)
```

**appointments** - Scheduled consultations
```sql
id (UUID, PK)
patient_id (UUID, FK → profiles)
doctor_id (UUID, FK → profiles)
slot_time (TIMESTAMPTZ)
status (TEXT: 'scheduled' | 'cancelled' | 'completed')
session_notes (TEXT)
created_at (TIMESTAMPTZ)
UNIQUE(doctor_id, slot_time)
```

**doctor_availability** - Doctor working hours
```sql
id (UUID, PK)
doctor_id (UUID, FK → profiles)
day_of_week (INT: 0-6, Sun-Sat)
start_time (TIME)
end_time (TIME)
break_start (TIME)
break_end (TIME)
```

**departments** - Medical departments
```sql
id (UUID, PK)
name (TEXT, UNIQUE)
```

**system_logs** - Audit trail
```sql
id (BIGSERIAL, PK)
actor_id (UUID, FK → profiles)
action (TEXT)
metadata (JSONB)
created_at (TIMESTAMPTZ)
```

### Database Migrations

Located in [supabase/migrations/](supabase/migrations/):

- `001_core_tables.sql` - Base schema
- `002_doctor_directory_and_tools.sql` - Doctor features
- `003_doctor_patient_contact_policy.sql` - Privacy/messaging
- `004_in_app_messages.sql` - Chat system
- `005_realtime_files_pricing_payment.sql` - Advanced features

### Running Migrations

```bash
# Apply pending migrations
npx supabase db push

# Reset database (development only)
npx supabase db reset

# Create new migration
npx supabase migration new migration_name
```

---

## 📋 Environment Variables

Create a `.env.local` file in the project root. See [.env.example](.env.example) for reference.

### Supabase Configuration

```env
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase Anon Key (public, safe in browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase Service Role Key (KEEP PRIVATE - server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Resend (Email)

```env
# Email service API key
RESEND_API_KEY=re_xxxxxxxxxxxxxxx

# Sender email address
RESEND_FROM_EMAIL=noreply@liffeycare.app
```

### Twilio (SMS & WhatsApp)

```env
# Twilio credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token

# SMS sender phone number (E.164 format)
TWILIO_SMS_FROM=+1234567890

# WhatsApp sender (optional)
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
```

### Application

```env
# Base URL for links in emails
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development|production

# Next.js
NEXT_PUBLIC_ENVIRONMENT=development|staging|production
```

### Getting Environment Variables

**Supabase:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project → Settings → API
3. Copy URL and anon key

**Resend:**
1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Copy API key

**Twilio:**
1. Go to [twilio.com/console](https://www.twilio.com/console)
2. Find Account SID and Auth Token
3. Go to Phone Numbers → Manage → Get a number

---

## 🔐 Authentication & Authorization

### Authentication Flow

LiffeyCare uses **Supabase Auth** (OAuth2/JWT):

1. User signs up/logs in
2. Supabase returns JWT token
3. Token stored in HTTP-only cookie
4. Middleware validates token on each request
5. Session established with user data

### Role-Based Access Control (RBAC)

Three roles with specific permissions:

| Role | Capabilities |
|------|--------------|
| **patient** | Book appointments, view doctors, chat with doctors |
| **doctor** | Manage availability, view appointments, message patients |
| **admin** | System configuration, doctor approvals, analytics |

### Guards

RBAC guards in [lib/auth/guards.ts](lib/auth/guards.ts):

```typescript
export function requireRole(...roles: Role[]) {
  return (session: Session | null) => {
    if (!session) throw new Error("Unauthorized");
    if (!roles.includes(session.user.role)) throw new Error("Forbidden");
    return session;
  };
}
```

### Protected Routes

Use guards in API routes and server components:

```typescript
import { requireRole } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  requireRole("admin")(session);
  // Safe to proceed - user is admin
}
```

---

## 📚 API Endpoints

### Appointments

**GET /api/appointments** - List user appointments
```typescript
// Response: Appointment[]
```

**POST /api/appointments** - Create appointment
```typescript
// Body: { patientId, doctorId, slotTime }
// Response: { id, status: "scheduled", ... }
```

### Doctor

**GET /api/doctor/availability** - Get doctor's available slots
```typescript
// Query: { doctorId, date }
// Response: Slot[]
```

**POST /api/doctor/consultation-price** - Set consultation fee
```typescript
// Body: { price: number }
```

### Messages

**POST /api/messages/send** - Send message to doctor
```typescript
// Body: { recipientId, content, appointmentId? }
```

**GET /api/messages/read** - Get conversation
```typescript
// Response: Message[]
```

### Admin

**GET /api/admin/doctors** - List pending doctor approvals
```typescript
// Response: DoctorProfile[]
```

### Seed Data

**POST /api/seed-appointment** - Create test appointments (dev only)

---

## 🎨 Design System

LiffeyCare uses a clinical-grade design system emphasizing trust and clarity.

See [liffeycare-design-system.md](liffeycare-design-system.md) for:
- Color tokens and palettes
- Typography and spacing
- Component guidelines
- UI patterns and best practices

**Color Tokens:**
- `bg-base` - Page background
- `bg-surface` - Cards and panels
- `text-primary` - Headings
- `text-secondary` - Labels
- `brand` - Primary action/CTAs

---

## 🤝 Contributing

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** and commit with clear messages
   ```bash
   git add .
   git commit -m "feat: add appointment reminders"
   ```

3. **Before pushing, run local checks**
   ```bash
   npm run ci  # lint → typecheck → test
   ```

4. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Address review feedback** and merge once CI passes

### Code Style

- **TypeScript** - Use strict mode
- **Components** - Functional components with hooks
- **Naming** - camelCase for variables, PascalCase for components
- **Files** - One component per file
- **Imports** - Use path alias `@/` for cleaner imports

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat: add 24-hour appointment reminder

Implements automated SMS and email reminders
24 hours before scheduled appointments.

Closes #123
```

---

## 🐛 Troubleshooting

### Development Issues

**Port 3000 already in use**
```bash
# Find process on port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

**Modules not found**
```bash
# Reinstall dependencies
rm package-lock.json node_modules -r
npm install
```

**TypeScript errors**
```bash
# Rebuild TypeScript
npm run typecheck

# Delete build cache
rm -r .next tsconfig.tsbuildinfo
npm run build
```

### Database Issues

**Supabase connection refused**
- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify API keys in `.env.local`
- Test connection: `npx supabase status`

**Migrations failed**
```bash
# Reset database (lose data!)
npx supabase db reset

# Then re-run migrations
npx supabase db push
```

### Notifications Not Sending

**Resend emails failing**
- Check API key format: should start with `re_`
- Verify sender email domain in Resend dashboard
- Check email recipient is valid

**Twilio SMS failing**
- Verify phone number in E.164 format: `+<country_code><number>`
- Check account SID and auth token
- Ensure SMS service has available credits

**Provider returning `skipped: true`**
- Environment variable is missing or empty
- Check `.env.local` for typos
- Restart dev server: `npm run dev`

---

## 📊 Monitoring & Logging

### System Logs

System logs are stored in the `system_logs` table for auditing:

```typescript
interface SystemLog {
  id: number;
  actor_id: UUID;      // User who performed action
  action: string;      // What was done
  metadata: JSON;      // Additional context
  created_at: DateTime;
}
```

### Accessing Logs

Via Supabase dashboard:
1. Go to SQL Editor
2. Query: `SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 100;`

### Application Logs

Check Next.js console output for server logs:
```bash
npm run dev
# Watch the terminal for [INFO] messages
```

---

## 🚢 Deployment

### Vercel (Recommended)

LiffeyCare is optimized for Vercel:

1. **Connect GitHub repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Enable automatic deployments** on `main` branch

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t liffeycare .
docker run -p 3000:3000 liffeycare
```

### Environment-Specific Settings

**Development** (.env.development)
- Use Supabase dev project
- Verbose logging enabled

**Production** (.env.production)
- Use Supabase prod project
- Security headers enabled
- Rate limiting active

---

## 📝 Testing Checklist

See [docs/uat-checklist.md](docs/uat-checklist.md) for comprehensive user acceptance testing guidelines covering:

- Patient workflows
- Doctor workflows
- Admin operations
- Notification delivery
- Edge cases and error handling

---

## 🆘 Support & Resources

### Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Resend Email API](https://resend.com/docs)
- [Twilio SMS API](https://www.twilio.com/docs/sms)

### Community

- [Supabase Discord](https://discord.supabase.com)
- [Next.js Discord](https://discord.gg/bUG2bVUf)
- [Tailwind CSS Discord](https://discord.gg/7NF8agU)

---

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

---

## 🙏 Acknowledgments

Built with modern web technologies and best practices in healthcare software development. Special thanks to:

- Supabase for backend infrastructure
- Vercel for Next.js platform
- Twilio for SMS delivery
- Resend for email service

---

**Last Updated:** March 25, 2024  
**Version:** 1.0.0

For questions or issues, please open a GitHub issue or contact the development team.
