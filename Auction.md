# Auction Platform — Live Auction Control Center & Customization

**Frontend:** Next.js  
**Backend:** Node.js + Express.js  
**Database:** MongoDB + Mongoose  
**Authentication:** JWT + RBAC  
**Real-Time Updates:** Socket.IO  
**Data Validation:** Zod + Mongoose  
**Exports:** Excel and PDF generation

---

## 1. Project Overview

The Live Auction Control Center allows authorized administrators to conduct sports auctions using either Normal Mode or Live Mode.

The system must dynamically reflect the auction's configuration, including:

- Minimum and maximum bids.
- Bid increment.
- Points balance per team.
- Players per team.
- Mandatory or flexible team roster rules.
- Player information fields.
- Team registration fields.
- Auction visibility and permissions.
- Customized Excel and PDF reports.
- Player image and details layout.

The platform must support five sports:

1. Cricket
2. Volleyball
3. Football
4. Kabaddi
5. Badminton

The same auction engine should work across all five sports. Sport-specific player fields and registration rules must come from the published form configuration.

## 2. Start Auction — Mode Selection

When the administrator clicks **Start Auction**, the system must display a confirmation dialog.

### Mode Selection Dialog

**Select Auction Mode**

- Normal Mode
- Live Mode

Buttons:

- Cancel
- Confirm

The administrator selects a mode and clicks Confirm. The backend validates the auction's current status and configuration before starting the auction session.

### Normal Mode

Normal Mode is intended for an administrator conducting an auction through the standard control interface.

Features:

- Manual or random player selection.
- Bid Up and Bid Down controls.
- Sold and Unsold actions.
- Team selection.
- Player availability tracking.
- Team budget and roster tracking.
- Auction activity history.
- Excel and PDF exports.

### Live Mode

Live Mode is intended for a live event where auction information must be synchronized across authorized connected screens.

Features:

- Real-time player and bid updates.
- Live team budget updates.
- Live player status updates.
- Real-time auction statistics.
- Connected viewer updates.
- Synchronized auction controls.
- Reconnection and session recovery.

Both modes must use the same backend bidding engine and validation rules. Live Mode changes the interaction and synchronization experience, not the security or financial rules.

The chosen mode should be saved in the auction session and restored when the session is resumed.

## 3. Live Auction Workspace

After mode confirmation, display the auction workspace based on the provided reference image.

### A. Top Header

Display:

- Back Navigation.
- Auction Name.
- Selected Auction Mode.
- Administrator Information.
- Auction Code.
- Tracking Record.
- Export Excel.
- Export PDF.
- Refresh or Reconnect Status.

Actions must depend on the administrator's permissions and the auction status.

### B. Left Panel — Current Player

Display the current player using the active Player Display Configuration.

Possible information includes:

- Player Image.
- Player Name.
- Player Code.
- Age.
- Sport-specific playing role.
- Player category.
- Base Price.
- Current Bid.
- Assigned Team.
- Custom registration fields.
- Relevant player statistics.

The fields shown must be configured by the administrator rather than hard-coded into the player card.

If no players are available, display an appropriate completion or empty-state screen.

### C. Right Panel — Teams

Display each registered team as a team card.

Each card can include:

- Team Logo.
- Team Name.
- Owner or Captain.
- Remaining Points Balance.
- Players Purchased.
- Required Players.
- Remaining Player Slots.
- Team Status.
- Team Details action.

Example:

| Team | Budget Left | Players | Slots Left |
|---|---:|---:|---:|
| Springfield Squad | 40,000 | 10/13 | 3 |
| Sreshta Smashers | 55,000 | 8/13 | 5 |
| Bhavani Blasters | 20,000 | 12/13 | 1 |

These are illustrative values. The UI must display actual backend data.

The administrator selects a team as the current bidding team when required by the configured auction rules.

### D. Bottom Auction Controls

The control panel should contain:

**New Player Mode**

- Random
- Manual
- New Player

**Bidding Controls**

- Bid Up
- Bid Down
- Sold
- Unsold

**Auction Statistics**

- Sold
- Available
- Unsold
- Registered Teams

The control panel must adapt to the selected mode and the current auction state.

---

## 4. New Player Mode — Random and Manual

### Random Mode

When Random is selected:

