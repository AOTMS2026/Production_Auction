# Auction Platform — Authentication README Updates

## 1. Email OTP Verification Using n8n

Email verification and OTP delivery are handled through the existing n8n webhook integration.

**n8n Webhook URL:**

`https://aotms.app.n8n.cloud/webhook/Auction`

The Node.js backend communicates with this webhook to initiate email OTP delivery. OTP generation, validation, expiry, and account verification must be handled according to the backend's authentication security rules.

### Email OTP Workflow

1. User submits the registration form.
2. Backend validates the mandatory fields: profile image, email, and password.
3. Backend checks whether the email is already registered.
4. Backend generates a cryptographically secure, time-limited OTP.
5. Backend stores a hash of the OTP with the email, expiry time, and verification status.
6. Backend sends the OTP request to the configured n8n webhook.
7. n8n processes the request and sends the OTP to the user's email.
8. User enters the received OTP on the frontend.
9. Frontend submits the email and OTP to the backend verification endpoint.
10. Backend validates the OTP, checks its expiry, and marks it as used.
11. After successful verification, the account becomes eligible for access according to its status and authorization rules.

### OTP Security Requirements

- Generate OTPs using a cryptographically secure random generator.
- Set a short expiry, such as 5 minutes.
- Store only a hash of the OTP.
- Limit verification attempts and OTP resend requests.
- Invalidate an OTP after successful verification.
- Ensure that a newly issued OTP invalidates the previous OTP.
- Do not log OTP values or expose them in API responses.
- Do not mark an email as verified merely because the n8n webhook returned a successful HTTP response.
- Handle webhook failures without falsely reporting that an email was delivered.
- Authenticate requests to the webhook using a server-side secret or another supported authentication mechanism.

## 2. Authentication API Endpoints

Base URL: `/api/v1`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/send-otp` | Request an email OTP |
| POST | `/auth/verify-otp` | Verify the email OTP |
| POST | `/auth/resend-otp` | Request a replacement OTP |
| POST | `/auth/login` | Authenticate a user or authorized admin |
| POST | `/auth/refresh` | Renew the access token |
| POST | `/auth/logout` | Revoke the current session |
| GET | `/auth/me` | Retrieve the authenticated user's profile |
| POST | `/auth/forgot-password` | Request password-reset verification |
| POST | `/auth/reset-password` | Reset the password |

The backend must enforce input validation, rate limiting, session security, and authorization for these endpoints.

## 3. n8n Webhook Integration

Use the existing webhook URL in the backend integration configuration. Do not expose internal webhook credentials in frontend code.

Example service structure:

```text
backend/
└── src/
    └── modules/
        └── auth/
            ├── auth.routes.js
            ├── auth.controller.js
            ├── auth.service.js
            ├── auth.validation.js
            └── otp.service.js
```

Responsibilities:

- `auth.controller.js`: Handles registration, login, and OTP requests.
- `auth.service.js`: Implements authentication and account-verification rules.
- `otp.service.js`: Generates OTPs, manages expiry, validates attempts, and invokes the n8n webhook.
- `auth.validation.js`: Validates request payloads.

### Webhook Request Example

The following is an illustrative payload. The exact request format must match the existing n8n workflow.

```json
{
  "email": "user@example.com",
  "otp": "123456",
  "purpose": "EMAIL_VERIFICATION"
}
```

The OTP must be sent only from the backend to n8n. Never return the OTP in the registration or send-OTP API response.

The backend should use a configured HTTP client with a timeout and controlled retry policy. Avoid automatic retries that could send duplicate emails or create inconsistent OTP states.

## 4. Environment Configuration

The n8n webhook URL is:

`https://aotms.app.n8n.cloud/webhook/Auction`

Reuse the existing backend `.env` values wherever already configured. Do not duplicate existing environment variables or introduce a second set of configuration values for the same purpose.

Keep webhook authentication credentials server-side. If webhook authentication has not yet been configured, add it using the authentication mechanism supported by the n8n workflow.

Never expose private environment variables through `NEXT_PUBLIC_` variables or commit them to GitHub.

## 5. Updated Registration and Verification Rules

- Profile image, email, and password are mandatory during registration.
- The backend assigns the `USER` role automatically.
- Public users cannot register as administrators.
- Email verification is completed through the backend's OTP verification endpoint.
- An unverified account cannot access features that require a verified email.
- The OTP is single-use and expires after the configured validity period.
- Only successful backend verification can mark the email as verified.
- Authentication and authorization remain enforced by the Node.js backend.

## 6. Testing Checklist

- [ ] Registration sends an OTP request to the n8n webhook.
- [ ] n8n sends the OTP email successfully.
- [ ] Correct OTP verifies the email.
- [ ] Incorrect OTP is rejected.
- [ ] Expired OTP is rejected.
- [ ] A previously used OTP cannot be reused.
- [ ] Resending an OTP invalidates the previous OTP.
- [ ] Repeated OTP requests are rate-limited.
- [ ] Webhook failures are handled safely.
- [ ] Unverified accounts cannot access restricted functionality.
- [ ] The OTP is never returned in API responses or application logs.
- [ ] Admin role assignment remains restricted to authorized provisioning.

**Architecture:** Next.js Frontend → Node.js / Express Backend → MongoDB, with n8n handling email OTP delivery through the configured webhook.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
# Auction Platform — Auction Management Module

**Frontend:** Next.js  
**Backend:** Node.js + Express.js  
**Database:** MongoDB + Mongoose  
**Authentication:** JWT + Refresh Token  
**Authorization:** Role-Based Access Control (RBAC)  
**Email OTP:** n8n Webhook Integration

---

## 1. Module Overview

The Auction Management Module allows authorized administrators to create, manage, publish, share, and control access to sports auctions.

The platform initially supports five sports:

1. Cricket
2. Volleyball
3. Football
4. Kabaddi
5. Badminton

Each auction has its own configuration, schedule, bidding rules, visibility settings, and access permissions.

### Main Objectives

- Allow administrators to create and manage sports auctions.
- Provide complete CRUD functionality.
- Support public and private auctions.
- Generate shareable auction links.
- Allow users to request access to private auctions.
- Allow authorized administrators to approve or reject access requests.
- Provide filters to discover auctions and manage access.
- Enforce authorization through the backend.

## 2. User Roles

### Admin

- Create auctions.
- View all auctions created by the admin.
- Edit auction details when permitted by the auction status.
- Delete or cancel auctions according to business rules.
- Publish, unpublish, and close auctions.
- Generate and share auction links.
- Configure public or private visibility.
- Review private auction access requests.
- Approve or reject access requests.
- Revoke previously granted access.
- View auction participants and activity.

### User

- View published public auctions.
- Search and filter available auctions.
- Open auction details.
- Share public auction links.
- Request access to private auctions.
- View their own access-request status.
- Access private auction details after authorization.
- Participate in bidding only when the auction is active and the user is eligible.

**Security rule:** Hiding an auction in the frontend is not sufficient. Every private-auction API must verify the user's permission on the backend.

## 3. Supported Sports

The `sport` field must accept only the following values:

| Sport | Enum Value |
|---|---|
| Cricket | `CRICKET` |
| Volleyball | `VOLLEYBALL` |
| Football | `FOOTBALL` |
| Kabaddi | `KABADDI` |
| Badminton | `BADMINTON` |

Store the enum value in the database and display the corresponding human-readable name in the frontend.

## 4. Create Auction Form

The administrator opens the Admin Dashboard and selects **Auctions → Create Auction**.

### Required Fields

| Field | Input Type | Required | Description |
|---|---|---|---|
| Auction Image | Image Upload | Yes | Cover image for the auction |
| Auction Name | Text | Yes | Name of the auction |
| Sport | Dropdown | Yes | One of the five supported sports |
| Auction Date | Date Picker | Yes | Scheduled auction date |
| Auction Time | Time Picker | Yes | Scheduled auction time |
| Players Per Team | Number | Yes | Maximum player slots per team |
| Points Balance / Team | Number | Yes | Budget available to each team |
| Minimum Bid | Number | Yes | Minimum allowed opening bid |
| Maximum Bid | Number | Yes | Maximum permitted player bid |
| Increased By | Number | Yes | Minimum bid increment |
| Auction Visibility | Radio / Select | Yes | Public or Private |

### Field Validation Rules

