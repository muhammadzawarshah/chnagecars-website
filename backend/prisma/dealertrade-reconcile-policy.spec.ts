import { test } from 'node:test';
import assert from 'node:assert/strict';
import { empty,mergeProvided,integer,sourceVehicleAttributes,stockMetadata,sameSource,sameSourceData,withoutVolatile } from './dealertrade-reconcile-policy';
test('null, absent, whitespace and empty collections cannot wipe existing data',()=>{
  for(const value of [undefined,null,'','  ',[],{}])assert.deepEqual(mergeProvided({retained:'value'},value),{retained:'value'});
});
test('valid zero mileage and false flags replace previous values',()=>{
  assert.deepEqual(mergeProvided({mileage:500,featured:true},{mileage:0,featured:false}),{mileage:0,featured:false});
  assert.equal(empty(0),false);assert.equal(empty(false),false);assert.equal(integer(0),0);
});
test('partial API objects preserve nested missing values without mutating the baseline',()=>{
  const before={dealer:{email:'old@example.com',phone:'123'},photos:['old.jpg'],year:2025};
  assert.deepEqual(mergeProvided(before,{dealer:{email:null,phone:'456'},photos:[]}),{dealer:{email:'old@example.com',phone:'456'},photos:['old.jpg'],year:2025});
  assert.equal(before.dealer.phone,'123');
});
test('nonempty source arrays replace the previous collection exactly',()=>{
  assert.deepEqual(mergeProvided(['old.jpg','stale.jpg'],['new.jpg']),['new.jpg']);
});
test('empty, invalid and fractional input cannot be silently converted to integer zero',()=>{
  for(const value of [null,undefined,'',' ',NaN,'bad',1.5,-1,false,true])assert.equal(integer(value),undefined);
  assert.equal(integer('1200'),1200);
});

test('stock model years and fuel IDs populate new and existing vehicle columns',()=>{
  assert.deepEqual(sourceVehicleAttributes({model_year:2026,fuel_type_id:2}),{year:2026,fuelType:'DIESEL'});
  assert.deepEqual(sourceVehicleAttributes({year:'2024',fuel_type_id:3}),{year:2024,fuelType:'ELECTRIC'});
  assert.deepEqual(sourceVehicleAttributes({model_year:2025,year:2020,fuel_type_id:99}),{year:2025,fuelType:'OTHER'});
});
test('missing or invalid source years and blank fuel IDs preserve current values',()=>{
  for(const value of [null,'',0,1899,2101,2024.5,'bad'])
    assert.deepEqual(sourceVehicleAttributes({model_year:value,fuel_type_id:null}),{});
});

test('source stock metadata preserves extra fields and distinct upstream counts',()=>{
  assert.deepEqual(stockMetadata({stockMeta:{total_stock_count:0,last_updated:'2026-10-27 09:14:20',new_field:42},finalGlobalTotal:10}),
    {meta:{total_stock_count:0,last_updated:'2026-10-27 09:14:20',new_field:42},total:10});
  assert.equal(stockMetadata({finalGlobalTotal:10}),undefined);
});

test('a DealerTrade updated_at re-stamp alone is not a change',()=>{
  const row={vehicle_id:1,price:100,updated_at:'2026-10-27 08:01:12'};
  assert.equal(sameSource(row,{...row,updated_at:'2026-10-28 14:17:11'}),true);
  assert.equal(sameSource(row,{...row,price:90,updated_at:'2026-10-28 14:17:11'}),false);
  assert.equal(sameSource(row,{...row,photos:['a.jpg']}),false);
  assert.deepEqual(withoutVolatile(row),{vehicle_id:1,price:100});
  const data={vehicle_id:'1',dealertrade:row};
  assert.equal(sameSourceData(data,{...data,dealertrade:{...row,updated_at:'2026-10-28 14:17:11'}}),true);
  assert.equal(sameSourceData(data,{...data,dealertrade:{...row,mileage:5289}}),false);
  assert.equal(sameSourceData(data,{...data,vehicle_id:'2'}),false);
});