1. The administrator clicks New Player.
2. The backend selects an eligible player from the available player pool.
3. The selected player becomes the current auction player.
4. The player details appear in the left panel.
5. The system records the selection in the auction history.

The backend must prevent a sold, unsold, withdrawn, or otherwise ineligible player from being selected again unless an explicit administrative workflow permits it.

Random selection should use an authoritative server-side selection algorithm. Concurrent requests must not assign two different current players to the same auction session.

### Manual Mode

When Manual is selected:

1. The administrator clicks New Player.
2. The frontend displays eligible players.
3. The administrator searches or filters the player list.
4. The administrator selects a player.
5. The backend verifies player eligibility.
6. The selected player becomes the current player.

Filters may include:

- Player Name.
- Player Category.
- Playing Role.
- Registration Status.
- Custom fields configured for the auction.

### New Player Action

The New Player button must:

- Require a valid auction session.
- Verify the previous player's final status.
- Check that the auction is not completed or cancelled.
- Load only eligible players.
- Record the player-selection event.

The button must be disabled when the auction state does not permit selecting another player.

---

## 5. Bidding Engine

### Bid Up

When the administrator clicks Bid Up:

1. The backend loads the authoritative current player and current bid.
2. It validates the auction session.
3. It calculates the next valid bid using the configured increment.
4. It checks the maximum bid.
5. It checks the selected team's available budget and eligibility.
6. It records the new bid.
7. The frontend receives the updated state.

Example:

- Minimum Bid: 500
- Bid Increment: 500
- Current Bid: 1,000
- Next Bid: 1,500

If the next increment exceeds the configured maximum, the backend must reject the bid and return a clear validation error.

### Bid Down

Bid Down must reduce the current bid according to the configured decrement policy.

Recommended behavior:

- Decrease by the configured bid increment.
- Never go below the permitted minimum bid.
- Never produce a negative bid.
- Reject changes when the player is already sold or the auction state is locked.
- Record the action in the audit history.

If a bid has already been accepted and recorded, Bid Down must not silently erase the historical bid. The system should use an explicit bid correction or reversal event when required.

### Sold

When the administrator clicks Sold:

1. Backend verifies the current auction session.
2. Backend verifies the player is still available for sale.
3. Backend validates the final bid.
4. Backend verifies the selected team's remaining budget.
5. Backend checks the roster limit and eligibility rules.
6. Backend atomically records the sale and team assignment.
7. Backend deducts the winning bid from the team's points balance.
8. Backend updates the player's status to SOLD.
9. Backend updates team roster statistics.
10. Backend emits a real-time state update.
11. The UI updates the Sold count and available player count.

If any validation fails, the sale must not be partially committed.

### Unsold

When the administrator clicks Unsold:

1. Backend verifies the current player.
2. Backend confirms that the player has not already been sold.
3. Backend records the Unsold status.
4. Backend preserves the player's history.
5. Backend updates the auction statistics.
6. Backend broadcasts the state change.

If the platform supports re-auctioning unsold players, it must provide an explicit re-auction workflow. An unsold player should not automatically become available for selection without a defined rule.

---

## 6. Auction Configuration Must Reflect Everywhere

The Auction Configuration is the authoritative source for bidding and roster rules.

### Editable Auction Settings

The administrator should be able to open **Edit Auction Settings** and manage permitted settings such as:

- Auction Name.
- Auction Image.
- Scheduled Date and Time.
- Minimum Bid.
- Maximum Bid.
- Bid Increment.
- Points Balance Per Team.
- Players Per Team.
- Roster Policy.
- Player Registration Form.
- Team Registration Form.
- Player Display Layout.
- Excel Export Fields.
- PDF Export Fields.

### Configuration Reflection Rules

| Setting | Where It Must Reflect |
|---|---|
| Minimum Bid | Player details and bidding engine |
| Maximum Bid | Bidding engine and bid validation |
| Bid Increment | Bid Up and Bid Down |
| Points Balance | Team cards and sale validation |
| Players Per Team | Team cards and roster validation |
| Roster Policy | Team registration and team management |
| Player Form Fields | Registration form and player details |
| Team Form Fields | Team registration and team details |
| Player Display Layout | Left player panel |
| Excel Field Configuration | Excel export |
| PDF Field Configuration | PDF export |