- Auction name must be trimmed and non-empty.
- Sport must match a supported enum value.
- Date and time must form a valid scheduled timestamp.
- Store timestamps consistently in UTC and display them in the configured auction timezone.
- Players per team must be a positive integer.
- Points balance per team must be greater than zero.
- Minimum bid must be greater than zero.
- Maximum bid must be greater than or equal to the minimum bid.
- Increased By must be greater than zero.
- Bid values must use a consistent numeric unit.
- The backend must validate every field, regardless of frontend validation.

### Bid Configuration Example

| Configuration | Example |
|---|---:|
| Players Per Team | 15 |
| Points Balance / Team | 100,000 |
| Minimum Bid | 500 |
| Maximum Bid | 20,000 |
| Increased By | 500 |

In this example, a valid bid sequence could be ₹500, ₹1,000, ₹1,500, and so on, up to ₹20,000.

The backend must enforce the maximum bid and increment rules. The actual auction engine must also validate the current highest bid, available team budget, remaining player slots, and auction status before accepting a bid.

The currency or points unit must be defined per auction. Do not assume that points represent real money.

## 5. Auction Visibility

### Public Auction

- Visible in public auction listings after publication.
- Discoverable through sport, date, name, and status filters.
- Accessible to users according to the auction's publication status.
- Shareable through a public URL.
- May still require registration or eligibility verification to place bids.

### Private Auction

- Not included in public auction listings.
- Accessible only to the auction owner and authorized users.
- Shareable through a private invitation link.
- Users can request access if the owner allows requests.
- The administrator can approve or reject requests.
- Approved users can access the auction according to their permissions.
- Revoked users lose access to protected private-auction resources.

A private link is not, by itself, an authorization mechanism. If private invitations use tokens, generate high-entropy tokens, store only token hashes, enforce expiry and revocation, and avoid exposing sensitive tokens in logs or analytics.

## 6. Auction CRUD Operations

CRUD means Create, Read, Update, and Delete.

### Create

1. Admin opens the Create Auction page.
2. Admin enters all required details.
3. Frontend validates the form.
4. Backend authenticates the administrator.
5. Backend validates the payload and uploaded image.
6. Backend creates the auction with its owner ID.
7. Backend saves the record in MongoDB.
8. Frontend displays the newly created auction.

An auction should normally start in `DRAFT` status and be published explicitly by the administrator.

### Read

The admin can view:

- All auctions they are authorized to manage.
- Auction details and configurations.
- Auction visibility and status.
- Participants and access requests.
- Auction activity and relevant reports.

Users can view published public auctions and private auctions for which they have valid authorization.

### Update

Admin can update auction details when permitted by its current status.

Examples:

- Change the auction name.
- Update the image.
- Change the date and time.
- Modify player and points configuration.
- Update bidding limits.
- Change visibility.
- Publish or unpublish an eligible auction.

Once bidding starts, critical fields should be locked or changed only through a controlled process. Changing bid rules during an active auction can invalidate bids and create disputes.

### Delete

- Draft auctions can be deleted when no dependent records prevent deletion.
- Published auctions should normally be cancelled or archived instead of permanently deleted.
- Auctions with bids, transactions, or audit records must follow an explicit retention policy.
- Only authorized administrators can delete or cancel auctions.
- All destructive actions must be logged.

Use soft deletion or archival for operational records. Avoid cascading deletion of financial records, bids, or audit history.

## 7. Auction Status Lifecycle

Recommended statuses:

- `DRAFT`
- `PUBLISHED`
- `SCHEDULED`
- `LIVE`
- `COMPLETED`
- `CANCELLED`
- `ARCHIVED`

Suggested lifecycle:

`DRAFT → PUBLISHED → SCHEDULED → LIVE → COMPLETED → ARCHIVED`

A cancellation can be allowed from eligible states according to business rules.

The backend must validate every status transition. A scheduled date passing does not automatically mean that an auction should become live unless the scheduling service and operational rules explicitly support it.

## 8. Auction Sharing

Each auction has a **Share Auction** action.

### Sharing Workflow

1. Admin opens the auction details page.
2. Admin selects Share Auction.
3. The frontend displays the auction URL.
4. Admin copies the URL or uses the browser's native sharing functionality.
5. The recipient opens the link.
6. The backend checks auction visibility, publication status, and authorization.
7. The user sees the auction or an appropriate access-request screen.

### Example URLs

Public auction:

`https://yourdomain.com/auctions/auction-slug-or-id`

Private auction:

`https://yourdomain.com/auctions/auction-slug-or-id`

Use the same canonical auction URL where possible. The backend decides whether to show details, require login, or request access.

For invitation-only access, an optional separate invitation URL may be used. Its token must be treated as a secret and support expiry, revocation, and controlled redemption.

### Share Options

- Copy Link
- Native Share
- Email invitation
- WhatsApp share
- Revoke Invitation, if token-based invitations are enabled

Sharing an auction URL must never automatically grant private-auction access.

## 9. Private Auction Access Management

### Access Request Workflow

1. A user opens a private auction link.
2. Backend confirms that the auction exists and the user is not already authorized.
3. If the user is logged out, the frontend asks them to log in.
4. User selects Request Access.
5. Backend creates an access-request record.
6. Admin sees the request in the Access Requests dashboard.
7. Admin approves or rejects the request.
8. Backend records the decision.
9. On approval, the user receives access according to the configured policy.
10. The user can open the private auction and participate only if separately eligible to bid.

### Access Request Statuses

| Status | Meaning |
|---|---|
| `PENDING` | Waiting for administrator review |
| `APPROVED` | Access granted |
| `REJECTED` | Request denied |
| `REVOKED` | Previously granted access removed |

A unique compound index on `auctionId` and `userId` can prevent duplicate access-request records. Define a clear re-request policy if rejected users are allowed to apply again.

### Access Management Actions

- View pending requests.
- Filter by status.
- Search by user.
- Approve access.
- Reject access.
- Revoke approved access.
- Review request and decision timestamps.
- View administrator decision history.

Access revocation must take effect on subsequent protected API requests, not merely hide the auction from the user's dashboard.

## 10. Filtering and Search

### Admin Auction Filters

- Sport
- Auction name
- Auction date range
- Visibility: Public / Private
- Status
- Created date range
- Owner, if the administrator manages multiple organizations
- Sorting by newest, oldest, date, or name

### User Auction Filters

- Sport
- Auction name
- Date range
- Public visibility
- Auction status
- Upcoming auctions
- Live auctions
- Completed auctions

### Access Request Filters

- Auction
- User
- Request status
- Request date range
- Decision date range

### API Query Examples

```text
GET /api/v1/auctions?sport=CRICKET&visibility=PUBLIC
GET /api/v1/auctions?status=SCHEDULED&sortBy=scheduledAt
GET /api/v1/auctions?search=Championship&page=1&limit=20
GET /api/v1/admin/access-requests?status=PENDING
```

The backend must apply authorization before returning results. Public listing filters must not leak private auction names, IDs, images, or other metadata.

All list endpoints should use pagination and enforce a maximum page size.

## 11. MongoDB Data Models

### Auction Model

Suggested collection: `auctions`

```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,

  sport: {
    type: String,
    enum: [
      "CRICKET",
      "VOLLEYBALL",
      "FOOTBALL",
      "KABADDI",
      "BADMINTON"
    ],
    required: true
  },

  image: {
    url: String,
    storageKey: String
  },

  scheduledAt: Date,
  timezone: String,

  playersPerTeam: Number,
  pointsBalancePerTeam: Number,

  minimumBid: Number,
  maximumBid: Number,
  bidIncrement: Number,

  visibility: {
    type: String,
    enum: ["PUBLIC", "PRIVATE"],
    required: true
  },

  status: {
    type: String,
    enum: [
      "DRAFT",
      "PUBLISHED",
      "SCHEDULED",
      "LIVE",
      "COMPLETED",
      "CANCELLED",
      "ARCHIVED"
    ],
    default: "DRAFT"
  },

  ownerId: ObjectId,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}
```

This is a schema specification, not a complete Mongoose implementation. Add required validators, indexes, authorization checks, and any organization or tenant ownership fields needed by the platform.

### Access Request Model

Suggested collection: `auctionAccessRequests`

```javascript
{
  _id: ObjectId,
  auctionId: ObjectId,
  userId: ObjectId,

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED", "REVOKED"],
    default: "PENDING"
  },

  requestedAt: Date,
  reviewedAt: Date,
  reviewedBy: ObjectId,
  decisionNote: String
}
```

