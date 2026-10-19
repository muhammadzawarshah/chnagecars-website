# Restore deleted archived vehicles

Local database only: `127.0.0.1:55432/changecars`.

On 19 October 2026, 1,543 archived vehicles were backed up and deleted. Archived remaining: **0**. Other vehicle rows changed: **0**. This is separate from the previous Fbook-only cleanup.

Backup directory (relative to the repository root):

`backend/.local/archived-backups/2026-10-19T05-16-16-882Z`

Files:

- `restore.sql`: archived vehicles and dependent records, keeping original IDs/names.
- `manifest.json`: table counts and SHA-256 checksum for the restore SQL.
- `full-before-delete.dump`: additional full database backup.
- `deletion-report.json`: deletion and restore-rehearsal results.
- `README.md`: restore instructions.

The backup contains 16,065 image records, 1,552 category associations, 9 status-history rows and 1 daily-view record, in addition to the vehicles. Image files themselves were left in place.

Restore only the deleted archived records, from the repository root:

```sh
node backend/scripts/backup-delete-archived.cjs --restore 'backend/.local/archived-backups/2026-10-19T05-16-16-882Z'
```

The restore command verifies the SQL checksum and runs transactionally. It preserves archived status, original IDs, source data and relationships. Existing conflicting vehicle IDs cause an error rather than overwrite current records. Keep the referenced dealers, catalogue records, image files and backup directory available.

Before deletion, the script rehearsed deleting and restoring the subset inside a database savepoint, compared every captured row, then rolled the rehearsal back. This passed. Only after that did it perform the actual deletion and verify every other vehicle row remained unchanged.

The backup directory is git-ignored; keep a separate copy if moving or cleaning this project. Restoring the full database dump is a separate recovery option and can replace data added after this backup. Use the subset restore command above when only these archived vehicles are needed.

## Compatibility after the original-ID migration

The restore script now translates saved legacy vehicle/dealer UUIDs to original DealerTrade IDs in memory when restoring into the updated text-key schema. Original backup files/checksums remain unchanged. Keep `archived-restore-ids.cjs`, the source feed snapshots and identity alias table available alongside the restore script.