Updating a setting must not automatically invalidate existing bids or sold-player records.

For example, changing Players Per Team from 13 to 15 can permit additional roster slots. Reducing it to 10 when a team already owns 13 players must be blocked or handled through an explicit exception workflow.

Changing the maximum bid during a live auction must follow a defined policy. The system must not silently rewrite an already accepted bid.

### Live Auction Locking

When an auction becomes LIVE, critical settings should be locked by default.

If the administrator needs to change a locked setting, the platform must:

1. Require appropriate permission.
2. Explain the impact.
3. Validate the proposed change against current auction data.
4. Record the change in the audit log.
5. Apply it atomically if valid.

---

## 7. Team Registration and Player Registration

The Auction Details page must include the following configurable sections:

- Team Registration
- Player Registration
- Auction Settings

These sections must be associated with the correct auction and form configuration.

### Team Registration

The administrator can configure:

- Team Name.
- Team Logo.
- Owner or Captain.
- Contact Information.
- Custom Team Fields.
- Registration Requirements.
- Team Approval Rules.
- Player Roster Policy.
- Payment-related fields, when applicable.

### Player Registration

The administrator can configure:

- Player Name.
- Player Image.
- Contact Information.
- Sport-Specific Fields.
- Playing Role.
- Base Price, where applicable.
- Supporting Documents.
- Custom Player Fields.
- Required and optional fields.
- Registration Approval Rules.

Both registration forms must use the Dynamic Form Builder and its published validation rules.

A published registration form should automatically apply to the configured scope. The team registration form must not accidentally replace the player registration form.

---

## 8. Mandatory or Flexible Player Roster

The administrator must configure how teams satisfy their roster requirements.

### Mandatory Roster

In Mandatory mode:

- The required player count is defined by the auction configuration.
- A team must satisfy the configured roster requirement before the auction can be finalized.
- Team cards display required slots and remaining slots.
- The system validates roster completion at the appropriate lifecycle stage.

### Flexible Roster

In Flexible mode:

- Teams can purchase fewer than the configured maximum player count.
- The maximum roster limit still applies.
- The system does not require every available slot to be filled unless another rule requires it.
- Auction completion follows the configured minimum roster and business rules.

### Example

| Setting | Mandatory | Flexible |
|---|---|---|
| Maximum Players | 13 | 13 |
| Minimum Players | Configured requirement | Configured requirement or zero |
| Can Finish With Empty Slots? | Depends on mandatory rule | Yes, if minimum requirements are satisfied |
| Maximum Roster Enforced? | Yes | Yes |

Do not interpret Mandatory as requiring every team to purchase exactly the maximum number of players unless that is the explicit rule selected by the administrator.

The platform should support both `minPlayersPerTeam` and `maxPlayersPerTeam`, with an explicit roster policy.

---

## 9. Player Image and Details Customization

The administrator must control the fields displayed in the left player panel.

### Player Display Builder

Provide a configuration interface with:

- Field Selection.
- Field Ordering.
- Visibility.
- Label Customization.
- Section Grouping.
- Image Position.
- Image Width and Height.
- Image Aspect Ratio.
- Image Fit Mode.
- Show or Hide Empty Values.
- Highlight Important Fields.

### Example Layout

**Player Header**

- Player Image.
- Player Name.
- Player Code.

**Player Information**

- Age.
- Playing Role.
- Category.
- Base Price.

**Custom Details**

- Experience.
- Sport-specific attributes.
- Other published custom fields.

The administrator may choose which fields to display and their order.

The renderer must use an allowlist of supported display components. Custom field values must be rendered as text by default, not interpreted as executable HTML.

If an image is missing, display a configured fallback. The UI should support a consistent image preview and zoom experience where enabled.

---

## 10. Customized Excel and PDF Exports

The administrator must configure the exported fields rather than export every database property automatically.

### Export Configuration

Provide separate configuration for:

- Auction Results Excel.
- Auction Results PDF.
- Live Tracking Record.
- Team Roster Report.
- Player List Report.

For each export, allow:

- Field Selection.
- Column or Field Order.
- Custom Column Labels.
- Optional or hidden fields.
- Filters.
- Sort Order.
- Summary Sections.
- Team Grouping.
- Date and Auction Information.
- Export Template Preview.

