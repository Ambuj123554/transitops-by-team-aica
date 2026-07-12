# TransitOps - Smart Transport Operations Platform

A full-stack fleet management platform for dispatching trips, managing vehicles and drivers, tracking maintenance and fuel expenses, and generating operational analytics. Built with Next.js, Express, PostgreSQL, and TypeScript.

---

## Features

- **Trip Dispatcher** - Create, dispatch, complete, and cancel trips with vehicle/driver assignment and cargo capacity validation.
- **Fleet Management** - Full vehicle registry with CRUD operations, status tracking (Available, On Trip, In Shop, Retired), and region-based filtering.
- **Driver Management** - Driver profiles with license tracking, safety scores, trip completion rates, and automatic license expiry detection.
- **Maintenance Tracking** - Service record logging with automatic vehicle status transitions (Available to In Shop and back).
- **Fuel & Expense Tracking** - Fuel consumption logs, toll and miscellaneous expense recording, operational cost aggregation.
- **Dashboard** - Real-time KPI cards (active vehicles, trips, drivers on duty, fleet utilization) with vehicle type, status, and region filters.
- **Analytics & Reports** - Fuel efficiency metrics, fleet utilization rates, operational cost analysis, vehicle ROI calculation, monthly revenue trends, costliest vehicles ranking, and CSV report export.
- **Role-Based Access Control** - Four roles (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) with granular read/write/view permissions across modules.
- **Authentication** - JWT-based authentication with account lockout after failed login attempts.

---

## Tech Stack

### Frontend
- **Framework:** Next.js 13.5 (React 18)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Charts:** Recharts
- **Forms:** react-hook-form, zod validation
- **Notifications:** sonner

### Backend
- **Runtime:** Node.js, Express
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Authentication:** JWT (jsonwebtoken, bcrypt)
- **Validation:** Zod
- **Hot Reload:** tsx watch

### Deployment
- **Frontend:** Netlify (via @netlify/plugin-nextjs)
- **Backend:** Standalone Node.js process

---

## Architecture Overview

The application follows a modular monolith architecture. The backend is organized into self-contained modules, each responsible for a specific domain. An auto-loading mechanism in the Express server discovers and mounts route files at startup, eliminating the need to register new modules in a central file.

### Project Structure

```
transitops/
  app/                          # Next.js frontend pages
    analytics/                  # Reports & analytics page
    dashboard/                  # Operations dashboard page
    drivers/                    # Driver management page
    fleet/                      # Vehicle management page
    fuel/                       # Fuel & expenses page
    login/                      # Authentication page
    maintenance/                # Maintenance records page
    settings/                   # Platform configuration page
    signup/                     # User registration page
    trips/                      # Trip dispatcher page
    layout.tsx                  # Root layout
    globals.css                 # Global styles and design tokens
  components/                   # Shared React components
    ui/                         # shadcn/ui primitives
    AppLayout.tsx               # Authenticated layout wrapper
    Header.tsx                  # Top navigation bar
    Sidebar.tsx                 # Role-filtered sidebar navigation
    StatusBadge.tsx             # Color-coded status indicator
  lib/                          # Shared utilities and data layer
    api.ts                      # Backend API client
    app-context.tsx             # React Context state management
    mappers.ts                  # Data transformation layer
    mock-data.ts                # Seed data for development
    types.ts                    # TypeScript type definitions and RBAC matrix
    utils.ts                    # Utility functions (cn)
  hooks/                        # Custom React hooks
  backend/
    prisma/schema.prisma        # Database schema definition
    src/
      index.ts                  # Express server with route auto-discovery
      db/
        prisma/client.ts        # Prisma client singleton
        seed.ts                 # Database seed script
      middleware/auth.ts        # JWT authentication and role middleware
      utils/
        apiResponse.ts          # Standardized response helpers
        errors.ts               # Custom error classes
      modules/
        auth/                   # Authentication (register, login, logout)
        users/                  # User profile management
        vehicles/               # Vehicle CRUD operations
        drivers/                # Driver CRUD operations
        trips/                  # Trip lifecycle management
        maintenance/            # Maintenance record management
        fuel-expenses/          # Fuel log and expense management
        dashboard/              # Dashboard KPI aggregation
        analytics/              # Analytics and report generation
```

### Module Convention

Each backend module follows a consistent four-file structure:

```
modules/<name>/
  <name>.routes.ts             # Route definitions with role guards
  <name>.controller.ts         # Request handlers with validation
  <name>.service.ts            # Business logic and Prisma queries
  <name>.schema.ts             # Zod validation schemas and type exports
```

