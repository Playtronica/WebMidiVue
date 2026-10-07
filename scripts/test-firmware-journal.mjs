import assert from 'node:assert/strict'
import {recordFirmwarePhase, exportFirmwareJournal} from '../src/biotron/telemetry.mjs'
const data = new Map()
globalThis.localStorage = {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)}
recordFirmwarePhase('writing','1.10.8','1.9.8')
assert.equal(exportFirmwareJournal()[0].phase,'writing')
recordFirmwarePhase('PRIVATE raw path','PRIVATE','PRIVATE')
assert.equal(exportFirmwareJournal().length,1)
for(let i=0;i<250;i++)recordFirmwarePhase('reconnecting','PRIVATE','1.9.8')
assert.equal(exportFirmwareJournal().length,200)
assert.equal(exportFirmwareJournal()[0].installed,null)
globalThis.localStorage.setItem=()=>{throw new Error('quota')}
assert.doesNotThrow(()=>recordFirmwarePhase('complete','1.9.8','1.9.8'))
console.log('Firmware journal PASS: bounded, version allowlist, invalid phase rejected, quota non-blocking')