### Excel Export

Excel reports may contain:

- Auction Information.
- Player Details.
- Winning Team.
- Final Bid.
- Player Status.
- Team Budget Summary.
- Custom Registration Fields.

The administrator selects which fields to include.

Use a maintained Excel generation library. Protect against spreadsheet formula injection when exporting user-submitted text.

### PDF Export

PDF reports may contain:

- Auction Header.
- Auction Logo or Image.
- Team Summary.
- Player Information.
- Sold and Unsold Status.
- Final Bid.
- Custom Fields.
- Report Generation Date.

Provide an appropriate page layout, table wrapping, and page breaks. Long custom field values must not break the document layout.

### Export Security

- Verify the exporter's permission.
- Export only records the requester is authorized to view.
- Exclude secrets, password hashes, private tokens, and internal security fields.
- Log sensitive administrative export operations where appropriate.
- Apply row and file-size limits or background generation for large reports.

---

## 11. Real-Time Synchronization

Live Mode should use Socket.IO or an equivalent real-time transport.

### Events

Suggested server events:

- `auction:state`
- `auction:player:selected`
- `auction:bid:updated`
- `auction:player:sold`
- `auction:player:unsold`
- `auction:team:updated`
- `auction:stats:updated`
- `auction:completed`

Suggested client commands:

- `auction:select-player`
- `auction:bid-up`
- `auction:bid-down`
- `auction:sell-player`
- `auction:mark-unsold`

These names are proposed conventions, not existing endpoints.

Every command must be authenticated and authorized. The backend must validate the auction ID, current session, player status, and operation permissions.

Socket.IO messages must not be treated as trusted state. The database and backend bidding engine remain authoritative.

### Concurrency

Multiple requests may arrive at the same time.

Use atomic database operations or transactions to prevent:

- Selling the same player twice.
- Deducting a team's budget twice.
- Exceeding the roster limit.
- Accepting an invalid bid.
- Advancing to multiple current players simultaneously.

Use an idempotency key or equivalent command identifier for important mutations, especially when a client retries a request after a timeout.

The client should refresh authoritative auction state after reconnecting rather than assuming it received every event.

---

## 12. Auction State Machine

Suggested auction session states:

- `READY`
- `RUNNING`
- `PAUSED`
- `COMPLETED`
- `CANCELLED`

Suggested player states:

- `REGISTERED`
- `AVAILABLE`
- `CURRENT`
- `SOLD`
- `UNSOLD`
- `WITHDRAWN`

### State Rules

- Only an eligible auction can be started.
- Only one player can be the current player in a given auction session.
- A player can be sold only once.
- A completed auction cannot accept new bids.
- A paused auction cannot accept bids.
- An auction can be resumed only by an authorized administrator.
- A completed auction must display the correct final statistics.
- Reopening or correcting completed records must follow a dedicated audited workflow.

### Auction Completion Screen

When no eligible players remain, show:

- Auction Completed.
- Total Players Sold.
- Total Players Unsold.
- Total Players Available.
- Team Summary.
- Download PDF Report.
- Export Excel.

The counts must be calculated from authoritative records, not from frontend counters alone.

---

## 13. MongoDB Data Model

### Auction Configuration

Collection: `auctions`

```javascript
{
  _id: ObjectId,
  name: String,
  sport: String,
  image: Object,

  minBid: Number,
  maxBid: Number,
  bidIncrement: Number,

  pointsBalancePerTeam: Number,
  minPlayersPerTeam: Number,
  maxPlayersPerTeam: Number,

  rosterPolicy: {
    type: String,
    enum: ["MANDATORY", "FLEXIBLE"]
  },

  status: String,
  configurationVersion: Number,
  createdBy: ObjectId,

  createdAt: Date,
  updatedAt: Date
}
```

### Auction Session

Collection: `auctionSessions`

```javascript
{
  _id: ObjectId,
  auctionId: ObjectId,

  mode: {
    type: String,
    enum: ["NORMAL", "LIVE"]
  },

  status: String,
  currentPlayerId: ObjectId,
  selectedTeamId: ObjectId,

  currentBid: Number,
  version: Number,

  startedBy: ObjectId,
  startedAt: Date,
  updatedAt: Date
}
```

### Team

