import { test } from 'node:test';
import assert from 'node:assert/strict';
import { empty,mergeProvided,integer } from './dealertrade-reconcile-policy';
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
