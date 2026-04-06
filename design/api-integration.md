# API Integration Guide

Base URL: `http://localhost:3000`

All responses are wrapped by the response interceptor:
- **Single resource** → `{ data: { ... } }`
- **List** → `{ data: { items: [...], pagination: { page, limit, total, totalPages }, links: { ... } } }`
- **Delete** → HTTP 204, no body

---

## Common Conventions

### Pagination query params (all list endpoints)
| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number (1-based) |
| `limit` | integer | `20` | Items per page |

### Error response shape
```json
{
  "statusCode": 404,
  "errorCode": "error.NOT_FOUND",
  "message": "Resource not found"
}
```

### Error codes
| `errorCode` | HTTP | Meaning |
|---|---|---|
| `error.NOT_FOUND` | 404 | Resource does not exist |
| `error.CONFLICT` | 409 | Unique constraint violated |
| `error.BAD_REQUEST` | 400 | Business rule violation |
| `error.VALIDATION` | 422 | Request body / query param invalid |
| `error.UNAUTHORIZED` | 401 | Authentication required |
| `error.FORBIDDEN` | 403 | Insufficient permissions |
| `error.DATABASE` | 500 | Unexpected database error |

### ID format
All IDs are `bigint` serialized as **strings** in JSON (e.g. `"1"`, `"42"`).

---

## Users

### Enums
| Field | Value | Meaning |
|---|---|---|
| `type` | `1` | Internal member |
| `type` | `2` | Guest |

---

### `GET /users` — List users

**Query params**
| Param | Type | Description |
|---|---|---|
| `type` | `1` \| `2` | Filter by user type |
| `page` | integer | |
| `limit` | integer | |

**Response `200`**
```json
{
  "data": {
    "items": [
      {
        "id": "1",
        "name": "Nguyen Van A",
        "type": 1,
        "avatar_url": null,
        "created_at": "2026-04-01T10:00:00.000Z",
        "updated_at": "2026-04-01T10:00:00.000Z",
        "deleted_at": null
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 },
    "links": { "first": "/users?page=1", "last": "/users?page=1" }
  }
}
```

---

### `POST /users` — Create user

**Request body**
```json
{
  "name": "Nguyen Van A",
  "type": 1,
  "avatar_url": "https://example.com/avatar.jpg"
}
```
| Field | Required | Type | Notes |
|---|---|---|---|
| `name` | yes | string | |
| `type` | no | `1` \| `2` | Default `1` (internal) |
| `avatar_url` | no | string | |

**Response `201`** — same shape as a single user object wrapped in `{ data: { ... } }`

---

### `GET /users/:id` — Get user

**Response `200`** — single user object

---

### `PATCH /users/:id` — Update user

**Request body** — all fields optional, same fields as create

**Response `200`** — updated user object

---

### `DELETE /users/:id` — Delete user (soft)

**Response `204`** — no body

---

## Courts

### `GET /courts` — List courts

**Response `200`**
```json
{
  "data": {
    "items": [
      {
        "id": "1",
        "name": "Court A",
        "price": 150000,
        "description": "Main court",
        "created_at": "...",
        "updated_at": "...",
        "deleted_at": null
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 },
    "links": {}
  }
}
```

---

### `POST /courts` — Create court

**Request body**
```json
{
  "name": "Court A",
  "price": 150000,
  "description": "Main court"
}
```
| Field | Required | Type | Notes |
|---|---|---|---|
| `name` | yes | string | |
| `price` | yes | integer ≥ 1 | VND, no decimals |
| `description` | no | string | |

**Response `201`**

---

### `GET /courts/:id` — Get court

**Response `200`**

---

### `PATCH /courts/:id` — Update court

**Request body** — all fields optional

**Response `200`**

---

### `DELETE /courts/:id` — Delete court (soft)

**Response `204`**

---

## Shuttlecocks

Identical structure to Courts.

### `GET /shuttlecocks` — List shuttlecocks
### `POST /shuttlecocks` — Create shuttlecock

**Request body**
```json
{
  "name": "RSL Classic",
  "price": 18000,
  "description": "Speed 77"
}
```
| Field | Required | Type | Notes |
|---|---|---|---|
| `name` | yes | string | |
| `price` | yes | integer ≥ 1 | VND per tube |
| `description` | no | string | |

### `GET /shuttlecocks/:id`
### `PATCH /shuttlecocks/:id`
### `DELETE /shuttlecocks/:id` → `204`

---

## Subsidies

### `GET /subsidies` — List subsidies