Collection: `teams`

```javascript
{
  _id: ObjectId,
  auctionId: ObjectId,
  name: String,
  logo: Object,

  initialPointsBalance: Number,
  remainingPointsBalance: Number,

  minPlayers: Number,
  maxPlayers: Number,
  rosterPolicy: String,

  customData: Object,
  status: String,

  createdAt: Date,
  updatedAt: Date
}
```

### Player

Collection: `players`

```javascript
{
  _id: ObjectId,
  auctionId: ObjectId,
  name: String,
  image: Object,

  basePrice: Number,
  status: String,
  assignedTeamId: ObjectId,
  finalBid: Number,

  customData: Object,

  createdAt: Date,
  updatedAt: Date
}
```

### Bid History

Collection: `bids`

```javascript
{
  _id: ObjectId,
  auctionId: ObjectId,
  sessionId: ObjectId,
  playerId: ObjectId,
  teamId: ObjectId,

  amount: Number,
  action: String,
  actorId: ObjectId,

  createdAt: Date
}
```

These are conceptual schemas. Implement Mongoose validation, proper indexes, audit history, and controlled update operations.

Use integer point units or a clearly defined decimal strategy. Avoid floating-point arithmetic for money-like balances.

Team balances and sold-player assignments must be updated atomically with the corresponding sale record. The final-bid record must preserve the actual winning amount.

---

## 14. Backend Folder Structure

```text
backend/
└── src/
    ├── modules/
    │   ├── auctions/
    │   ├── auction-sessions/
    │   ├── teams/
    │   ├── players/
    │   ├── bidding/
    │   ├── auction-results/
    │   ├── exports/
    │   └── form-builder/
    │
    ├── realtime/
    │   ├── socket.js
    │   ├── auction-events.js
    │   └── auction-gateway.js
    │
    ├── middleware/
    │   ├── authenticate.js
    │   ├── authorize.js
    │   ├── validateRequest.js
    │   └── errorHandler.js
    │
    ├── config/
    │   └── database.js
    │
    └── app.js
```

### Module Responsibilities

- `auction-sessions`: Start, pause, resume, and complete sessions.
- `bidding`: Validate bids and execute sale-related business rules.
- `teams`: Manage budgets, roster rules, and team registration.
- `players`: Manage player registration and auction status.
- `auction-results`: Calculate final statistics and results.
- `exports`: Generate authorized Excel and PDF reports.
- `form-builder`: Manage published registration and display configurations.
- `auction-gateway`: Handle authenticated real-time commands and broadcasts.

Keep bidding rules in the backend service layer, not in Socket.IO event handlers or React components.

---

## 15. Frontend Folder Structure

```text
frontend/
└── src/
    ├── app/
    │   └── admin/
    │       └── auctions/
    │           └── [auctionId]/
    │               ├── page.jsx
    │               ├── settings/
    │               ├── teams/
    │               ├── players/
    │               ├── registration/
    │               ├── display-layout/
    │               ├── export-settings/
    │               └── live/
    │                   └── page.jsx
    │
    ├── components/
    │   ├── auction/
    │   │   ├── AuctionHeader.jsx
    │   │   ├── AuctionModeDialog.jsx
    │   │   ├── AuctionPlayerPanel.jsx
    │   │   ├── TeamSelectionPanel.jsx
    │   │   ├── AuctionControlBar.jsx
    │   │   ├── AuctionStatistics.jsx
    │   │   └── AuctionCompletion.jsx
    │   │
    │   ├── bidding/
    │   ├── teams/
    │   ├── players/
    │   ├── form-builder/
    │   └── exports/
    │
    ├── services/
    │   ├── auction.service.js
    │   ├── bidding.service.js
    │   ├── team.service.js
    │   ├── player.service.js
    │   └── export.service.js
    │
    └── hooks/
        ├── useAuctionSession.js
        └── useAuctionRealtime.js
```

---

## 16. API Endpoint Design

Base URL: `/api/v1`

