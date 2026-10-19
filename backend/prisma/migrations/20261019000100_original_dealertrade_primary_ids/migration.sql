-- Original DealerTrade IDs become the actual primary keys. Internal non-feed records retain their IDs.
BEGIN;
LOCK TABLE vehicles, dealers IN ACCESS EXCLUSIVE MODE;
CREATE TEMP TABLE dt_vehicle_map ON COMMIT DROP AS
 SELECT id::text old_id, "sourceData"->'dealertrade'->>'vehicle_id' new_id
 FROM vehicles WHERE "sourceData"->'dealertrade'->>'vehicle_id' IS NOT NULL;
CREATE TEMP TABLE dt_dealer_map (old_id text PRIMARY KEY,new_id text UNIQUE) ON COMMIT DROP;
INSERT INTO dt_dealer_map
 SELECT "dealerId"::text, min("sourceData"->'dealertrade'->>'dealer_id') FROM vehicles
 WHERE "sourceData"->'dealertrade'->>'dealer_id' IS NOT NULL GROUP BY "dealerId";
-- Dealers without inventory still use their exact verified feed ID, matched to the importer's namespace.
INSERT INTO dt_dealer_map
 SELECT d.id::text,s.source_id FROM dealers d JOIN (
 SELECT payload->>'dealer_id' source_id,encode(sha256(convert_to('changecars-fbook:dealer:'||(payload->>'dealer_id'),'UTF8')),'hex') h
 FROM source_feed_records WHERE source='dealertrade' AND kind='dealer'
 ) s ON d.id::text=substring(h,1,8)||'-'||substring(h,9,4)||'-5'||substring(h,14,3)||'-a'||substring(h,18,3)||'-'||substring(h,21,12)
 ON CONFLICT DO NOTHING;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM dt_vehicle_map WHERE new_id !~ '^[0-9]+$') OR EXISTS(SELECT new_id FROM dt_vehicle_map GROUP BY new_id HAVING count(*)>1)
 OR EXISTS(SELECT 1 FROM dt_dealer_map WHERE new_id !~ '^[0-9]+$') THEN RAISE EXCEPTION 'Invalid/duplicate original DealerTrade IDs'; END IF;
 IF EXISTS(SELECT 1 FROM vehicles GROUP BY "dealerId" HAVING count(DISTINCT "sourceData"->'dealertrade'->>'dealer_id')>1) THEN RAISE EXCEPTION 'Conflicting source dealer links'; END IF;
END $$;
CREATE TEMP TABLE dt_vehicle_before ON COMMIT DROP AS SELECT m.new_id, md5((to_jsonb(v)-'id'-'dealerId')::text) fingerprint FROM vehicles v JOIN dt_vehicle_map m ON v.id::text=m.old_id;
CREATE TEMP TABLE dt_dealer_before ON COMMIT DROP AS SELECT m.new_id,md5((to_jsonb(d)-'id')::text) fingerprint FROM dealers d JOIN dt_dealer_map m ON d.id::text=m.old_id;
CREATE TABLE IF NOT EXISTS dealertrade_id_aliases (entity text NOT NULL,"legacyId" text NOT NULL,"sourceId" text NOT NULL,PRIMARY KEY(entity,"legacyId"));
INSERT INTO dealertrade_id_aliases SELECT 'vehicle',old_id,new_id FROM dt_vehicle_map WHERE old_id<>new_id ON CONFLICT DO NOTHING;
INSERT INTO dealertrade_id_aliases SELECT 'dealer',old_id,new_id FROM dt_dealer_map WHERE old_id<>new_id ON CONFLICT DO NOTHING;
CREATE TEMP TABLE dt_fks ON COMMIT DROP AS
 SELECT conrelid::regclass::text child,conname,pg_get_constraintdef(oid) definition,
 (SELECT attname FROM pg_attribute WHERE attrelid=conrelid AND attnum=conkey[1]) column_name
 FROM pg_constraint WHERE contype='f' AND confrelid IN ('vehicles'::regclass,'dealers'::regclass);
DROP INDEX IF EXISTS feature_assignments_unique_target;
DO $$ DECLARE r record; BEGIN
 FOR r IN SELECT * FROM dt_fks LOOP EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',r.child,r.conname); END LOOP;
 FOR r IN SELECT DISTINCT child,column_name FROM dt_fks LOOP
  EXECUTE format('ALTER TABLE %s ALTER COLUMN %I TYPE text USING %I::text',r.child,r.column_name,r.column_name);
 END LOOP;
 ALTER TABLE vehicles ALTER COLUMN id TYPE text USING id::text;
 ALTER TABLE dealers ALTER COLUMN id TYPE text USING id::text;
 FOR r IN SELECT * FROM dt_fks LOOP EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s',r.child,r.conname,r.definition); END LOOP;
END $$;
CREATE UNIQUE INDEX feature_assignments_unique_target ON feature_assignments ("featureId",COALESCE("makeId"::text,"modelId"::text,"generationId"::text,"variantId"::text,"vehicleId"));
-- Every existing FK uses ON UPDATE CASCADE, preserving all dependent records and associations.
UPDATE dealers d SET id=m.new_id FROM dt_dealer_map m WHERE d.id=m.old_id AND d.id<>m.new_id;
UPDATE vehicles v SET id=m.new_id FROM dt_vehicle_map m WHERE v.id=m.old_id AND v.id<>m.new_id;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM dt_vehicle_before b LEFT JOIN vehicles v ON v.id=b.new_id WHERE v.id IS NULL OR md5((to_jsonb(v)-'id'-'dealerId')::text)<>b.fingerprint)
 OR EXISTS(SELECT 1 FROM dt_dealer_before b LEFT JOIN dealers d ON d.id=b.new_id WHERE d.id IS NULL OR md5((to_jsonb(d)-'id')::text)<>b.fingerprint)
 THEN RAISE EXCEPTION 'Non-identity listing/dealer data changed; rolling back'; END IF;
 IF EXISTS(SELECT 1 FROM vehicles WHERE "sourceData"->'dealertrade'->>'vehicle_id' IS NOT NULL AND (id<>"sourceData"->'dealertrade'->>'vehicle_id' OR "dealerId"<>"sourceData"->'dealertrade'->>'dealer_id')) THEN RAISE EXCEPTION 'Source identities mismatch'; END IF;
END $$;
COMMIT;
