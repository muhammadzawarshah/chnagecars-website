# Dealer WhatsApp number

Public responses include nullable `whatsappNumber`:

- `GET /api/v1/dealers`: each dealer row.
- `GET /api/v1/dealers/{id-or-slug}`: top-level field.
- `GET /api/v1/vehicles` and `GET /api/v1/vehicles/{id-or-slug}`: `dealer.whatsappNumber`.
- `GET /api/v1/web/cars/{id}`: `dealer.whatsappNumber`.

The value comes from DealerTrade `whatsapp_number`. Empty/missing values return `null`; telephone is not used as a substitute. No other private source fields are exposed.

Dealer numbers are preserved in `source_feed_records.payload.whatsapp_number` and `vehicles.sourceData.dealertradeDealer.whatsapp_number`. No schema migration is required. The existing full DealerTrade importer retains complete dealer payloads on future imports.

The explicit local-only refresh command is `node backend/scripts/sync-dealertrade-whatsapp.cjs --apply`; without `--apply`, it captures a plan without DB changes. It backs up previous WhatsApp values before modifying them and updates only existing local dealer identities. It does not import new dealers or update other business fields.

Deploy the updated backend and supply the refreshed dealer data. Older database dumps do not contain these WhatsApp numbers. Existing vehicle response caches can retain older responses until their TTL expires (detail cache: five minutes).
