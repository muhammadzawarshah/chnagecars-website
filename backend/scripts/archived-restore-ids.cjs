const { createHash } = require('node:crypto');
function legacyUuid(key) {
 const h=createHash('sha256').update(`changecars-fbook:${key}`).digest('hex');
 return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;
}
/** Old archived backups remain immutable; translate identity strings in memory for the new text-key schema. */
async function archivedRestoreIds(db, sql) {
 const migrated=(await db.query(`SELECT data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='id'`)).rows[0]?.data_type==='text';
 if(!migrated)return sql;
 const aliases=new Map((await db.query(`SELECT "legacyId","sourceId" FROM dealertrade_id_aliases`)).rows.map(row=>[row.legacyId,row.sourceId]));
 const snapshots=(await db.query(`SELECT kind,"externalId" FROM source_feed_records WHERE source='dealertrade' AND kind IN('dealer','vehicle')`)).rows;
 for(const row of snapshots)if(/^\d+$/.test(row.externalId))aliases.set(legacyUuid(`${row.kind}:${row.externalId}`),row.externalId);
 return sql.replace(/"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/gi,(match,id)=>aliases.has(id)?JSON.stringify(aliases.get(id)):match);
}
module.exports={archivedRestoreIds};
