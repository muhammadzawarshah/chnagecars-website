# Superadmin console

The website console at `/dashboard/super-admin` requires `API_URL` and an authenticated `SUPER_ADMIN` account. It does not fall back to sample data. This extracted frontend exposes only superadmin and authentication routes; dealer view-as screens remain protected by the superadmin session.

## Screens

- Overview and dealer comparison use the existing authenticated website adapter.
- Dealers: server pagination, search/status filters, documents and branches, approve/reject/suspend, plan changes, and opening a dealer dashboard with an audit event.
- Listings: server pagination, review/status filters, approve/reject/publish/suspend/restore/relist/archive, price/colour/description corrections, featured/special flags. The existing lifecycle service validates all transitions and commercial edits.
- Staff and customers: invitations, status and role changes. Existing self-management and session-revocation rules are enforced by the backend.
- Leads: pagination, contact history, dealer-team assignment and stage updates through the existing CRM service. Assignment scope is derived from the lead's dealer, and the actual superadmin remains the actor.
- Catalogue: make, model, variant and category management. Inactivation preserves existing references.
- Content: draft article/page creation, publish/archive, FAQ editing, promotion creation and active status.
- Data quality: missing coordinates/images/colours, nonpositive prices, colour counts, potential duplicate dealer stock numbers and latest affected listings. This is a diagnostic screen; it does not automatically rewrite inventory.
- Imports: inventory with feed source data, image-processing counts and failed background events. Import-run history is not currently recorded, and a vehicle's update time is not presented as a feed-sync time.
- Snapshots: current manifest, checksum, history and explicit refresh. Existing content-addressed immutable download files remain unchanged.
- Reports: platform statistics and paginated CSV downloads (up to 100 rows per export). Spreadsheet formulas are neutralized and responses are private/non-cacheable.
- Audit: paginated actor/action/entity/time and before/after values; search accepts an action prefix.
- Background processing: queue status, pending age and retrying dead events through the existing audited admin API.
- Settings: explicit read-only allowlist of deployment-managed settings. Secrets, connection strings and storage/mail credentials are excluded. Notification templates, billing and feed scheduling need dedicated domain support before they can be edited in the console.

## Compatibility

The new backend routes are isolated under `/api/v1/admin/console` and require `SUPER_ADMIN`. Existing public/mobile API controllers, DTOs, vehicle pagination/order, filters, location fields, document APIs, and snapshot schemas have not been changed. The console adds no extra migrations beyond the included backend schema migrations. Adding a console screen does not change inventory; only an explicit management action calls an existing audited domain mutation.

Deploy backend before frontend because the new screens depend on the new admin-only routes. Configure the website's `API_URL` to the backend `/api/v1` base. Existing app developers do not need to update their clients.

## Validation

Backend tests cover console route role restrictions, credential exclusion, immutable snapshot refresh, and preserving the real admin identity in CRM operations. Existing vehicle/search/snapshot tests are also run. Frontend TypeScript and lint checks cover the new screens and actions; CSV escaping and spreadsheet formula checks are verified separately. The extracted frontend uses system fonts so its production build does not need Google Fonts downloads.