Create a unique compound index on `{ auctionId: 1, userId: 1 }` if only one request record per user and auction is maintained.

### Additional Collections

As the system grows, consider:

- `auctionParticipants` for explicit access grants and eligibility.
- `auctionInvitations` for expiring invitation tokens.
- `auctionAuditLogs` for changes to auction configuration and permissions.
- `bids` for the bidding engine.
- `teams` and `players` for roster and allocation management.

Keep access requests, invitation tokens, and actual auction participation conceptually separate.

## 12. Backend Folder Structure

```text
backend/
└── src/
    ├── app.js
    ├── server.js
    │
    ├── config/
    │   ├── database.js
    │   ├── env.js
    │   └── cors.js
    │
    ├── middleware/
    │   ├── authenticate.js
    │   ├── authorize.js
    │   ├── validateRequest.js
    │   ├── upload.js
    │   ├── rateLimiter.js
    │   └── errorHandler.js
    │
    ├── modules/
    │   ├── auth/
    │   ├── users/
    │   ├── auctions/
    │   │   ├── auction.model.js
    │   │   ├── auction.routes.js
    │   │   ├── auction.controller.js
    │   │   ├── auction.service.js
    │   │   ├── auction.repository.js
    │   │   └── auction.validation.js
    │   │
    │   ├── auction-access/
    │   │   ├── access-request.model.js
    │   │   ├── access.routes.js
    │   │   ├── access.controller.js
    │   │   └── access.service.js
    │   │
    │   ├── auction-invitations/
    │   └── audit-logs/
    │
    └── routes/
        └── index.js
```

### Backend Responsibilities

- **Routes:** Map HTTP requests to controllers.
- **Controllers:** Parse requests and send responses.
- **Services:** Enforce auction and access business rules.
- **Repositories:** Perform database operations.
- **Models:** Define MongoDB schemas and indexes.
- **Middleware:** Authenticate users and enforce permissions.
- **Validation:** Validate incoming auction and access-request payloads.
- **Audit logs:** Record important administrative and permission changes.

## 13. API Endpoint Design

Base URL: `/api/v1`

### Auction CRUD

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auctions` | Create an auction |
| GET | `/auctions` | List auctions the caller is authorized to view |
| GET | `/auctions/:id` | Retrieve an authorized auction |
| PATCH | `/auctions/:id` | Update auction configuration |
| DELETE | `/auctions/:id` | Delete an eligible draft auction |
| POST | `/auctions/:id/publish` | Publish an eligible auction |
| POST | `/auctions/:id/cancel` | Cancel an eligible auction |
| POST | `/auctions/:id/archive` | Archive an eligible auction |

### Sharing and Access

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auctions/:id/access-requests` | Request access to a private auction |
| GET | `/auctions/:id/access-requests/me` | Retrieve own access-request status |
| GET | `/admin/auctions/:id/access-requests` | List requests for an authorized auction |
| PATCH | `/admin/access-requests/:requestId/approve` | Approve access |
| PATCH | `/admin/access-requests/:requestId/reject` | Reject access |
| POST | `/admin/auctions/:id/invitations` | Create an invitation, if enabled |
| POST | `/auctions/invitations/redeem` | Redeem a valid invitation |
| DELETE | `/admin/auctions/:id/participants/:userId` | Revoke a participant's access |

The backend must verify that the administrator owns or is authorized to manage the auction before approving requests or modifying access.

### Response Examples

Successful creation:

```json
{
  "success": true,
  "message": "Auction created successfully",
  "data": {
    "id": "auction-id",
    "name": "Cricket Championship",
    "sport": "CRICKET",
    "visibility": "PRIVATE",
    "status": "DRAFT"
  }
}
```

Access request:

```json
{
  "success": true,
  "message": "Access request submitted",
  "data": {
    "status": "PENDING"
  }
}
```

These responses are illustrative. Return only fields the caller is authorized to receive.

## 14. Frontend Folder Structure

```text
frontend/
└── src/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/
    │   │   └── register/
    │   │
    │   ├── admin/
    │   │   ├── dashboard/
    │   │   ├── auctions/
    │   │   │   ├── page.jsx
    │   │   │   ├── create/
    │   │   │   └── [id]/
    │   │   └── access-requests/
    │   │
    │   ├── auctions/
    │   │   ├── page.jsx
    │   │   └── [id]/
    │   │
    │   ├── my-access-requests/
    │   └── layout.jsx
    │
    ├── components/
    │   ├── auctions/
    │   │   ├── AuctionForm.jsx
    │   │   ├── AuctionCard.jsx
    │   │   ├── AuctionFilters.jsx
    │   │   ├── AuctionTable.jsx
    │   │   ├── AuctionVisibilitySelect.jsx
    │   │   └── ShareAuctionDialog.jsx
    │   │
    │   ├── access/
    │   │   ├── AccessRequestButton.jsx
    │   │   └── AccessRequestTable.jsx
    │   │
    │   └── ui/
    │
    ├── services/
    │   ├── auction.service.js
    │   └── auction-access.service.js
    │
    ├── hooks/
    ├── lib/
    └── schemas/
        └── auction.schema.js
```

## 15. Admin UI Workflow

### Admin Dashboard

Display summary cards:

- Total Auctions
- Draft Auctions
- Published Auctions
- Scheduled Auctions
- Live Auctions
- Pending Access Requests

### Auction Management Page

Include:

- Create Auction button.
- Search input.
- Sport filter.
- Visibility filter.
- Status filter.
- Date range filter.
- Sort controls.
- Paginated auction table.
- View, Edit, Share, Publish, Cancel, Archive, and Delete actions as appropriate.

### Create Auction Page

Organize the form into clear sections:

1. Basic Information
2. Schedule
3. Team and Points Configuration
4. Bidding Rules
5. Visibility and Access
6. Review and Create

Display inline validation errors and a clear summary before publication.

### Auction Details Page

Show:

- Auction image and name.
- Sport and schedule.
- Players per team.
- Points balance per team.
- Bid configuration.
- Visibility and status.
- Share controls.
- Access-request management.
- Relevant audit history.

### Access Requests Page

Display:

- User identity.
- Auction name.
- Request date.
- Current status.
- Approve and Reject actions.
- Optional decision note.

Use confirmation dialogs for destructive or permission-changing actions.

## 16. Testing Requirements

### CRUD Tests

- [ ] Authorized admin can create an auction.
- [ ] Invalid sport is rejected.
- [ ] Missing mandatory fields are rejected.
- [ ] Invalid bid ranges are rejected.
- [ ] Authorized admin can update eligible auctions.
- [ ] Unauthorized users cannot update or delete auctions.
- [ ] Published auctions follow the defined lifecycle.
- [ ] Deletion rules preserve dependent records.

### Visibility Tests

- [ ] Published public auctions appear in public listings.
- [ ] Private auctions do not leak through listing filters.
- [ ] Unauthorized users cannot retrieve private-auction details.
- [ ] Sharing a private URL does not bypass authorization.
- [ ] Revoked users lose access to protected resources.

### Access Tests

- [ ] A logged-in user can request access.
- [ ] Duplicate requests are prevented.
- [ ] Only an authorized admin can approve or reject requests.
- [ ] Approved users can access the private auction.
- [ ] Rejected users cannot access the private auction.
- [ ] Revoked users cannot continue accessing protected endpoints.
- [ ] Invitation tokens expire and cannot be reused if invitation links are enabled.

### Production Tests

- [ ] All list endpoints support pagination.
- [ ] Uploads have strict validation and size limits.
- [ ] Rate limits protect sensitive endpoints.
- [ ] Changes to auction configuration are audited.
- [ ] Race conditions and concurrent requests are tested.
- [ ] Tenant isolation is enforced if multiple client organizations use the platform.

## 17. Implementation Order

1. Create the Auction Mongoose model and indexes.
2. Build create, list, details, update, and delete APIs.
3. Add server-side validation and lifecycle rules.
4. Implement auction visibility and authorization middleware.
5. Build the Next.js Create Auction form.
6. Build the Admin Auction Management page.
7. Add search, filters, sorting, and pagination.
8. Implement the Share Auction dialog.
9. Create access-request and participant-permission models.
10. Implement access approval, rejection, and revocation.
11. Build the public auction listing and details pages.
12. Add automated authorization and security tests.
13. Test the full workflow in staging before production deployment.

## 18. Definition of Done

The Auction Management Module is ready when:

