# Auction Platform — Player Form Data Integration & Display Customization

## 1. Objective

Fix the existing Player Registration Form and Player Display integration.

Currently, customized form information is not displaying correctly. The form configuration, submitted player data, and player display configuration must be connected using the same `auctionId`.

**Expected Result:** Admin customize chesina form lo player details fill chesi submit chesinappudu, aa information correct auction database lo save avvali. Admin Display Settings lo ON chesina fields matrame Player Display lo visible avvali.

## 2. Required Fixes

### A. Auction ID-Based Form Storage

- Every form template must be associated with its `auctionId`.
- Player registration form configuration must be stored and retrieved using the correct auction ID.
- Submitted player information must reference the same auction ID.
- Form configuration and player submission data must remain separate but correctly linked.
- Do not use a global form configuration when the auction has its own published configuration.
- Validate the auction ID and form version before saving submissions.

### B. Player Registration Form

1. Admin opens `/auction/:id`.
2. Admin navigates to Player Registration → Customize Form.
3. Admin adds or edits fields.
4. Admin configures validation and required settings.
5. Admin publishes the form.
6. The player registration page loads the published form for that auction.
7. Player fills and submits the form.
8. Backend validates the submitted data against the published form schema.
9. Player information is saved in MongoDB with the correct `auctionId` and `formVersionId`.

### C. Player Data Model

Ensure that the Player model supports customized form data.

```javascript
{
  auctionId: ObjectId,
  formVersionId: ObjectId,

  name: String,
  image: Object,

  customData: {
    // Dynamically submitted fields
  },

  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

Use the existing model's field names if they already serve these purposes. Do not create duplicate properties or collections without first checking the existing implementation.

## 3. Customized Information Display

The admin must control which player fields appear in the Player Display.

### Display Settings

For every supported field, provide:

- Display Label
- Visible: ON / OFF
- Display Order
- Optional Section
- Formatting, where supported

Example:

| Field | Display Setting | Result |
|---|---|---|
| Player Name | ON | Visible |
| Player Image | ON | Visible |
| Phone Number | OFF | Hidden |
| Playing Role | ON | Visible |
| Experience | OFF | Hidden |
| Base Price | ON | Visible |

**Rule:** Admin Display Settings lo ON chesina fields matrame Player Display lo kanipinchali. OFF chesina fields display nunchi hide avvali.

Visibility settings must not delete the original submitted information.

## 4. Display Configuration Storage

Store display configuration against the same auction and form scope.

Example:

```javascript
{
  auctionId: ObjectId,
  formType: "PLAYER_REGISTRATION",
  formVersionId: ObjectId,

  displayFields: [
    {
      key: "name",
      label: "Player Name",
      visible: true,
      order: 1
    },
    {
      key: "playingRole",
      label: "Playing Role",
      visible: true,
      order: 2
    },
    {
      key: "phone",
      label: "Phone Number",
      visible: false,
      order: 3
    }
  ],

  updatedAt: Date
}
```

This is a conceptual structure. Reuse the existing display configuration model if one already exists.

### Important Rules

- Display configuration must belong to the correct auction.
- Only authorized admins can update it.
- Field keys must match the actual form schema and submitted data.
- Unknown field keys must be rejected or flagged.
- Hidden fields must remain stored in MongoDB.
- Display order must follow the saved configuration.
- Missing custom values should not break the player card.

## 5. Backend APIs

Inspect existing routes before adding new ones.

Recommended API responsibilities:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/auctions/:id/forms/player` | Get published player form |
| PUT | `/api/v1/auctions/:id/forms/player/display` | Save display configuration |
| GET | `/api/v1/auctions/:id/forms/player/display` | Get display configuration |
| POST | `/api/v1/auctions/:id/players` | Submit player information |
| GET | `/api/v1/auctions/:id/players` | List players for the auction |
| GET | `/api/v1/auctions/:id/players/:playerId` | Get player details |
| PATCH | `/api/v1/auctions/:id/players/:playerId` | Update authorized player information |

All endpoints must validate authentication, authorization, auction ownership, and the relationship between the auction, form, and player.

## 6. Frontend Fixes

Inspect and correct the existing components responsible for:

- Loading the customized player registration form.
- Saving and publishing form configuration.
- Submitting player details.
- Fetching player data.
- Loading Display Settings.
- Rendering the player card or details panel.

### Expected Rendering Workflow

1. Read the current `auctionId` from the route.
2. Fetch the correct published player form.
3. Fetch the player submission data.
4. Fetch the corresponding display configuration.
5. Match display field keys with the form schema and player data.
6. Filter fields where `visible === true`.
7. Sort the remaining fields by their configured `order`.
8. Render labels and values dynamically.

Do not hard-code custom field names in the Player Display component.

### Data Mapping

The display renderer must support both system fields and custom fields.

Examples:

- System field: `player.name`
- Custom field: `player.customData.playingRole`

Use a centralized field-value resolver rather than assuming every field is stored at the same object path.

## 7. Debugging Existing Code

Before modifying the implementation:

1. Inspect the current Player model and form-template model.
2. Inspect the form publish API and player submission API.
3. Verify that `auctionId` is passed consistently through the frontend and backend.
4. Check MongoDB records for actual submitted custom field values.
5. Check whether custom values are saved under `customData`, another existing property, or are being discarded.
6. Inspect the Display Settings save and retrieval APIs.
7. Verify whether the display component filters fields using the saved visibility configuration.
8. Fix the existing integration instead of creating parallel models or APIs unnecessarily.

Check browser Network requests, backend logs, and MongoDB documents to locate the actual failure.

## 8. Validation and Testing

- [ ] Customized form loads for the correct auction.
- [ ] Published form fields appear on the registration page.
- [ ] Player submissions save all valid custom fields.
- [ ] Every submission references the correct auction and form version.
- [ ] Player information is retrieved correctly after refresh.
- [ ] Display Settings persist after refresh.
- [ ] ON fields appear on the Player Display.
- [ ] OFF fields remain stored but are not displayed.
- [ ] Display order follows the saved configuration.
- [ ] Custom labels appear correctly.
- [ ] Empty or missing custom values do not break rendering.
- [ ] Different auctions use their own configurations.
- [ ] Unauthorized users cannot change display settings.
- [ ] Hidden fields are not accidentally exposed through restricted APIs.
- [ ] Existing player data remains intact after the fix.

## 9. Definition of Done

The task is complete when the customized player form, submitted player data, and Display Settings are correctly integrated using the selected `auctionId`.

Admin form changes must apply to the correct registration workflow, player information must be stored and retrieved reliably, and the Player Display must show only fields enabled in the saved display configuration.

**Final Workflow:**

Auction ID → Published Player Form → Player Submission → MongoDB → Display Configuration → Visible Fields Only → Player Display.
