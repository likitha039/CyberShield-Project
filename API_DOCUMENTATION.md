# CyberShield REST API Documentation

Base URL: `http://localhost:8080/api`  
Authentication: Stateless JWT Bearer Token (`Authorization: Bearer <token>`)

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/login` (Public)
Authenticates a user using Spring Security `AuthenticationManager` and BCrypt password verification.

**Request Body:**
```json
{
  "email": "admin@cybershield.io",
  "password": "Admin@1234"
}
```

**Response (`200 OK`):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "fullName": "Elena Vance",
    "email": "admin@cybershield.io",
    "department": "Security Operations",
    "jobTitle": "CISO / Lead Admin",
    "active": true,
    "role": "ROLE_ADMIN",
    "createdAt": "2026-11-18T01:30:00"
  }
}
```

### `POST /api/auth/register` (Public)
Registers a new user with the default `ROLE_EMPLOYEE` role.

### `GET /api/auth/me` (Authenticated)
Returns the currently authenticated user profile (`UserDto`).

---

## 2. Dashboard (`/api/dashboard`)

### `GET /api/dashboard/stats` (Authenticated)
Returns role-scoped incident metrics (`totalIncidents`, `openIncidents`, `criticalIncidents`, `resolvedIncidents`), `severityCounts`, `statusCounts`, `categoryCounts`, `monthlyTrend`, and `recentIncidents`.
- `ROLE_EMPLOYEE`: Scoped strictly to incidents reported by the authenticated user.
- `ROLE_ADMIN` / `ROLE_ANALYST`: Organization-wide metrics.

---

## 3. Incidents & Investigations (`/api/incidents`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/incidents` | Authenticated | Query params: `status`, `severity`, `category`, `search`, `assignedToMe` |
| `POST` | `/api/incidents` | Authenticated | Report a new incident (sets status `REPORTED` and creates initial `incident_history` row) |
| `GET` | `/api/incidents/{id}` | Authenticated | Fetch incident details (Employees restricted to own reports) |
| `POST` | `/api/incidents/{id}/assign` | `ROLE_ADMIN` | Assign an active `ROLE_ANALYST` and auto-transition `REPORTED` → `UNDER_INVESTIGATION` |
| `PATCH` | `/api/incidents/{id}/status` | `ROLE_ADMIN`, `ROLE_ANALYST` | Update status (`REPORTED`, `UNDER_INVESTIGATION`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`) |
| `PATCH` | `/api/incidents/{id}/severity` | `ROLE_ADMIN`, `ROLE_ANALYST` | Update severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `GET` | `/api/incidents/{id}/notes` | Authenticated | Retrieve chronological investigation notes |
| `POST` | `/api/incidents/{id}/notes` | `ROLE_ADMIN`, `ROLE_ANALYST` | Add investigation note and remediation action taken |
| `GET` | `/api/incidents/{id}/history` | Authenticated | Retrieve immutable audit log from `incident_history` |

---

## 4. User Management (`/api/users`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | `ROLE_ADMIN` | List all registered users |
| `GET` | `/api/users/analysts` | `ROLE_ADMIN`, `ROLE_ANALYST` | List active security analysts for assignment dropdowns |
| `POST` | `/api/users` | `ROLE_ADMIN` | Create user with assigned role and BCrypt password |
| `PUT` | `/api/users/{id}` | `ROLE_ADMIN` | Edit user details, role, and active state |
| `PATCH` | `/api/users/{id}/status` | `ROLE_ADMIN` | Activate or deactivate an account (`{ "active": false }`) |

---

## 5. Reports (`/api/reports`)

### `GET /api/reports/summary` (`ROLE_ADMIN`, `ROLE_ANALYST`)
Returns `totalIncidents`, `openIncidents`, `resolvedOrClosedIncidents`, `resolutionRatePercent`, `bySeverity`, `byStatus`, `byCategory`, and `monthlyStatistics`.