The auto-loading mechanism in `index.ts` scans the `modules/` directory at startup and mounts each module's routes at `/api/<module-name>`. No manual route registration is required when adding new modules.

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL database (or a hosted instance on Neon, Supabase, or Railway)
- npm

### Environment Setup

Create a `.env` file in the `backend/` directory:

```
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
JWT_SECRET=<your-jwt-secret>
PORT=3001
```

Optional - configure the frontend API URL by creating a `.env.local` in the project root:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..
npm install
```

### Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push

# (Optional) Seed the database with demo data
npx tsx src/db/seed.ts
```

### Running the Application

Start the backend server:

```bash
cd backend
npm run dev
```

The API server starts at `http://localhost:3001`. Health check available at `http://localhost:3001/api/health`.

In a separate terminal, start the frontend:

```bash
npm run dev
```

The frontend starts at `http://localhost:3000`.

### Demo Credentials

After seeding the database, the following accounts are available:

| Email | Password | Role |
|---|---|---|
| demo@transitops.com | demo | Dispatcher |
| manager@transitops.com | password123 | Fleet Manager |
| dispatch@transitops.com | password123 | Dispatcher |
| safety@transitops.com | password123 | Safety Officer |
| finance@transitops.com | password123 | Financial Analyst |

---

## API Reference

All API responses follow a consistent format:

- Success: `{ "success": true, "data": <payload> }`
- Error: `{ "success": false, "error": { "message": string, "code": string } }`

Protected routes require an `Authorization: Bearer <token>` header. Tokens are obtained from the login endpoint and expire after 24 hours.

### Authentication