**Response `200`**
```json
{
  "data": {
    "items": [
      {
        "id": "1",
        "month": "2026-04-01",
        "total_amount": 2000000,
        "used_amount": 0,
        "created_at": "...",
        "updated_at": "..."
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 },
    "links": {}
  }
}
```
> Note: `month` is stored as a date string `YYYY-MM-01`. Display it as `YYYY-MM` in the UI.

---

### `POST /subsidies` — Create monthly subsidy

**Request body**
```json
{
  "month": "2026-04",
  "total_amount": 2000000
}
```
| Field | Required | Type | Notes |
|---|---|---|---|
| `month` | yes | string `YYYY-MM` | One subsidy per month; conflict → 409 |
| `total_amount` | no | integer ≥ 1 | Default `2000000` |

**Response `201`**

**Errors**
- `409 CONFLICT` — subsidy for this month already exists

---

### `GET /subsidies/month/:month` — Get subsidy by month

**Path param:** `month` = `YYYY-MM` (e.g. `/subsidies/month/2026-04`)

> **Important**: Declare this route before `/subsidies/:id` in the UI routing to avoid ambiguity.

**Response `200`** — single subsidy object

---

### `GET /subsidies/:id` — Get subsidy by ID

**Response `200`**

---

### `PATCH /subsidies/:id` — Update subsidy amount

> Only `total_amount` is editable. `used_amount` is managed automatically on finalization.

**Request body**
```json
{
  "total_amount": 3000000
}
```

**Response `200`**

---

## Sessions

### Enums

| Field | Value | Meaning |
|---|---|---|
| `status` | `1` | Draft |
| `status` | `2` | Finalized |
| `status` | `3` | Locked |

| `cost_strategy` | Value | Meaning |
|---|---|---|
| Equal split | `1` | Total net cost divided equally among all participants |
| Internal only | `2` | Total net cost divided among internal members only; guests pay 0 |
| Weighted | `3` | Internal = 1.0× share, Guest = 0.5× share |

---

### `GET /sessions` — List sessions

**Query params**
| Param | Type | Description |
|---|---|---|
| `month` | string `YYYY-MM` | Filter by session month |
| `status` | `1` \| `2` \| `3` | Filter by status |
| `page` | integer | |
| `limit` | integer | |

**Response `200`**
```json
{
  "data": {
    "items": [
      {
        "id": "1",
        "session_date": "2026-04-05",
        "court_id": "1",
        "status": 1,
        "is_scheduled": true,
        "created_at": "...",
        "updated_at": "...",
        "deleted_at": null
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 },
    "links": {}
  }
}
```

---

### `POST /sessions` — Create session

**Request body**
```json
{
  "session_date": "2026-04-10",
  "court_id": "1",
  "is_scheduled": true
}
```
| Field | Required | Type | Notes |
|---|---|---|---|
| `session_date` | yes | ISO date string | e.g. `"2026-04-10"` |
| `court_id` | no | string | ID of the court |
| `is_scheduled` | no | boolean | Default `true` |

**Response `201`**

---

### `GET /sessions/:id` — Get session

**Response `200`**

---

### `PATCH /sessions/:id` — Update session

> Only allowed when `status = 1` (draft).

**Request body**
```json
{
  "session_date": "2026-04-12",
  "court_id": "2"
}
```

**Errors**
- `400 BAD_REQUEST` — session is not draft

**Response `200`**

---

### `DELETE /sessions/:id` — Delete session (soft)

> Only allowed when `status = 1` (draft).

**Errors**
- `400 BAD_REQUEST` — session is not draft

**Response `204`**

---

### `POST /sessions/:id/finalize` — Finalize session

Locks the session, calculates costs, records per-user amounts, and deducts the monthly subsidy — all in a single transaction.

**Request body**
```json
{
  "cost_strategy": 1,
  "other_cost": 50000,
  "note": "Extra food costs"
}
```
| Field | Required | Type | Notes |
|---|---|---|---|
| `cost_strategy` | yes | `1` \| `2` \| `3` | Cost allocation strategy |
| `other_cost` | no | integer ≥ 0 | Additional costs in VND; default `0` |
| `note` | no | string | |