- Admins can create and manage auctions for all five supported sports.
- All required fields are validated on both frontend and backend.
- CRUD operations follow the defined lifecycle.
- Public and private visibility work correctly.
- Auction sharing does not bypass access restrictions.
- Users can request private-auction access.
- Admins can approve, reject, and revoke access.
- Filters return only authorized records.
- All protected endpoints enforce server-side authorization.
- Automated tests cover the main business and security scenarios.

**Final Architecture:**

Next.js Frontend → Node.js / Express Backend → MongoDB / Mongoose

Authentication and RBAC → Auction Management → Visibility and Sharing → Access Requests → Bidding Engine.

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
# Auction Platform — Dynamic Forms & Auction Profile Management

## 1. Project Overview

The Auction Platform allows administrators to create sports auctions and customize the information collected from teams and players.

After creating an auction, the administrator can open its details page and manage teams, players, MVP, sponsors, sharing links, and auction information.

The system must support **fully customizable forms**, allowing different auctions or teams to use different fields, payment options, validation rules, and form layouts without changing the source code.

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js |
| Backend | Node.js + Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT + Refresh Tokens |
| Authorization | Role-Based Access Control |
| Form Validation | Zod |
| UI | React + Tailwind CSS |
| Email OTP | Existing n8n webhook integration |

## 2. Main Objective

Build a reusable Dynamic Form Builder through which administrators can configure:

- Team registration forms.
- Player registration forms.
- Team-specific fields.
- Auction-specific form templates.
- Required and optional fields.
- Visible and hidden fields.
- Custom field labels and descriptions.
- Dropdowns, checkboxes, radio buttons, and file upload fields.
- Payment modes and payment-related fields.
- Field ordering and form sections.
- Validation rules.
- Form submission and approval workflows.

The admin must configure these options through the UI. Developers should not need to modify frontend or backend code every time a client requests a new field.

## 3. Auction Details Page

After creating an auction, the admin clicks **View Auction** to open the Auction Profile page.

The page should follow the reference screenshot's general layout.

### Header Section

Display:

- Auction cover image.
- Auction name.
- Auction code.
- Auction date and time.
- Sport name.
- Players per team.
- Registered player count.
- Auction status.
- Visibility status.
- Share auction button.

### Action Buttons

- Edit Auction
- Share Auction
- Auction Results Excel
- Auction Results PDF
- Live Tracking Record
- Start or Resume Live Auction, depending on status

Only authorized users should see or execute administrative actions.

### Navigation Tabs

| Tab | Purpose |
|---|---|
| Teams | Create, view, edit, and manage teams |
| Players | Manage player registrations and details |
| MVP | Configure and display MVP information |
| Sponsors | Manage auction sponsors |
| Link | Generate and manage sharing or registration links |
| About | Display auction details and rules |

Each tab must load data for the selected auction only.

Example route:

`/admin/auctions/[auctionId]`

The selected tab can be represented by a nested route or query parameter so that pages are linkable and refresh-safe.

## 4. Dynamic Form Builder

### Admin Workflow

1. Admin logs in.
2. Admin creates an auction.
3. Admin opens the Auction Details page.
4. Admin selects **Form Builder**.
5. Admin chooses a form type: Team Registration or Player Registration.
6. Admin selects the configuration scope: Auction-wide or a specific team, where applicable.
7. Admin adds, edits, removes, hides, or reorders fields.
8. Admin configures validation and visibility.
9. Admin previews the form.
10. Admin saves and publishes the form configuration.
11. The registration page renders the published form dynamically.
12. Submitted information is validated and saved by the backend.

### Form Builder Layout

The form builder should contain three areas:

**Left Panel — Available Fields**

- Short Text
- Long Text
- Number
- Email
- Phone
- Date
- Dropdown
- Radio Group
- Checkbox
- Multi-select
- File Upload
- Image Upload
- Payment Mode
- Section Heading
- Description
- Consent Checkbox

**Center Panel — Form Canvas**

- Display form fields in order.
- Support drag-and-drop reordering.
- Show field labels and required indicators.
- Preview conditional fields.
- Allow field selection and deletion.

**Right Panel — Field Settings**

- Field Label
- Field Key
- Placeholder
- Description
- Required
- Visible
- Editable
- Default Value
- Options
- Minimum and Maximum
- File Restrictions
- Conditional Visibility
- Validation Rules

The interface should provide Save Draft, Preview, Publish, and Version History actions.

## 5. Field Configuration

Each field must have a stable identifier and a configurable definition.

Example field configuration:

```json
{
  "key": "teamName",
  "label": "Team Name",
  "type": "text",
  "required": true,
  "visible": true,
  "editable": true,
  "placeholder": "Enter team name",
  "order": 1,
  "validation": {
    "minLength": 2,
    "maxLength": 80
  }
}
```

### Supported Field Types

| Type | Example |
|---|---|
| `text` | Team Name |
| `textarea` | Team Description |
| `number` | Number of Players |
| `email` | Contact Email |
| `phone` | Contact Number |
| `date` | Date of Birth |
| `select` | Payment Mode |
| `radio` | Preferred Category |
| `checkbox` | Terms Accepted |
| `multiselect` | Player Skills |
| `file` | Supporting Document |
| `image` | Profile Image |
| `section` | Contact Details |

The backend must maintain an allowlist of field types. Arbitrary JavaScript, executable expressions, HTML, or custom database queries must never be accepted as form configuration.

## 6. Team-Specific Customization

### Business Requirement

Different teams can require different information.

For example:

**Team A**

- Team Name: Required
- Captain Name: Required
- Contact Number: Required
- Payment Upload: Disabled
- Payment Mode: Disabled

**Team B**

- Team Name: Required
- Captain Name: Required
- Contact Number: Required
- Payment Upload: Enabled
- Payment Mode: Enabled

Both teams use the same application, but the fields rendered by the registration form depend on the applicable configuration.

### Recommended Configuration Strategy

Use three configuration levels:

1. **Platform Defaults:** Common field definitions and supported controls.
2. **Auction Form Template:** Default fields and validation for an auction's team or player registration.
3. **Team Override:** Optional changes for a particular team.

The effective form is resolved by combining the auction template and permitted team overrides.

Use explicit override properties so that `false` is distinguishable from a missing setting.

Example:

```json
{
  "auctionId": "AUCTION_ID",
  "formType": "TEAM_REGISTRATION",
  "teamId": "TEAM_B_ID",
  "overrides": {
    "paymentMode": {
      "visible": true,
      "required": true
    },
    "paymentUpload": {
      "visible": true,
      "required": false
    }
  }
}
```

For Team A, the corresponding overrides can disable those fields.

If no team-specific override exists, use the published auction-level configuration.

### Important Rule

A hidden field must not be treated as trusted or authorized merely because it is absent from the UI.

The backend must validate submitted values against the effective configuration. It must also prevent clients from modifying protected fields such as auction ownership, approval status, payment verification, or role assignments.

## 7. Payment Field Customization

Payment-related controls must be independently configurable.

### Payment Mode

Possible options include:

- UPI
- Bank Transfer
- Cash
- Other configured payment methods

These options are examples and must be configurable by an authorized administrator.

### Payment Upload

This field allows a user to submit a payment receipt or supporting document when required.

The administrator can configure:

- Visible or hidden.
- Required or optional.
- Accepted file types.
- Maximum file size.
- Applicable registration stage.
- Whether an uploaded receipt requires review.

### Example

| Configuration | Team A | Team B |
|---|---|---|
| Payment Mode | Disabled | Enabled |
| Payment Upload | Disabled | Enabled |
| Payment Receipt Required | No | Configurable |
| Admin Review | Not applicable | Configurable |

Payment mode, receipt upload, payment status, and actual payment processing are separate concepts. Enabling a payment field does not automatically mean that a payment has been collected or verified.

Never allow the form submission to set `paymentStatus: "PAID"` directly.

## 8. Player Registration Form

The player form follows the same Dynamic Form Builder architecture.

### Example Default Fields

- Player Name
- Profile Image
- Email
- Contact Number
- Date of Birth
- Playing Role
- Experience
- Base Price or Minimum Bid, where applicable
- Supporting Documents, where applicable

These are suggested defaults. The administrator can configure which fields are visible and required for each auction.

### Sport-Specific Fields

The form builder may support sport-specific templates:

- Cricket: Batting Style, Bowling Style, Player Role.
- Volleyball: Playing Position, Player Role.
- Football: Position, Preferred Foot.
- Kabaddi: Playing Position, Playing Category.
- Badminton: Singles or Doubles Category.

