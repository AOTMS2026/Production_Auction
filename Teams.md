# Auction Platform — Team Management

## 1. Overview

Route: `/auction/:id`

The Auction Details page displays teams registered for the selected auction. Each team appears as a card based on the provided UI reference.

**Tech Stack:** Next.js, Node.js, Express.js, MongoDB, Mongoose, Cloudinary.

## 2. Team Card UI

Each team card displays:

- Team Logo
- Team Name
- Team Short Name
- Total Players
- Registered Players (`Res. PL`)
- Used Points (`Used PTS`)
- Maximum Bid (`Max Bid`)
- Total Points

All values must be calculated from the selected auction's team and player data.

## 3. Team CRUD Operations

A three-dot menu on each team card provides the following actions:

- **Edit Team:** Update team details, logo, and permitted configuration.
- **Delete Team:** Delete an eligible team after confirmation.

### Create Team

Admin enters team name, short name, and team logo. The backend validates the details and saves the team under the selected auction.

### Edit Team

Admin can update permitted team details. Changes must reflect immediately on the team card.

### Delete Team

Display a confirmation dialog before deletion. Prevent deletion if the team has sold players or dependent records unless an authorized cancellation or reassignment workflow is completed. Preserve auction history.

## 4. Team Logo Upload

- Upload and store team logo images using the existing Cloudinary configuration.
- Validate file type and size on the backend.
- Save the resulting image URL and storage identifier in MongoDB.
- Support logo preview and replacement.
- Clean up replaced images according to the storage lifecycle policy.

## 5. Team Statistics

| Field | Meaning |
|---|---|
| Total Players | Maximum permitted player slots |
| Res. PL | Players registered or allocated, according to the defined metric |
| Used PTS | Points spent on sold players |
| Max Bid | Highest currently permitted bid for the team |
| Total Points | Initial team points balance |

**Calculation rules:**

- `Res. PL` = Count of players allocated to the team.
- `Used PTS` = Sum of the final accepted bids for players purchased by the team.
- `Total Points` = Initial points balance configured for the team.
- `Remaining Points` = Total Points − Used PTS.
- `Max Bid` must be calculated according to the remaining budget, remaining roster slots, and auction bidding rules.

For a team that must fill its remaining roster slots, the maximum affordable bid may need to reserve enough points for the required future players. The backend must calculate this consistently.

## 6. API Endpoints

Base URL: `/api/v1`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auctions/:auctionId/teams` | Create team |
| GET | `/auctions/:auctionId/teams` | List teams |
| GET | `/auctions/:auctionId/teams/:teamId` | Get team details |
| PATCH | `/auctions/:auctionId/teams/:teamId` | Update team |
| DELETE | `/auctions/:auctionId/teams/:teamId` | Delete eligible team |

All endpoints must verify authentication, admin permissions, auction ownership, and team-to-auction relationships.

## 7. MongoDB Team Model

```javascript
{
  auctionId: ObjectId,
  name: String,
  shortName: String,
  logo: {
    url: String,
    publicId: String
  },
  initialPointsBalance: Number,
  maxPlayers: Number,
  createdAt: Date,
  updatedAt: Date
}
```

Use Mongoose validation, indexes, and timestamps. Calculate derived statistics from authoritative player and bid records rather than allowing clients to modify them directly.

## 8. Frontend Structure

```text
frontend/src/
├── app/
│   └── auction/
│       └── [id]/
│           └── page.jsx
├── components/
│   └── teams/
│       ├── TeamCard.jsx
│       ├── TeamForm.jsx
│       ├── TeamMenu.jsx
│       └── DeleteTeamDialog.jsx
└── services/
    └── team.service.js
```

## 9. Definition of Done

- Teams display on `/auction/:id`.
- Team cards match the reference layout.
- Admin can create, edit, and delete eligible teams.
- Logo uploads use the existing Cloudinary setup.
- Team statistics reflect actual auction records.
- Team changes refresh the UI correctly.
- Unauthorized users cannot modify teams.
- Sold-player and bid history remain intact.