**Response `200`** — session snapshot with per-user breakdown
```json
{
  "data": {
    "id": "1",
    "session_id": "1",
    "court_name": "Court A",
    "court_price": 150000,
    "shuttlecock_total": 54000,
    "other_cost": 50000,
    "total_cost": 254000,
    "subsidy_used": 254000,
    "cost_strategy": 1,
    "note": "Extra food costs",
    "calculation_metadata": {},
    "created_at": "...",
    "perUsers": [
      {
        "user_id": "1",
        "type_snapshot": 1,
        "cost_share": 127000,
        "subsidy_share": 127000,
        "final_amount": 0,
        "is_paid": false,
        "paid_at": null
      }
    ]
  }
}
```

**Errors**
- `400 BAD_REQUEST` — session is not draft
- `400 BAD_REQUEST` — session has no participants

---

## Session Participants

### `GET /sessions/:id/participants` — List participants

**Response `200`**
```json
{
  "data": {
    "items": [
      {
        "id": "1",
        "session_id": "1",
        "user_id": "3",
        "type_snapshot": 1,
        "created_at": "...",
        "deleted_at": null
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 },
    "links": {}
  }
}
```
> `type_snapshot` is the user's type **at the time they were added** — it does not change if the user type is later updated.

---

### `POST /sessions/:id/participants` — Add participant

> Only allowed when `status = 1` (draft).

**Request body**
```json
{
  "user_id": "3"
}
```

**Errors**
- `404 NOT_FOUND` — user does not exist
- `409 CONFLICT` — user already in session
- `400 BAD_REQUEST` — session is not draft

**Response `201`**

---

### `DELETE /sessions/:id/participants/:userId` — Remove participant

> Only allowed when `status = 1` (draft).

**Response `204`**

---

## Session Shuttlecock Usage

### `GET /sessions/:id/shuttlecocks` — List shuttlecock usage

**Response `200`**
```json
{
  "data": {
    "items": [
      {
        "id": "1",
        "session_id": "1",
        "shuttlecock_id": "2",
        "shuttlecock_name": "RSL Classic",
        "unit_price_snapshot": 18000,
        "quantity": 3,
        "total_amount": 54000,
        "created_at": "..."
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 },
    "links": {}
  }
}
```
> `shuttlecock_name` and `unit_price_snapshot` are frozen at the time of recording.

---

### `POST /sessions/:id/shuttlecocks` — Add shuttlecock usage

> Only allowed when `status = 1` (draft).

**Request body**
```json
{
  "shuttlecock_id": "2",
  "quantity": 3
}
```

**Errors**
- `404 NOT_FOUND` — shuttlecock does not exist
- `400 BAD_REQUEST` — session is not draft

**Response `201`**

---

### `PATCH /sessions/:id/shuttlecocks/:snapshotId` — Update quantity

**Request body**
```json
{
  "quantity": 5
}
```

**Response `200`**

---

### `DELETE /sessions/:id/shuttlecocks/:snapshotId` — Remove usage record

**Response `204`**

---

## Session Payments

### `GET /sessions/:id/payments` — List payment status

> Session must be `status = 2` (finalized) or `status = 3` (locked).

**Response `200`**
```json
{
  "data": {
    "items": [
      {
        "user_id": "1",
        "type_snapshot": 1,
        "cost_share": 127000,
        "subsidy_share": 127000,
        "final_amount": 0,
        "is_paid": false,
        "paid_at": null
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1 },
    "links": {}
  }
}
```

---

### `PATCH /sessions/:id/payments/:userId` — Mark as paid

> Idempotent — calling again on an already-paid entry is a no-op.

**Response `200`** — updated payment record

---

## Cost Calculation Reference

The finalization engine computes costs as follows:

```
totalCost = courtPrice + shuttlecockTotal + otherCost
subsidyUsed = min(subsidyAvailable, totalCost)
netCost = totalCost - subsidyUsed
```

**Strategy 1 — Equal split**
- All participants share `netCost` equally (remainder goes to first user).

**Strategy 2 — Internal only**
- `netCost` divided only among participants with `type_snapshot = 1`.
- Guests pay `0`.

**Strategy 3 — Weighted**
- Internal weight = `1.0`, Guest weight = `0.5`.
- Each user's share ∝ their weight.

`final_amount` is what the member actually owes. `subsidy_share` is how much subsidy was applied to their portion.

---

## Typical Workflow

```
1. POST /courts            → create a court
2. POST /users             → create members
3. POST /subsidies         → create monthly subsidy (once per month)
4. POST /sessions          → create session (status = DRAFT)
5. POST /sessions/:id/participants  → add each member
6. POST /sessions/:id/shuttlecocks → record tubes used
7. POST /sessions/:id/finalize      → calculate & finalize (status → FINALIZED)
8. PATCH /sessions/:id/payments/:userId → mark payments as collected
```
