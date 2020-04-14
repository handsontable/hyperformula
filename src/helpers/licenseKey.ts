/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

// @ts-nocheck
const consoleMessages = {
  invalid: () => 'The license key for HyperFormula is invalid.',
  expired: ({ keyValidityDate }) => 'The license key for HyperFormula expired' +
    ` on ${keyValidityDate}, and is not valid for the installed version.`,
  missing: () => 'The license key for HyperFormula is missing.',
}

let _notified = false

export function checkLicenseKeyValidity(licenseKey: string) {
  const messageDescriptor = {
    template: 'missing',
    args: {},
  }

  if (licenseKey === 'non-commercial-and-evaluation' || licenseKey === 'agpl-v3') {
    messageDescriptor.template = 'valid'

  } else if (typeof licenseKey === 'string' && _checkKeySchema(licenseKey)) {
    const [day, month, year] = process.env.HT_RELEASE_DATE.split('/')
    const releaseDays = Math.floor(new Date(`${month}/${day}/${year}`).getTime() / 8.64e7)
    const keyValidityDays = _extractTime(licenseKey)

    messageDescriptor.args.keyValidityDate = new Date((keyValidityDays + 1) * 8.64e7).toISOString()

    if (releaseDays > keyValidityDays) {
      messageDescriptor.template = 'expired'
    } else {
      messageDescriptor.template = 'valid'
    }

  } else if (licenseKey !== '') {
    messageDescriptor.template = 'invalid'
  }

  if (!_notified && messageDescriptor.template !== 'valid') {
    console.warn(consoleMessages[messageDescriptor.template](messageDescriptor.args))
    _notified = true
  }
}

/* eslint-disable */
const _rl='\x6C\x65\x6E\x67\x74\x68'
const _hd=(v)=>parseInt(v,16)
const _pi=(v)=>parseInt(v,10)
const _nm=(v)=>(v+'').replace(/\-/g,'')
const _ss=(v,s,l)=>v['\x73\x75\x62\x73\x74\x72'](s,l)
const _cp=(v)=>v['\x63\x6F\x64\x65\x50\x6F\x69\x6E\x74\x41\x74'](0)-65
function _extractTime(v) {return _nm(v)[_rl]===(50>>1)?_hd(_ss(_nm(v),_hd('12'),_cp('\x46')))/(_hd(_ss(_nm(v),_cp('C'),_cp('\x59')>>4))||((~~![][_rl])<<3)+1):0}
function _checkKeySchema(v) {
  v=(v+'').replace(/\-/g,'')
  if(v[_rl]!==_cp('\x5A')){return false}
  let sp=0;return [[0,_cp('\x47')+1],[_cp('\x48'),_cp('\x48')-1],[_cp('G')+_cp('H'),_cp('\x47')]].reduce((e,[a,b],c)=>{
    e|=(_pi(`${_pi(_hd(_ss(v,...[sp+a-(c===(3>>2)?0:2),b+(!c?0:2)]))+(_hd(_ss(v,...[sp+a+b,2]))+[]).padStart(2,'0'))}`)%97||2)>>1;sp+=2;return e
  },_cp('A'))===([]+1>>1)
}
/* eslint-enable */