Base path: `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Create a new account. Returns JWT token and user data. |
| POST | /api/auth/login | No | Authenticate with email and password. Returns JWT token. |
| POST | /api/auth/logout | No | Server-side logout confirmation. Token should be discarded client-side. |

Login enforces account lockout after 5 failed attempts. Locked accounts are inaccessible for 15 minutes.

### Users

Base path: `/api/users`

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | /api/users/me | Yes | Any authenticated user | Get current user profile. |
| PATCH | /api/users/me | Yes | Any authenticated user | Update own display name. |

### Vehicles

Base path: `/api/vehicles`

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | /api/vehicles | Yes | Fleet Manager, Dispatcher, Financial Analyst | List vehicles. Supports `?search=`, `?type=`, `?status=`, `?region=` query params. |
| GET | /api/vehicles/available | Yes | Fleet Manager, Dispatcher, Financial Analyst | List available vehicles for trip dispatch dropdown. |
| GET | /api/vehicles/:id | Yes | Fleet Manager, Dispatcher, Financial Analyst | Get single vehicle details. |
| POST | /api/vehicles | Yes | Fleet Manager | Create a new vehicle. Registration number must be unique. |
| PATCH | /api/vehicles/:id | Yes | Fleet Manager | Update vehicle fields. |
| DELETE | /api/vehicles/:id | Yes | Fleet Manager | Delete a vehicle. Blocked if vehicle has associated trips, maintenance records, or fuel logs. |

Vehicle status values: `AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`.

### Drivers

Base path: `/api/drivers`

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | /api/drivers | Yes | Safety Officer, Fleet Manager, Dispatcher | List drivers. Supports `?search=`, `?status=` query params. Returns `licenseExpired` boolean. |
| GET | /api/drivers/available | Yes | Safety Officer, Fleet Manager, Dispatcher | List available drivers with valid licenses for trip dispatch dropdown. |
| GET | /api/drivers/:id | Yes | Safety Officer, Fleet Manager, Dispatcher | Get single driver details. |
| POST | /api/drivers | Yes | Safety Officer | Create a new driver. License number must be unique. |
| PATCH | /api/drivers/:id | Yes | Safety Officer | Update driver fields. |
| DELETE | /api/drivers/:id | Yes | Safety Officer | Delete a driver. Blocked if driver has associated trips. |

Driver status values: `AVAILABLE`, `ON_TRIP`, `OFF_DUTY`, `SUSPENDED`.

### Trips

Base path: `/api/trips`

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | /api/trips | Yes | Dispatcher, Fleet Manager, Safety Officer | List trips with vehicle and driver details. Supports `?status=` filter. Sorted by creation date descending. |
| GET | /api/trips/:id | Yes | Dispatcher, Fleet Manager, Safety Officer | Get single trip with expenses. |
| POST | /api/trips | Yes | Dispatcher | Create a new trip in DRAFT status. Vehicle and driver assignment is optional at this stage. |
| PATCH | /api/trips/:id/dispatch | Yes | Dispatcher | Validate and dispatch a trip. Requires vehicleId and driverId. Validation order: vehicle availability, driver availability and license validity, cargo capacity. Returns specific error codes for each failure mode. Uses atomic transaction to update trip, vehicle, and driver status. |
| PATCH | /api/trips/:id/complete | Yes | Dispatcher | Complete a dispatched trip. Accepts actualDistanceKm, finalOdometer, optional fuelConsumedLiters (creates a fuel log entry), and optional revenue. Uses atomic transaction. |
| PATCH | /api/trips/:id/cancel | Yes | Dispatcher | Cancel a trip from DRAFT or DISPATCHED status. Restores vehicle and driver availability if the trip was dispatched. |
| DELETE | /api/trips/:id | Yes | Dispatcher | Delete a trip. Only allowed for DRAFT trips. |

Trip dispatch validation error codes: `VEHICLE_NOT_AVAILABLE` (409), `DRIVER_NOT_AVAILABLE` (409), `CAPACITY_EXCEEDED` (409 with exact overage), `INVALID_TRIP_STATUS` (409).

### Maintenance

Base path: `/api/maintenance`

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | /api/maintenance | Yes | Fleet Manager, Financial Analyst | List maintenance records. Supports `?vehicleId=`, `?status=` query params. |
| POST | /api/maintenance | Yes | Fleet Manager | Create a maintenance record. If status is ACTIVE, automatically transitions the vehicle to IN_SHOP in an atomic transaction. |
| PATCH | /api/maintenance/:id | Yes | Fleet Manager | Update a maintenance record. Closing from ACTIVE to COMPLETED restores the vehicle to AVAILABLE. Blocked if the vehicle is currently ON_TRIP. |
| DELETE | /api/maintenance/:id | Yes | Fleet Manager | Delete a completed maintenance record. Active records cannot be deleted. |

Maintenance status values: `ACTIVE`, `COMPLETED`.

### Fuel & Expenses

Base path: `/api/fuel-expenses`

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | /api/fuel-expenses/fuel-logs | Yes | Financial Analyst, Fleet Manager | List fuel logs. Supports `?vehicleId=` filter. |
| POST | /api/fuel-expenses/fuel-logs | Yes | Financial Analyst | Record a fuel purchase. |
| GET | /api/fuel-expenses/expenses | Yes | Financial Analyst, Fleet Manager | List expenses. Supports `?vehicleId=` filter. |
| POST | /api/fuel-expenses/expenses | Yes | Financial Analyst | Record a trip expense (toll, miscellaneous). |
| GET | /api/fuel-expenses/operational-cost | Yes | Financial Analyst, Fleet Manager | Get fleet-wide operational cost summary (fuel + maintenance + expenses). |
| GET | /api/fuel-expenses/operational-cost/:vehicleId | Yes | Financial Analyst, Fleet Manager | Get operational cost for a specific vehicle. |

### Dashboard

Base path: `/api/dashboard`

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | /api/dashboard/kpis | Yes | All authenticated roles | Get KPI data. Supports `?vehicleType=`, `?status=`, `?region=` filters. Returns role-filtered response (each role sees only their permitted metrics). |
| GET | /api/dashboard/recent-trips | Yes | Dispatcher, Fleet Manager, Safety Officer | Get the 10 most recent trips with vehicle and driver details. |
| GET | /api/dashboard/vehicle-status-breakdown | Yes | Fleet Manager | Get vehicle counts grouped by status. |

Dashboard KPI response includes: activeVehicles, availableVehicles, vehiclesInMaintenance, activeTrips, pendingTrips, driversOnDuty, fleetUtilizationPct (ON_TRIP vehicles as a percentage of non-retired fleet, rounded to 1 decimal place).

### Analytics

Base path: `/api/analytics`

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| GET | /api/analytics/summary | Yes | All authenticated roles | Get analytical summary. Returns role-filtered response. |
| GET | /api/analytics/monthly-revenue | Yes | Fleet Manager, Financial Analyst | Get monthly revenue for the last 6 months from completed trips. |
| GET | /api/analytics/top-costly-vehicles | Yes | Fleet Manager, Financial Analyst | Get the top 5 costliest vehicles ranked by total costs (fuel + maintenance + expenses). |
| GET | /api/analytics/export/csv | Yes | Fleet Manager, Financial Analyst | Download a CSV report of all trips with associated costs. Sets appropriate Content-Type and Content-Disposition headers. |

Analytics summary metrics:
- `fuelEfficiencyKmPerL` - Total completed trip distance divided by total fuel liters consumed.
- `fleetUtilizationPct` - Active vehicles as a percentage of non-retired fleet.
- `operationalCost` - Sum of all fuel, maintenance, and expense costs across the fleet.
- `vehicleRoiPct` - Average vehicle ROI calculated as (revenue minus maintenance and fuel costs) divided by acquisition cost, multiplied by 100.

---

## Role-Based Access Control

The platform defines four roles, each with specific permissions across modules:

| Module | Fleet Manager | Dispatcher | Safety Officer | Financial Analyst |
|---|---|---|---|---|
| Fleet | Full access | View only | No access | View only |
| Drivers | Full access | No access | Full access | No access |
| Trips | No access | Full access | View only | No access |
| Fuel & Expenses | No access | No access | No access | Full access |
| Maintenance | Full access | No access | No access | View only |
| Analytics | Full access | No access | No access | Full access |
| Dashboard | Full KPIs | Trip/Dispatch KPIs | Driver/Vehicle KPIs | Utilization only |

RBAC is enforced at two levels:
1. **Route level** - The `requireRole` middleware blocks requests to endpoints the user's role cannot access.
2. **Data level** - Dashboard and Analytics endpoints return role-filtered response payloads, showing only the metrics relevant to each role.

---

## Database Schema

The database consists of 7 models connected through foreign key relationships.

### Enums

- `Role` - FLEET_MANAGER, DISPATCHER, SAFETY_OFFICER, FINANCIAL_ANALYST
- `VehicleStatus` - AVAILABLE, ON_TRIP, IN_SHOP, RETIRED
- `DriverStatus` - AVAILABLE, ON_TRIP, OFF_DUTY, SUSPENDED
- `TripStatus` - DRAFT, DISPATCHED, COMPLETED, CANCELLED
- `MaintenanceStatus` - ACTIVE, COMPLETED

### Models

- **User** - User accounts with hashed passwords, role assignment, and login attempt tracking for account lockout.
- **Vehicle** - Fleet vehicles with registration number (unique), type, capacity, odometer, acquisition cost, optional region, and status lifecycle.
- **Driver** - Driver profiles with license number (unique), license category and expiry date, contact information, safety score, and status.
- **Trip** - Trip records with source/destination, cargo weight, planned and actual distance, revenue, and complete lifecycle status tracking with timestamps. Linked to a vehicle and optionally a driver.
- **MaintenanceRecord** - Service records linked to a vehicle with service type, cost, date, and status.
- **FuelLog** - Fuel purchase records linked to a vehicle and optionally to a trip.
- **Expense** - Trip expenses (toll, miscellaneous) linked to both a trip and a vehicle.

Relationships are enforced with foreign keys and the `Restrict` delete behavior to prevent accidental deletion of referenced data.

---

## Development Guidelines

### Module Independence

Modules are designed to be self-contained. When a module needs data from another module's domain (for example, the Analytics module computing costs from fuel logs and maintenance records), it queries the database directly through Prisma rather than importing from another module's service layer. This prevents circular dependencies and merge conflicts when multiple developers work on separate modules simultaneously.

### Route Auto-Discovery

The Express server automatically discovers and mounts route files at startup. To add a new module:
1. Create a new directory under `backend/src/modules/<name>/`.
2. Add a `<name>.routes.ts` file that exports a default Express Router.
3. Restart the server. The routes are automatically mounted at `/api/<name>/`.

No changes to `index.ts` or any other configuration file are needed.

### Error Handling Pattern

All controllers follow the same error handling pattern:

```typescript
try {
  // Business logic
  return sendSuccess(res, data);
} catch (err) {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.code, err.statusCode);
  }
  next(err);
}
```

Custom errors (NotFoundError, ConflictError, UnauthorizedError) extend AppError and include machine-readable error codes for programmatic handling on the frontend.

---

## Running Tests

```bash
# TypeScript type checking
cd backend && npx tsc --noEmit

# Frontend linting
npm run lint
```

---

## Deployment

The frontend is configured for Netlify deployment via `netlify.toml`. The backend can be deployed as a standalone Node.js process.

```bash
# Build the frontend
npm run build

# Build the backend
cd backend && npm run build
```