Sport-specific fields should be optional template presets, not hard-coded requirements for every auction.

### Player Form Rules

- A player must belong to the correct auction.
- Team assignment must be authorized and validated.
- Duplicate registrations must follow the auction's configured policy.
- The backend validates all required fields.
- Custom fields are stored separately from system-managed properties.
- Changes to form templates must not silently invalidate previously submitted registrations.

## 9. MongoDB Data Models

Use separate collections for auctions, teams, players, form templates, and submissions.

### Form Template

Collection: `formTemplates`

```javascript
{
  _id: ObjectId,
  auctionId: ObjectId,
  formType: "TEAM_REGISTRATION",
  name: "Team Registration Form",
  version: 1,
  status: "PUBLISHED",

  fields: [
    {
      key: "teamName",
      label: "Team Name",
      type: "text",
      required: true,
      visible: true,
      editable: true,
      order: 1
    }
  ],

  createdBy: ObjectId,
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Team Form Configuration

Collection: `teamFormConfigurations`

```javascript
{
  _id: ObjectId,
  auctionId: ObjectId,
  teamId: ObjectId,
  formTemplateId: ObjectId,

  overrides: {
    paymentMode: {
      visible: true,
      required: true
    },
    paymentUpload: {
      visible: true,
      required: false
    }
  },

  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Form Submission

Collection: `formSubmissions`

```javascript
{
  _id: ObjectId,
  auctionId: ObjectId,
  formTemplateId: ObjectId,
  formVersion: 1,
  formType: "TEAM_REGISTRATION",
  teamId: ObjectId,

  submittedBy: ObjectId,

  data: {
    teamName: "Panthers",
    captainName: "Example Captain"
  },

  status: "PENDING",
  submittedAt: Date,
  updatedAt: Date
}
```

The examples above illustrate the data structure; implement actual Mongoose schemas, validators, and indexes.

### Data Model Rules

- Use stable field keys instead of labels as property names.
- Keep system-managed properties separate from custom form data.
- Validate the `auctionId`, `teamId`, and template relationships.
- Use versioned form templates.
- Preserve the form version used for each submission.
- Enforce authorization before reading or updating submissions.
- Add indexes for common auction, team, status, and submission queries.
- Define retention and archival rules for submitted documents.

## 10. Backend Folder Structure

```text
backend/
└── src/
    ├── modules/
    │   ├── auctions/
    │   │   ├── auction.model.js
    │   │   ├── auction.routes.js
    │   │   ├── auction.controller.js
    │   │   └── auction.service.js
    │   │
    │   ├── teams/
    │   │   ├── team.model.js
    │   │   ├── team.routes.js
    │   │   ├── team.controller.js
    │   │   └── team.service.js
    │   │
    │   ├── players/
    │   │   ├── player.model.js
    │   │   ├── player.routes.js
    │   │   ├── player.controller.js
    │   │   └── player.service.js
    │   │
    │   ├── form-builder/
    │   │   ├── form-template.model.js
    │   │   ├── form-template.routes.js
    │   │   ├── form-template.controller.js
    │   │   ├── form-template.service.js
    │   │   ├── form-validation.service.js
    │   │   └── form-resolution.service.js
    │   │
    │   ├── team-form-configurations/
    │   │   ├── team-form-config.model.js
    │   │   └── team-form-config.service.js
    │   │
    │   └── form-submissions/
    │       ├── submission.model.js
    │       ├── submission.routes.js
    │       ├── submission.controller.js
    │       └── submission.service.js
    │
    ├── middleware/
    │   ├── authenticate.js
    │   ├── authorize.js
    │   └── validateRequest.js
    │
    └── config/
        └── database.js
```

### Service Responsibilities

- `form-template.service.js`: Creates and manages form templates.
- `form-resolution.service.js`: Resolves auction defaults and team-specific overrides.
- `form-validation.service.js`: Validates submissions against the effective published schema.
- `team-form-config.service.js`: Manages authorized team-level overrides.
- `submission.service.js`: Saves validated submissions and their template version.
- `authorize.js`: Enforces user permissions for every protected action.

## 11. API Endpoint Design

Base URL: `/api/v1`

### Auction Details

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/auctions/:auctionId` | Retrieve auction details |
| PATCH | `/auctions/:auctionId` | Update permitted auction fields |
| GET | `/auctions/:auctionId/teams` | List auction teams |
| GET | `/auctions/:auctionId/players` | List auction players |

### Form Builder

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auctions/:auctionId/forms` | Create a form template |
| GET | `/auctions/:auctionId/forms` | List form templates |
| GET | `/auctions/:auctionId/forms/:formId` | Retrieve a form template |
| PATCH | `/auctions/:auctionId/forms/:formId` | Update a draft template |
| POST | `/auctions/:auctionId/forms/:formId/publish` | Publish a template version |
| POST | `/auctions/:auctionId/forms/:formId/clone` | Clone a template |
| GET | `/auctions/:auctionId/forms/:formId/preview` | Preview a form |

### Team-Specific Forms

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/auctions/:auctionId/teams/:teamId/form-config` | Retrieve effective configuration |
| PUT | `/auctions/:auctionId/teams/:teamId/form-config` | Save team overrides |
| GET | `/auctions/:auctionId/teams/:teamId/registration-form` | Retrieve the registration form |

### Form Submissions

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auctions/:auctionId/forms/:formId/submissions` | Submit a form |
| GET | `/auctions/:auctionId/submissions` | List authorized submissions |
| GET | `/auctions/:auctionId/submissions/:submissionId` | Retrieve a submission |
| PATCH | `/auctions/:auctionId/submissions/:submissionId/status` | Update submission status |

The API must verify the auction, template, and team relationship for every request. Only authorized administrators can publish templates or change team-specific configurations.

## 12. Frontend Folder Structure

```text
frontend/
└── src/
    ├── app/
    │   └── admin/
    │       └── auctions/
    │           └── [auctionId]/
    │               ├── page.jsx
    │               ├── teams/
    │               ├── players/
    │               ├── mvp/
    │               ├── sponsors/
    │               ├── link/
    │               ├── about/
    │               └── form-builder/
    │                   └── page.jsx
    │
    ├── components/
    │   ├── auction-profile/
    │   │   ├── AuctionHeader.jsx
    │   │   ├── AuctionTabs.jsx
    │   │   └── AuctionActions.jsx
    │   │
    │   ├── form-builder/
    │   │   ├── FormBuilder.jsx
    │   │   ├── FieldPalette.jsx
    │   │   ├── FormCanvas.jsx
    │   │   ├── FieldSettings.jsx
    │   │   ├── FormPreview.jsx
    │   │   ├── ConditionalRulesEditor.jsx
    │   │   └── FormVersionHistory.jsx
    │   │
    │   ├── teams/
    │   └── players/
    │
    ├── services/
    │   ├── auction.service.js
    │   ├── form-builder.service.js
    │   ├── team.service.js
    │   └── player.service.js
    │
    ├── schemas/
    └── lib/
```

## 13. Form Versioning and Publishing

A published form can already have registrations. Therefore, changing its fields requires a controlled versioning strategy.

Recommended workflow:

1. Admin edits a draft configuration.
2. System validates the configuration.
3. Admin previews the form.
4. Admin publishes a new version.
5. New registrations use the published version.
6. Existing submissions retain the version they used.
7. The system prevents incompatible changes from silently corrupting existing data.

For example, changing a field label should not change its stable key. Removing a field with existing submitted data should require an explicit migration or archival policy.

Do not overwrite historical submission definitions when publishing a new version.

## 14. Conditional Field Rules

The form builder can optionally support conditional fields.

Example:

- If `paymentMode = UPI`, display the UPI reference field.
- If `paymentMode = BANK_TRANSFER`, display the bank reference field.
- If `paymentRequired = false`, hide payment-related fields.
- If a player selects a particular category, display applicable additional questions.

Conditions should be represented using a restricted, declarative JSON format with allowlisted operators. Do not execute arbitrary JavaScript supplied by an administrator.

Every conditional requirement must be evaluated and validated on the backend as well as reflected in the frontend.

## 15. Security Requirements

- Only authenticated, authorized administrators can modify form templates.
- A team administrator can modify only teams within their permitted scope.
- Validate all field definitions on the backend.
- Reject unsupported field types and invalid conditions.
- Prevent unauthorized changes to system-managed fields.
- Apply upload size and content validation.
- Enforce rate limits on form submission endpoints.
- Protect against cross-tenant access where multiple organizations use the platform.
- Record template publishing, configuration changes, and approval decisions in audit logs.
- Never trust client-submitted role, ownership, approval, or payment status.
- Ensure private auction data is returned only to authorized users.

## 16. Testing Checklist

### Dynamic Form Builder

- [ ] Admin can create a form template.
- [ ] Admin can add, edit, remove, and reorder fields.
- [ ] Admin can mark fields required or optional.
- [ ] Admin can enable or disable payment-related fields.
- [ ] Admin can configure field options and validation.
- [ ] Admin can preview and publish a template.
- [ ] Invalid field definitions are rejected.

### Team Customization

- [ ] Team A can use a configuration without payment fields.
- [ ] Team B can enable payment mode and receipt upload.
- [ ] Team overrides do not alter unrelated teams.
- [ ] Auction defaults apply when no override exists.
- [ ] Unauthorized users cannot modify another team's configuration.

### Submissions

- [ ] Required fields are validated on the backend.
- [ ] Hidden or disabled fields cannot bypass business rules.
- [ ] Submissions retain their template version.
- [ ] Unauthorized users cannot read another team's private information.
- [ ] Duplicate registration rules are enforced.
- [ ] Changes to published templates do not corrupt historical submissions.

### Auction Profile

- [ ] Auction header displays the correct information.
- [ ] Tabs load data for the selected auction.
- [ ] Admin actions respect auction status and permissions.
- [ ] Refreshing a tab preserves the selected page.
- [ ] Users cannot access private auction information without authorization.

## 17. Implementation Order

1. Build the Auction Details page and tab navigation.
2. Implement Team and Player data models.
3. Build the default Team Registration form.
4. Build the default Player Registration form.
5. Implement the Dynamic Form Builder UI.
6. Implement form template CRUD APIs.
7. Add field validation and template publishing.
8. Implement auction-level form configuration.
9. Implement team-specific overrides.
10. Build the dynamic Team Registration page.
11. Build the dynamic Player Registration page.
12. Add conditional fields and payment configuration.
13. Implement submission history and status management.
14. Add form versioning and audit logs.
15. Test authorization, data isolation, and form submissions.

## 18. Definition of Done

The module is complete when:

- Admin can open the auction profile after creating an auction.
- Teams, Players, MVP, Sponsors, Link, and About tabs are available.
- Admin can create and customize team and player forms.
- Fields can be added, removed, hidden, required, and reordered.
- Different teams can use different field configurations.
- Payment mode and payment upload can be enabled or disabled independently.
- Form submissions are validated by the backend.
- Published templates are versioned.
- Historical submissions remain consistent.
- All changes follow authentication, authorization, and audit requirements.

**Final Architecture:**

Next.js Auction Profile → Dynamic Form Builder → Node.js / Express API → MongoDB / Mongoose → Versioned Form Templates → Team-Specific Configuration → Validated Form Submissions.

----------------------------------------------------------------------------------------------------------------------------------------------------


# Auction Platform — Production-Level Dynamic Form Builder

**Frontend:** Next.js  
**Backend:** Node.js + Express.js  
**Database:** MongoDB + Mongoose  
**Validation:** Zod + Server-Side Validation  
**UI:** React + Tailwind CSS  
**Authentication:** JWT + Role-Based Access Control (RBAC)

---

## 1. Project Overview

The Dynamic Form Builder allows administrators to design customized Team Registration and Player Registration forms for individual auctions.

Administrators can add fields, configure data types, define validation rules, customize image uploads, preview forms, and publish configurations without changing the application source code.

The system must ensure that every published form follows its configured validation rules on both the frontend and backend.

### Main Objectives

- Create fully customizable forms.
- Configure field types and validation rules.
- Prevent invalid data from being submitted.
- Support image uploads with preview, zoom, and replacement.
- Configure required, optional, visible, and hidden fields.
- Support auction-level and team-specific form configurations.
- Publish forms and apply the published version automatically.
- Preserve historical submissions and previously published versions.
- Enforce authorization and data isolation.

## 2. Form Builder Workflow

The administrator follows this workflow:

1. Log in to the Admin Panel.
2. Open an existing auction.
3. Navigate to Teams or Players.
4. Select **Customize Form**.
5. Choose the form type.
6. Add fields using the Field Builder.
7. Configure each field's data type.
8. Configure validation rules.
9. Configure image upload and preview options.
10. Arrange fields and form sections.
11. Preview the form as an end user.
12. Save the form as a draft.
13. Click **Publish Form**.
14. Backend validates and publishes a new form version.
15. The published configuration becomes active for the selected auction or team.
16. New form submissions use the active published version.

### Form Builder Interface

The interface should contain three main panels.

**Left Panel — Field Library**

- Text
- Textarea
- Number
- Phone
- Email
- Date
- Dropdown
- Radio Group
- Checkbox
- Multi-select
- Image Upload
- File Upload
- Section Heading
- Description

**Center Panel — Form Canvas**

- Render fields in their configured order.
- Support drag-and-drop reordering.
- Display required indicators.
- Show field-level validation hints.
- Preview the final registration form.
- Allow field duplication and deletion.

**Right Panel — Field Configuration**

- Field Label
- Field Key
- Field Type
- Placeholder
- Required
- Visible
- Editable
- Minimum and Maximum Length
- Minimum and Maximum Value
- Allowed Characters
- Regex Validation
- Allowed File Types
- Maximum File Size
- Image Zoom and Crop Settings
- Custom Error Message

---

## 3. Field Types and Validation Rules

Every field must have a defined data type and a corresponding set of allowed validation rules.

| Field | Data Type | Validation |
|---|---|---|
| Name | String | Letters and permitted name characters only |
| Phone | Digit-only string | Exactly 10 digits, if Indian mobile format is required |
| Email | String | Valid email format |
| Age | Integer | Configurable minimum and maximum |
| Points Balance | Number | Positive value within configured limits |
| Date | Date | Valid date and configured date range |
| Team Name | String | Configurable length and character rules |
| Profile Image | File | Allowed image formats and file-size limits |
| Payment Mode | Enum | Only configured options |
| Description | String | Configurable minimum and maximum length |

The administrator must not be able to assign incompatible validation rules to a field type.

For example, a text field should not accept a numeric minimum-value rule unless the field type explicitly supports it.

## 4. Name Field — String Validation

### Requirement

The Name field must accept text rather than arbitrary numbers.

Example configuration:

```json
{
  "key": "playerName",
  "label": "Player Name",
  "type": "text",
  "required": true,
  "validation": {
    "minLength": 2,
    "maxLength": 80,
    "allowedCharacters": "PERSON_NAME"
  },
  "messages": {
    "required": "Player name is required",
    "invalid": "Enter a valid name using letters only"
  }
}
```

### Valid Examples

- Jayaveer
- Ravi Kumar
- A. Kumar
- Anne-Marie
- O'Connor

### Invalid Examples

- `Jay123`
- `12345`
- `Ravi@123`

The permitted character policy should support legitimate international names, including accented letters and appropriate punctuation.

### Frontend Rules

- Display a text input.
- Validate the value as the user types or leaves the field.
- Display an inline error for invalid characters.
- Prevent submission while the value is invalid.
- Trim unnecessary leading and trailing whitespace.

### Backend Rules

The backend must independently validate the field using the published form schema.

Do not rely on `type="text"`, keyboard restrictions, or frontend regex alone. A malicious client can submit arbitrary JSON directly to the API.

---

## 5. Phone Field — Digit-Only Validation

### Requirement

If the form is configured for Indian 10-digit mobile numbers, the value must contain exactly 10 digits.

Example configuration:

```json
{
  "key": "phone",
  "label": "Phone Number",
  "type": "phone",
  "required": true,
  "validation": {
    "countryCode": "IN",
    "digitsOnly": true,
    "minLength": 10,
    "maxLength": 10,
    "pattern": "^[0-9]{10}$"
  },
  "messages": {
    "required": "Phone number is required",
    "invalid": "Enter a valid 10-digit mobile number"
  }
}
```

### Valid Example

`9876543210`

### Invalid Examples

- `987654321` — Too short.
- `98765432101` — Too long.
- `98765ABCDE` — Contains letters.
- `98765 43210` — Contains spaces.
- `98765-43210` — Contains a separator.

The exact format must follow the configured country and validation policy.

### Important Database Decision

**Phone numbers should normally be stored as strings, not integers.**

Even when only digits are allowed, a phone number is an identifier rather than a quantity. Numeric storage can remove leading zeros and does not support country prefixes consistently.

Use a string representation such as:

```javascript
phone: "9876543210"
```

The frontend can use an appropriate telephone input with digit filtering. The backend should reject non-digit characters and enforce the configured length.

Do not use `type="number"` for phone numbers.

---

## 6. Dynamic Validation Rules Engine

The administrator should configure validation rules through a UI rather than writing code.

### Supported Rules

**String Fields**

- Required / Optional
- Minimum Length
- Maximum Length
- Allowed Characters
- Pattern Validation
- Trim Whitespace

**Numeric Fields**

- Minimum Value
- Maximum Value
- Integer Only
- Positive Value
- Decimal Precision

**Phone Fields**

- Digit-Only
- Exact Length
- Country-Specific Format
- Optional Country Code

**Email Fields**

- Valid Email Format
- Required / Optional
- Maximum Length

**Date Fields**

- Minimum Date
- Maximum Date
- Past Dates Only
- Future Dates Only

**Image Fields**

- Required / Optional
- Allowed Image Formats
- Maximum File Size
- Minimum Dimensions
- Maximum Dimensions
- Aspect Ratio
- Crop Required

### Validation Configuration Example

```json
{
  "key": "age",
  "label": "Player Age",
  "type": "number",
  "required": true,
  "validation": {
    "integerOnly": true,
    "min": 16,
    "max": 60
  }
}
```

The UI should only display rules compatible with the selected field type.

The backend must validate the configuration before publishing it and validate every submission against the published rules.

Never evaluate arbitrary JavaScript or execute user-supplied validation code. Use an allowlisted set of validation rules and a controlled schema-generation engine.

---

## 7. Image Upload, Preview, Zoom, and Crop

The Image Upload field must support a professional upload experience.

### Image Field Settings

The administrator can configure:

- Field Label
- Required / Optional
- Allowed Formats
- Maximum File Size
- Minimum Width and Height
- Maximum Width and Height
- Aspect Ratio
- Crop Required
- Preview Enabled
- Zoom Enabled
- Image Replacement Allowed

Example configuration:

```json
{
  "key": "playerImage",
  "label": "Player Profile Image",
  "type": "image",
  "required": true,
  "imageSettings": {
    "allowedFormats": ["image/jpeg", "image/png", "image/webp"],
    "maxFileSizeMB": 5,
    "minWidth": 300,
    "minHeight": 300,
    "aspectRatio": "1:1",
    "previewEnabled": true,
    "zoomEnabled": true,
    "cropEnabled": true
  }
}
```

These values are examples. The administrator can configure supported settings within platform-defined security limits.

### User Upload Workflow

1. User opens the registration form.
2. User selects an image or drops a file into the upload area.
3. Frontend checks the file size and basic image properties.
4. The image preview appears.
5. User clicks the preview to open a larger image.
6. User zooms in or out.
7. User adjusts the crop if cropping is enabled.
8. User confirms the image.
9. User can replace or remove the image before submission, subject to field rules.
10. Backend validates the uploaded file and saves the submission only after successful validation.

### Zoom Behavior

The preview dialog should provide:

- Zoom In
- Zoom Out
- Reset Zoom
- Fit to Screen
- Close
- Optional Crop and Rotate controls

Zooming should affect the preview, not silently modify the original image. If cropping is enabled, the user must confirm the crop before the final image is submitted.

### Image Security

- Validate the actual file content, not only the filename or MIME type.
- Enforce server-side file-size limits.
- Reject unsupported and malformed files.
- Use generated storage keys rather than trusting user-supplied filenames.
- Restrict upload endpoints to authorized operations.
- Re-encode uploaded images where practical.
- Prevent unauthorized access to private uploaded files.
- Remove abandoned temporary uploads according to a cleanup policy.

Image storage should use the backend's existing configured upload infrastructure. Do not introduce a duplicate storage configuration unnecessarily.

---

## 8. Draft, Preview, Publish, and Apply

Publishing must be an explicit workflow with server-side validation.

### Save Draft

- Save changes without affecting the active registration form.
- Allow the administrator to return later.
- Permit incomplete configuration while in draft status.
- Do not expose drafts to public registration pages.

### Preview Form

- Render the form using the current draft configuration.
- Test field types and validation.
- Preview image upload and zoom behavior.
- Display conditional fields according to the current draft rules.
- Do not create a published version or change the live form.

### Publish Form

When the administrator clicks **Publish Form**:

1. Backend authenticates the administrator.
2. Backend checks permission to manage the selected auction or team.
3. Backend validates the complete form definition.
4. Backend verifies field types, keys, options, and validation-rule compatibility.
5. Backend verifies that required fields have valid configurations.
6. Backend creates a new immutable published version.
7. Backend atomically updates the active version reference.
8. New registration requests use the newly published version.
9. Existing submissions retain their original version.
10. Frontend displays a successful publication status only after the backend confirms the change.

If publication fails, the previously published form must remain active.

### Apply Scope

The administrator must explicitly select where the form applies:

- Auction-wide Team Registration
- Auction-wide Player Registration
- A specific team's registration form, if team-specific forms are supported

Publishing a Team Registration form must not accidentally replace the Player Registration form.

### Publish Confirmation

Before publishing, show a summary containing:

- Auction Name
- Form Type
- Applicable Team, if any
- Number of Fields
- Required Fields
- Validation Summary
- Current Published Version
- New Version Number

The administrator confirms the publication before the new version becomes active.

---

## 9. Form Versioning

Each published form must have a version number.

Example:

- Version 1 — Initial Registration Form
- Version 2 — Added Player Role
- Version 3 — Updated Phone Validation

Store the version ID with each submission.

Recommended rules:

- Published versions are immutable.
- Editing a published form creates a draft based on the active version.
- Publishing the draft creates a new version.
- Historical submissions retain their original schema version.
- The system must not silently rewrite previously submitted values when a new form is published.
- Rollback must be an explicit administrative operation that republishes a prior definition as a new active version.

If the active version changes while a user is filling out a form, the backend should validate against the current version. It can reject the outdated submission with a clear message or support an explicit, controlled version-pinning policy.

---

## 10. MongoDB Data Model

### Form Template

Collection: `formTemplates`

```javascript
{
  _id: ObjectId,
  auctionId: ObjectId,
  formType: "PLAYER_REGISTRATION",
  scope: "AUCTION",
  teamId: null,

  draftSchema: {
    fields: []
  },

  activeVersionId: ObjectId,

  createdBy: ObjectId,
  updatedAt: Date,
  createdAt: Date
}
```

### Published Form Version

Collection: `formVersions`

```javascript
{
  _id: ObjectId,
  formTemplateId: ObjectId,
  version: 1,
  status: "PUBLISHED",

  fields: [
    {
      key: "playerName",
      label: "Player Name",
      type: "text",
      required: true,
      visible: true,
      validation: {
        minLength: 2,
        maxLength: 80
      }
    }
  ],

  publishedBy: ObjectId,
  publishedAt: Date,
  createdAt: Date
}
```

### Form Submission

Collection: `formSubmissions`

```javascript
{
  _id: ObjectId,
  auctionId: ObjectId,
  formTemplateId: ObjectId,
  formVersionId: ObjectId,
  formVersion: 1,

  formType: "PLAYER_REGISTRATION",
  teamId: ObjectId,
  submittedBy: ObjectId,

  data: {
    playerName: "Ravi Kumar",
    phone: "9876543210"
  },

  status: "PENDING",
  submittedAt: Date,
  updatedAt: Date
}
```

These are conceptual schemas. Implement Mongoose validation, appropriate indexes, access controls, and immutable-version enforcement.

### Data Integrity

- Field keys must be unique within a form version.
- Reserved system-property names must not be accepted as custom keys.
- Submitted data must match the published schema.
- The form, auction, team, and user relationships must be verified.
- Custom fields must not overwrite system-managed fields.
- Image metadata must be validated and stored separately from ordinary text fields.

---

## 11. Backend Architecture

```text
backend/
└── src/
    ├── modules/
    │   ├── form-builder/
    │   │   ├── form-template.model.js
    │   │   ├── form-version.model.js
    │   │   ├── form.routes.js
    │   │   ├── form.controller.js
    │   │   ├── form.service.js
    │   │   ├── form-validation.service.js
    │   │   ├── form-publishing.service.js
    │   │   └── form-resolution.service.js
    │   │
    │   ├── form-submissions/
    │   │   ├── submission.model.js
    │   │   ├── submission.routes.js
    │   │   ├── submission.controller.js
    │   │   └── submission.service.js
    │   │
    │   ├── auctions/
    │   ├── teams/
    │   └── players/
    │
    ├── middleware/
    │   ├── authenticate.js
    │   ├── authorize.js
    │   ├── validateRequest.js
    │   └── errorHandler.js
    │
    └── config/
        └── database.js
```

### Responsibilities

- `form.service.js`: Manage form definitions and draft updates.
- `form-validation.service.js`: Validate definitions and submitted values.
- `form-publishing.service.js`: Validate, version, and activate published forms.
- `form-resolution.service.js`: Resolve the applicable auction and team configuration.
- `submission.service.js`: Validate and save form submissions.
- `authorize.js`: Enforce administrator and user permissions.

The backend should use a transaction where supported to coordinate publishing records and active-version changes. If transactions are used, MongoDB must run in a compatible replica-set configuration. Otherwise, design an atomic publication strategy that keeps the previously active version valid if any operation fails.

---

## 12. Frontend Architecture

```text
frontend/
└── src/
    ├── app/
    │   └── admin/
    │       └── auctions/
    │           └── [auctionId]/
    │               └── form-builder/
    │                   └── page.jsx
    │
    ├── components/
    │   ├── form-builder/
    │   │   ├── FormBuilder.jsx
    │   │   ├── FieldPalette.jsx
    │   │   ├── FormCanvas.jsx
    │   │   ├── FieldSettings.jsx
    │   │   ├── ValidationRulesEditor.jsx
    │   │   ├── ImageFieldSettings.jsx
    │   │   ├── ImagePreviewDialog.jsx
    │   │   ├── FormPreview.jsx
    │   │   ├── PublishConfirmationDialog.jsx
    │   │   └── FormVersionHistory.jsx
    │   │
    │   └── dynamic-forms/
    │       ├── DynamicFormRenderer.jsx
    │       ├── DynamicField.jsx
    │       ├── ImageUploadField.jsx
    │       └── FieldError.jsx
    │
    ├── services/
    │   ├── form-builder.service.js
    │   └── form-submission.service.js
    │
    └── schemas/
        └── form-builder.schema.js
```

### Frontend Responsibilities

- `FormBuilder.jsx`: Manage the draft form configuration.
- `ValidationRulesEditor.jsx`: Configure allowed rules for each field type.
- `ImagePreviewDialog.jsx`: Display image zoom and crop controls.
- `DynamicFormRenderer.jsx`: Render fields from the published schema.
- `DynamicField.jsx`: Render the correct input for each supported field type.
- `FieldError.jsx`: Display validation messages.
- `PublishConfirmationDialog.jsx`: Confirm the target scope and version before publishing.

The dynamic form renderer must use an allowlist of supported components. It must never interpret arbitrary form configuration as executable code.

---

## 13. API Endpoint Design

Base URL: `/api/v1`

### Form Builder APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auctions/:auctionId/forms` | Create a draft form |
| GET | `/auctions/:auctionId/forms` | List form configurations |
| GET | `/forms/:formId` | Retrieve a form definition |
| PATCH | `/forms/:formId/draft` | Update a draft |
| POST | `/forms/:formId/preview` | Validate and preview a draft |
| POST | `/forms/:formId/publish` | Publish a new version |
| GET | `/forms/:formId/versions` | List published versions |
| POST | `/forms/:formId/rollback/:versionId` | Republish a prior definition as a new version |
| GET | `/auctions/:auctionId/registration-form` | Retrieve the active applicable form |

### Submission APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auctions/:auctionId/forms/:formId/submissions` | Submit a form |
| GET | `/auctions/:auctionId/submissions` | List authorized submissions |
| GET | `/submissions/:submissionId` | Retrieve an authorized submission |

Every endpoint must verify authentication, resource ownership, form scope, and the appropriate permissions.

For submission endpoints, resolve the active published schema on the backend. Do not accept a client-supplied schema as the source of validation rules.

---

## 14. Error Handling

Use a consistent response format.

### Validation Failure

```json
{
  "success": false,
  "message": "Please correct the highlighted fields",
  "code": "FORM_VALIDATION_FAILED",
  "errors": [
    {
      "field": "playerName",
      "message": "Enter a valid name"
    },
    {
      "field": "phone",
      "message": "Enter a valid 10-digit mobile number"
    }
  ]
}
```

### Publish Failure

```json
{
  "success": false,
  "message": "The form contains invalid field configurations",
  "code": "FORM_PUBLISH_VALIDATION_FAILED"
}
```

The frontend should display field-level errors and preserve the administrator's draft when publication fails.

Never expose stack traces, internal database errors, secret values, or sensitive uploaded file paths.

---

## 15. Security Requirements

- Validate every form definition on the backend.
- Validate every submitted field against the active published schema.
- Reject unknown field types and unsupported rules.
- Enforce authorization on draft editing and publication.
- Prevent unauthorized cross-auction or cross-team access.
- Use server-side file validation.
- Restrict upload size and accepted formats.
- Prevent mass assignment of system-managed properties.
- Apply request-size limits and rate limiting.
- Audit form publication and configuration changes.
- Protect uploaded private files with appropriate access controls.
- Preserve historical form versions and submission data.
- Use HTTPS in production.

Frontend validation improves usability; backend validation enforces the actual rules.

---

## 16. Testing Checklist

### Validation Rules

- [ ] Name accepts permitted letters and punctuation.
- [ ] Name rejects numeric-only and invalid-character values.
- [ ] Phone accepts exactly the configured number of digits.
- [ ] Phone rejects letters, spaces, and separators under strict digit-only rules.
- [ ] Email format is validated.
- [ ] Required fields cannot be omitted.
- [ ] Numeric minimum and maximum rules work.
- [ ] Unsupported validation rules are rejected.

### Image Upload

- [ ] Valid image formats are accepted.
- [ ] Unsupported file types are rejected.
- [ ] Oversized files are rejected.
- [ ] Image preview works.
- [ ] Zoom in, zoom out, reset, and close work.
- [ ] Crop works when enabled.
- [ ] Required image fields cannot be omitted.
- [ ] Invalid image data is rejected by the backend.

### Publishing

- [ ] Drafts do not affect active forms.
- [ ] Invalid forms cannot be published.
- [ ] Successful publishing creates a new version.
- [ ] The selected registration page immediately resolves the new active version.
- [ ] Team-specific publishing does not alter unrelated teams.
- [ ] Existing submissions retain their original form version.
- [ ] Failed publishing leaves the previously active version unchanged.
- [ ] Concurrent publish requests do not produce inconsistent active versions.

### Security

- [ ] Unauthorized users cannot modify templates.
- [ ] Unauthorized users cannot submit data to another auction.
- [ ] Hidden fields cannot bypass backend validation.
- [ ] Client-supplied system properties are rejected.
- [ ] Upload endpoints enforce permissions and file restrictions.

---

## 17. Implementation Order

1. Create the form-template and published-version models.
2. Implement the supported field-type registry.
3. Build the Field Library and Form Canvas.
4. Implement field settings and validation-rule configuration.
5. Build frontend and backend validation.
6. Implement image upload, preview, zoom, and crop.
7. Build draft saving and preview functionality.
8. Implement form publishing and version creation.
9. Connect published schemas to registration pages.
10. Implement auction-level and team-specific configuration resolution.
11. Implement version-aware form submissions.
12. Add audit logging and authorization checks.
13. Write automated validation, upload, and publishing tests.
14. Test the complete workflow in staging before production deployment.

## 18. Definition of Done

The module is production-ready when:

- Admin can build customized forms without writing code.
- Every field supports compatible validation rules.
- Name, phone, email, numeric, date, and image validations work correctly.
- Image upload, preview, zoom, and crop work according to configuration.
- Drafts remain separate from published forms.
- Publishing activates the correct version for the selected scope.
- The backend validates submissions against the active published schema.
- Historical submissions preserve their original schema version.
- Unauthorized users cannot change form definitions or access protected submissions.
- Automated tests cover critical validation, publication, and security scenarios.

**Final Architecture:**

Next.js Form Builder → Versioned Form Schema → Node.js / Express Validation Engine → MongoDB → Published Form Resolver → Dynamic Registration Form → Validated Submission.

