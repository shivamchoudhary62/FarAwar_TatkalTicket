# Member 2 — Tatkal Ticket Verified Booking Module
## Integration Handoff Documentation

This document details the responsibilities and exact steps required by **Member 2 (Tatkal Module Developer)** and **Member 1 (Core Platform Developer)** to integrate the Tatkal ecosystem into the main RailSaathi platform.

---

## 📋 Responsibilities Matrix: Who Does What

### 🛠️ Member 2 (Tatkal Developer — Your Action Items Before Handoff)
Before initiating the handoff to Member 1, ensure that the following checklist is fully completed and verified in your local environment:
- [ ] **Database Schema**: Verify that both SQL migrations `supabase/migrations/002_tatkal.sql` and `supabase/migrations/0022_overlap_lock.sql` have been committed and applied in the local development database.
- [ ] **Line-Limit Compliance**: Confirm that every file under your responsibility is strictly **under 300 lines of code** (split sub-routers/components where necessary).
- [ ] **Routes & Controllers**: Verify that all Tatkal route handlers and logic are placed under the designated sub-routers:
  - `services/api/src/routes/tatkal.js` (main entry, prefill, fire request)
  - `services/api/src/routes/tatkal-requests.js` (my-requests, cancel, get-by-id, my-locks)
  - `services/api/src/routes/tatkal-surrenders.js` (surrender market endpoints)
- [ ] **Pure Logic Separation**: Ensure that business logic such as `calculateUrgencyScore` and overlap validation reside purely in `services/api/src/services/tatkal-service.js`.
- [ ] **No Hardcoded API base URLs**: Ensure that all mobile app files (e.g., `tatkalService.js`) reference the standard global `API_BASE_URL` from the main app client, rather than hardcoded `http://localhost:3000` or `127.0.0.1` strings.
- [ ] **No Hardcoded Credentials**: Double-check that no `.env` values, API tokens, or secrets are hardcoded in any routes, service files, or screens.
- [ ] **Mock Context Clean-up**: Ensure that all React Native screens utilize the `useRailSaathi()` context hook (if provided by Member 1) instead of hardcoded mock user states for production flows.
- [ ] **Manual Testing**: Execute `services/api/scripts/test-tatkal.sh` and ensure all integration tests (anti-hoarding, account holder check, journey overlap locks, fire simulation, and surrender market) pass successfully.

### 🔌 Member 1 (Core Platform Developer — Integration Steps)
To merge the Tatkal booking module into the main branch, Member 1 must execute the following actions:
- [ ] **Apply Migrations**: Execute the SQL files `002_tatkal.sql` and `0022_overlap_lock.sql` inside the Supabase SQL editor.
- [ ] **Register Routes**: Add the Tatkal base router registration middleware inside `services/api/src/index.js`.
- [ ] **Initialize Scheduled Daemon**: Mount and run the Tatkal fire scheduling background daemon inside `services/api/src/index.js`.
- [ ] **Add Navigation Links**: Add the Tatkal stack screens and wire the main menu tab to point to the `TatkalStackNavigator` in the mobile application navigation files.
- [ ] **Verify Environment Configuration**: Ensure the backend `.env` file contains the database URL and correct credentials.

---

## 💾 1. Database Schema Configuration
Execute the following migration scripts in order inside the Supabase SQL editor:

1. **Table Creation & Policies**: Apply [supabase/migrations/002_tatkal.sql](file:///supabase/migrations/002_tatkal.sql).
   * Creates the `tatkal_requests` and `tatkal_surrenders` tables.
   * Configures row-level security (RLS) policies allowing users to access only their requests.
   * Sets up the database-level index `idx_tatkal_one_per_day` enforcing the **anti-hoarding constraint** (one request per user per booking date per train).
2. **Journey Overlap Locks**: Apply [supabase/migrations/0022_overlap_lock.sql](file:///supabase/migrations/0022_overlap_lock.sql).
   * Adds `departure_datetime` and `arrival_datetime` columns to `tatkal_requests`.
   * Creates the `tatkal_journey_locks` table to prevent passengers on a PNR from booking overlapping journeys.

---

## 🌐 2. Backend Routing Integration (`services/api/src/index.js`)

Member 1 must open the main API server entry point at `services/api/src/index.js` and add the route registration middleware in the routing section (near other sub-routes like `/api/journeys` or `/api/auth`):

```javascript
// Register Tatkal assistant route handlers (mounts sub-routers dynamically)
app.use('/api/tatkal', require('./routes/tatkal'));
```

*Note: `tatkal.js` automatically manages and mounts the split sub-routers (`tatkal-requests` and `tatkal-surrenders`) to ensure clean code modularization and strict file size compliance.*

---

## ⏰ 3. Background Fire Daemon Hook (`services/api/src/index.js`)

Open `services/api/src/index.js` and import and start the background fire polling daemon to automate ticket submission simulation:

```javascript
// Start the scheduled job for firing booking requests at their target time windows
require('./jobs/tatkalFireJob').start();
```

---

## 📱 4. Mobile Navigation Integration (`apps/mobile/src/navigation/AppNavigator.js`)

In the React Native app navigator file (typically `apps/mobile/src/navigation/AppNavigator.js` or `MainTabNavigator.js`), integrate the Tatkal screens and navigation bindings:

```javascript
// 1. Import screen components from the tatkal module directory
import TatkalHomeScreen from '../screens/tatkal/TatkalHomeScreen';
import PreFillFormScreen from '../screens/tatkal/PreFillFormScreen';
import CountdownScreen from '../screens/tatkal/CountdownScreen';
import ConfirmationScreen from '../screens/tatkal/ConfirmationScreen';
import SurrenderMarketScreen from '../screens/tatkal/SurrenderMarketScreen';

// 2. Instantiate Tatkal Stack Navigator
const TatkalStack = createStackNavigator();

function TatkalStackNavigator() {
  return (
    <TatkalStack.Navigator screenOptions={{ headerShown: false }}>
      <TatkalStack.Screen name="TatkalHomeScreen" component={TatkalHomeScreen} />
      <TatkalStack.Screen name="PreFillFormScreen" component={PreFillFormScreen} />
      <TatkalStack.Screen name="CountdownScreen" component={CountdownScreen} />
      <TatkalStack.Screen name="ConfirmationScreen" component={ConfirmationScreen} />
      <TatkalStack.Screen name="SurrenderMarketScreen" component={SurrenderMarketScreen} />
    </TatkalStack.Navigator>
  );
}

// 3. Mount TatkalStackNavigator inside MainTabNavigator/App Tab Navigator
<Tab.Screen
  name="Tatkal"
  component={TatkalStackNavigator}
  options={{
    title: 'Tatkal Assist',
    tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />, // Use standard clock icon
  }}
/>
```

---

## ⚙️ 5. Environment Variables Setup

Verify that the local backend API `.env` config contains the following keys, which are shared across all database client initializations:
```env
SUPABASE_URL="your_supabase_project_url"
SUPABASE_SERVICE_KEY="your_supabase_service_role_key"
```

---

## 🔍 6. Integration Testing & Verification
After Member 1 integrates the routes, job, and database schema, the entire integration can be verified using the test suite:
1. Seed the DB: `node services/api/scripts/seed-tatkal.js`
2. Run tests: `./services/api/scripts/test-tatkal.sh`