### Auction Session

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auctions/:id/sessions/start` | Start in the selected mode |
| GET | `/auctions/:id/sessions/current` | Get current session state |
| POST | `/sessions/:id/pause` | Pause an active session |
| POST | `/sessions/:id/resume` | Resume a paused session |
| POST | `/sessions/:id/complete` | Complete an eligible session |

### Player and Bidding

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/sessions/:id/players/select-random` | Select a random eligible player |
| POST | `/sessions/:id/players/select` | Select a player manually |
| POST | `/sessions/:id/bid-up` | Increase the current bid |
| POST | `/sessions/:id/bid-down` | Decrease according to the configured policy |
| POST | `/sessions/:id/sell` | Sell the current player |
| POST | `/sessions/:id/unsold` | Mark the current player unsold |
| GET | `/sessions/:id/state` | Retrieve authoritative state |

### Settings and Export

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/auctions/:id/settings` | Retrieve auction configuration |
| PATCH | `/auctions/:id/settings` | Update permitted settings |
| GET | `/auctions/:id/export-settings` | Retrieve export configuration |
| PUT | `/auctions/:id/export-settings` | Update export configuration |
| GET | `/auctions/:id/results/excel` | Export authorized results |
| GET | `/auctions/:id/results/pdf` | Export authorized PDF report |
| GET | `/auctions/:id/tracking` | Retrieve authorized tracking records |

Every mutation must verify user permissions, auction state, and applicable business rules.

---

## 17. Testing Checklist

### Start and Mode Selection

- [ ] Admin can select Normal Mode.
- [ ] Admin can select Live Mode.
- [ ] Confirm starts a valid auction session.
- [ ] Invalid sessions cannot be started.
- [ ] Session mode persists across page refreshes.
- [ ] Unauthorized users cannot start or resume sessions.

### Bidding

- [ ] Bid Up follows the configured increment.
- [ ] Bid Down respects the permitted minimum.
- [ ] Maximum bid is enforced.
- [ ] A team cannot exceed its available budget.
- [ ] A team cannot exceed its maximum roster.
- [ ] The same player cannot be sold twice.
- [ ] Sale and budget deduction are atomic.
- [ ] Concurrent sale requests cannot double-charge a team.

### Customization

- [ ] Minimum Bid reflects in the live player panel.
- [ ] Maximum Bid is enforced by the backend.
- [ ] Players Per Team reflects in team cards.
- [ ] Mandatory and Flexible roster rules behave correctly.
- [ ] Custom player fields appear in the live display.
- [ ] Hidden fields do not leak into unauthorized views.
- [ ] Exported fields follow the configured export template.
- [ ] Settings cannot be changed in a way that silently invalidates existing records.

### Real-Time and Exports

- [ ] Live updates reach authorized connected clients.
- [ ] Reconnecting clients retrieve the latest state.
- [ ] Excel exports contain the configured fields.
- [ ] PDF exports use the configured layout.
- [ ] Completed auction counts match the database.
- [ ] Export permissions are enforced.

---

## 18. Implementation Order

1. Implement auction settings and configuration versioning.
2. Implement the Start Auction mode-selection dialog.
3. Implement auction session state management.
4. Build the Live Auction Control Center UI.
5. Implement player selection in Random and Manual modes.
6. Implement the backend bidding engine.
7. Implement Sold and Unsold workflows.
8. Implement team budgets and roster enforcement.
9. Add real-time synchronization.
10. Connect the customized player display configuration.
11. Connect team and player registration forms.
12. Implement Excel and PDF export configuration.
13. Build the completion screen and final statistics.
14. Add audit logs and concurrency tests.
15. Test in staging before production deployment.

## 19. Definition of Done

The module is complete when:

- Start Auction opens the mode-selection dialog.
- Normal Mode and Live Mode operate through the same authoritative bidding engine.
- The live workspace follows the supplied reference layout.
- Player selection supports Random and Manual modes.
- Bid Up, Bid Down, Sold, and Unsold enforce backend rules.
- Team cards show correct balances and roster counts.
- Auction settings reflect across registration, live bidding, and reports.
- Player details and registration forms are configurable.
- Excel and PDF exports use administrator-defined fields.
- Live updates are reliable and recoverable.
- Auction results remain consistent under concurrent requests.
- Critical actions are authenticated, authorized, and audited.

**Final Architecture:**

Next.js Admin Panel → Auction Configuration → Session Mode Selection → Live Auction Control Center → Node.js Bidding Engine → MongoDB → Real-Time Updates → Customized Excel and PDF Reports.
