# Recording Studio Manager - User Guide

> **Version:** 1.0.0
> **Last Updated:** December 2024

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Managing Clients](#managing-clients)
4. [Recording Sessions](#recording-sessions)
5. [Studio Rooms](#studio-rooms)
6. [Invoicing](#invoicing)
7. [Music Projects](#music-projects)
8. [File Management](#file-management)
9. [Client Portal](#client-portal)
10. [Settings](#settings)
11. [Reports & Analytics](#reports--analytics)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First Login

1. Navigate to your studio's RSM URL (e.g., `https://yourstudio.rsm.app`)
2. Enter your email and password
3. If 2FA is enabled, enter the code from your authenticator app
4. You'll be redirected to the Dashboard

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | Studio owner/manager | Full access to all features |
| **Member** | Staff member | Manage sessions, clients, invoices |
| **Client** | Studio client | View own sessions, pay invoices |

### Navigation

The sidebar provides quick access to:

- **Dashboard** - Overview and quick actions
- **Sessions** - Recording session management
- **Clients** - Client database
- **Rooms** - Studio room configuration
- **Invoices** - Billing management
- **Projects** - Music project tracking
- **Files** - Audio file storage
- **Settings** - Configuration options

---

## Dashboard

The Dashboard provides an at-a-glance view of your studio's activity.

### Key Metrics

- **Today's Sessions** - Sessions scheduled for today
- **Pending Invoices** - Unpaid invoices requiring attention
- **Monthly Revenue** - Revenue for the current month
- **Active Projects** - Projects currently in progress

### Quick Actions

- **+ New Session** - Schedule a new recording session
- **+ New Client** - Add a new client to your database
- **+ New Invoice** - Create a new invoice

### Recent Activity

Shows the latest actions:
- New bookings
- Completed sessions
- Paid invoices
- File uploads

---

## Managing Clients

### Adding a New Client

1. Click **Clients** in the sidebar
2. Click **+ Add Client**
3. Fill in the required information:
   - **Name** (required)
   - **Email** (required)
   - **Phone** (optional)
   - **Company** (optional)
   - **Notes** (optional)
4. Click **Save**

### Client Details

Click on a client to view:

- **Contact Information** - Email, phone, company
- **Session History** - All past and upcoming sessions
- **Invoice History** - All invoices and payment status
- **Projects** - Associated music projects
- **Files** - Shared files

### Editing a Client

1. Open the client's details
2. Click **Edit**
3. Make your changes
4. Click **Save**

### Client Portal Access

To enable client portal access:

1. Open client details
2. Click **Enable Portal Access**
3. Client receives an email with login instructions

---

## Recording Sessions

### Scheduling a Session

1. Click **Sessions** in the sidebar
2. Click **+ New Session**
3. Fill in the details:
   - **Client** - Select from your client list
   - **Room** - Choose the studio room
   - **Title** - Session name/description
   - **Start Time** - Date and time
   - **End Time** - Expected end time
   - **Hourly Rate** - Rate for this session
   - **Notes** - Additional information
4. Click **Create Session**

### Calendar View

The Sessions page offers two views:

- **List View** - Table format with filters
- **Calendar View** - Weekly/monthly calendar

### Session Status

| Status | Description |
|--------|-------------|
| **Scheduled** | Upcoming session |
| **In Progress** | Currently happening |
| **Completed** | Finished, ready for invoicing |
| **Cancelled** | Session was cancelled |

### Completing a Session

1. Open the session details
2. Click **Complete Session**
3. Adjust the actual end time if different
4. Review the calculated total
5. Click **Confirm**

The session can now be added to an invoice.

### Recurring Sessions

For regular clients:

1. Create a session as normal
2. Check **Make Recurring**
3. Select frequency (weekly, bi-weekly, monthly)
4. Set end date or number of occurrences
5. Click **Create All Sessions**

---

## Studio Rooms

### Room Configuration

1. Click **Settings** > **Rooms**
2. Click **+ Add Room**
3. Configure:
   - **Name** - Room identifier (e.g., "Studio A")
   - **Type** - Recording, Mixing, Mastering, Rehearsal
   - **Hourly Rate** - Default rate
   - **Capacity** - Number of people
   - **Equipment** - List of available gear
4. Click **Save**

### Room Availability

View room schedules:

1. Click **Rooms** in the sidebar
2. Select a room
3. View the calendar with all bookings
4. Available slots shown in green
5. Booked slots shown in red

### Equipment Tracking

For each room, track:

- Microphones
- Preamps
- Monitors
- Instruments
- Software/plugins available

---

## Invoicing

### Creating an Invoice

**From Sessions:**

1. Go to **Invoices** > **+ New Invoice**
2. Select the client
3. Check the sessions to include
4. Review line items (auto-calculated from sessions)
5. Add any additional items
6. Set due date
7. Click **Create Invoice**

**Manual Invoice:**

1. Go to **Invoices** > **+ New Invoice**
2. Select **Create Manually**
3. Add line items:
   - Description
   - Quantity
   - Unit Price
4. Set due date
5. Click **Create Invoice**

### Invoice Status

| Status | Description |
|--------|-------------|
| **Draft** | Not yet sent to client |
| **Sent** | Emailed to client |
| **Paid** | Payment received |
| **Overdue** | Past due date, unpaid |
| **Cancelled** | Invoice voided |

### Sending an Invoice

1. Open the invoice
2. Click **Send**
3. Customize the email message (optional)
4. Click **Send Invoice**

The client receives an email with:
- Invoice PDF attachment
- Link to pay online
- Due date reminder

### Payment Processing

**Online Payment (Stripe):**

1. Client clicks payment link in email
2. Enters card details
3. Payment processed automatically
4. Invoice marked as paid
5. You receive notification

**Manual Payment:**

1. Open the invoice
2. Click **Mark as Paid**
3. Enter payment details:
   - Payment date
   - Payment method (cash, check, wire)
   - Reference number
4. Click **Confirm**

### Invoice PDF

Download or preview invoice PDF:

1. Open the invoice
2. Click **Download PDF** or **Preview**

PDF includes:
- Your studio branding
- Client details
- Line items with descriptions
- Subtotal, tax, total
- Payment instructions

---

## Music Projects

### Project Pipeline

Projects follow a workflow:

1. **Planning** - Initial discussions, budget
2. **Recording** - Studio sessions
3. **Mixing** - Mix engineering
4. **Mastering** - Final mastering
5. **Delivered** - Project complete

### Creating a Project

1. Click **Projects** > **+ New Project**
2. Fill in details:
   - **Client** - Project owner
   - **Title** - Album/EP/Single name
   - **Genre** - Music genre
   - **Target Release Date** - Expected delivery
   - **Budget** - Project budget
3. Click **Create Project**

### Adding Tracks

1. Open the project
2. Click **+ Add Track**
3. Enter track details:
   - Title
   - Duration
   - BPM
   - Key
   - Notes
4. Click **Add**

### Track Versions

Track versions for revisions:

1. Open a track
2. Click **Versions**
3. View all versions with dates
4. Set current version
5. Download any version

### Musicians & Credits

Add collaborators:

1. Open project
2. Go to **Credits** tab
3. Click **+ Add Credit**
4. Select/create musician
5. Assign role (vocalist, guitarist, etc.)
6. Add for specific tracks or entire project

---

## File Management

### Uploading Files

1. Go to **Files** or open a project/session
2. Click **Upload**
3. Select files (drag & drop supported)
4. Files upload to secure S3 storage
5. Progress bar shows upload status

### Supported Formats

- **Audio:** WAV, AIFF, FLAC, MP3, M4A
- **Documents:** PDF, DOC, TXT
- **Images:** JPG, PNG, TIFF
- **Projects:** Pro Tools, Logic, Ableton

### File Organization

Files are organized by:

- Project
- Session
- Custom folders

### Sharing Files

Share with clients:

1. Select file(s)
2. Click **Share**
3. Choose sharing options:
   - **Link** - Generate shareable link
   - **Email** - Send directly to client
   - **Portal** - Add to client portal
4. Set expiration (optional)
5. Click **Share**

### Version Control

For audio files:

1. Upload new version of existing file
2. System keeps all versions
3. Compare versions
4. Restore previous version if needed

---

## Client Portal

### What Clients Can Do

- View upcoming sessions
- See session history
- View and pay invoices
- Download files shared with them
- Book new sessions (if enabled)
- View project progress

### Enabling Client Booking

1. Go to **Settings** > **Client Portal**
2. Enable **Self-Service Booking**
3. Configure:
   - Allowed rooms
   - Booking hours
   - Advance notice required
   - Approval required (yes/no)
4. Click **Save**

### Client Portal Branding

Customize the portal appearance:

1. Go to **Settings** > **Branding**
2. Upload your logo
3. Set brand colors
4. Add custom domain (optional)

---

## Settings

### Organization Settings

- **Name** - Studio name
- **Timezone** - Default timezone
- **Currency** - Primary currency
- **Tax Rate** - Default tax percentage

### User Management

1. Go to **Settings** > **Users**
2. **Invite User:**
   - Enter email
   - Select role
   - Send invitation
3. **Manage Users:**
   - Edit roles
   - Deactivate accounts
   - Reset passwords

### Two-Factor Authentication

Enable 2FA for enhanced security:

1. Go to **Settings** > **Security**
2. Click **Enable 2FA**
3. Scan QR code with authenticator app
4. Enter verification code
5. Save backup codes securely

### Email Templates

Customize automatic emails:

1. Go to **Settings** > **Email Templates**
2. Edit templates:
   - Invoice sent
   - Payment received
   - Session reminder
   - Welcome email
3. Use variables like `{{client_name}}`, `{{invoice_total}}`

### Integrations

Connect third-party services:

- **Stripe** - Payment processing
- **Google Calendar** - Sync sessions
- **Zapier** - Automation workflows
- **Slack** - Notifications

---

## Reports & Analytics

### Available Reports

1. **Revenue Report**
   - Total revenue by period
   - Revenue by client
   - Revenue by room
   - Payment method breakdown

2. **Session Report**
   - Sessions by status
   - Room utilization
   - Peak hours analysis
   - Cancellation rate

3. **Client Report**
   - Top clients by revenue
   - Client retention
   - New client acquisition

### Generating Reports

1. Go to **Reports**
2. Select report type
3. Set date range
4. Apply filters (optional)
5. Click **Generate**
6. Export to PDF or CSV

### Dashboard Analytics

The Dashboard shows:

- Revenue trend (last 12 months)
- Session count chart
- Room utilization percentage
- Outstanding invoices total

---

## Troubleshooting

### Common Issues

**Can't log in:**
- Check email/password
- Clear browser cache
- Try password reset
- Check if account is active

**Session not saving:**
- Check for time conflicts
- Verify all required fields
- Try refreshing the page

**Invoice not sending:**
- Verify client email
- Check spam folder
- Try resending

**File upload failing:**
- Check file size (max 500MB)
- Check file format
- Try different browser

### Getting Help

1. **Help Center:** Click **?** icon in top right
2. **Email Support:** support@rsm.app
3. **Live Chat:** Available during business hours
4. **Documentation:** docs.rsm.app

### System Status

Check system status at: status.rsm.app

Shows:
- API status
- Regional availability
- Scheduled maintenance

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search |
| `Ctrl/Cmd + N` | New item (context-dependent) |
| `Ctrl/Cmd + S` | Save |
| `Esc` | Close modal/dialog |
| `?` | Show keyboard shortcuts |

---

## Mobile App

RSM is available on mobile:

- **iOS:** App Store
- **Android:** Google Play

Features:
- View today's schedule
- Quick session check-in
- Push notifications
- Client contact info
- Invoice status

---

## Data Security

### What We Protect

- All data encrypted at rest (AES-256)
- All connections encrypted in transit (TLS 1.3)
- Regular security audits
- SOC2 Type II compliant

### Your Responsibilities

- Use strong passwords
- Enable 2FA
- Don't share login credentials
- Log out on shared devices
- Report suspicious activity

### Data Export

Export your data anytime:

1. Go to **Settings** > **Data**
2. Click **Export All Data**
3. Choose format (JSON, CSV)
4. Download archive

---

## Updates & Changelog

Stay informed about new features:

1. Click bell icon for notifications
2. Subscribe to changelog emails
3. Follow us on social media

Recent updates appear in Dashboard sidebar.
