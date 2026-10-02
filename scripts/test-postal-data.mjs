/**
 * scripts/test-postal-data.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

const ASSETS_DIR = path.join(process.cwd(), 'assets', 'postal');
const COUNTRIES = ['pl', 'de', 'at', 'ch', 'cz', 'sk', 'ro', 'hr', 'rs', 'it', 'nl', 'be', 'es', 'fr', 'ua', 'lu'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

async function runTests() {
  let failCount = 0;
  
  function check(condition, msg) {
    try {
      assert(condition, msg);
    } catch (e) {
      console.error(`FAIL: ${msg}`);
      failCount++;
    }
  }

  console.log('1. Checking index.json...');
  const indexFile = path.join(ASSETS_DIR, 'index.json');
  const index = readJson(indexFile);
  check(index.countries, 'index.json has countries object');
  
  for (const cc of COUNTRIES) {
    const ccData = index.countries[cc];
    check(ccData, `index.json has country ${cc}`);
    if (ccData) {
      check(ccData.files > 0, `${cc} has > 0 files in index`);
      check(ccData.codes > 0, `${cc} has > 0 codes in index`);
      const dirPath = path.join(ASSETS_DIR, cc);
      const filesOnDisk = fs.readdirSync(dirPath).filter(f => f.endsWith('.json')).length;
      check(ccData.files === filesOnDisk, `${cc} files count matches disk (${ccData.files} vs ${filesOnDisk})`);
    }
  }

  console.log('2. Checking lookups...');
  const lookups = [
    { cc: 'pl', code: '44100', place: 'Gliwice' },
    { cc: 'pl', code: '00001', place: 'Warszawa' }, // Will fallback if not exactly matched
    { cc: 'de', code: '85570', place: 'Markt Schwaben' },
    { cc: 'at', code: '1010', place: 'Wien' },
    { cc: 'cz', code: '11000', place: 'Praha' },
    { cc: 'fr', code: '75001', place: 'Paris' },
    { cc: 'it', code: '00118', place: 'Roma' },
    { cc: 'nl', code: '1011', place: 'Amsterdam' },
    { cc: 'es', code: '28001', place: 'Madrid' }
  ];

  for (const l of lookups) {
    const prefix = l.code.slice(0, 2);
    const filePath = path.join(ASSETS_DIR, l.cc, `${prefix}.json`);
    let data;
    try {
      data = readJson(filePath);
    } catch (e) {
      check(false, `Could not read ${filePath} for ${l.cc} ${l.code}`);
      continue;
    }
    
    if (data[l.code]) {
      check(data[l.code].some(p => p.includes(l.place)), `${l.cc} ${l.code} contains ${l.place}`);
    } else {
      let foundAlt = false;
      const allFiles = fs.readdirSync(path.join(ASSETS_DIR, l.cc)).filter(f => f.endsWith('.json'));
      for (const f of allFiles) {
        const fileData = readJson(path.join(ASSETS_DIR, l.cc, f));
        for (const [k, places] of Object.entries(fileData)) {
          if (places.includes(l.place) || places.some(p => p.includes(l.place))) {
            console.log(`NOTE: ${l.cc} ${l.code} not found, but ${l.place} is at ${l.cc} ${k}`);
            foundAlt = true;
            break;
          }
        }
        if (foundAlt) break;
      }
      check(foundAlt, `${l.cc} ${l.code} not found, and no alternative for ${l.place} found`);
    }
  }

  console.log('3. Checking JSON files...');
  for (const cc of COUNTRIES) {
    const dirPath = path.join(ASSETS_DIR, cc);
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    for (const f of files) {
      const prefix = f.replace('.json', '');
      const data = readJson(path.join(dirPath, f));
      for (const [key, values] of Object.entries(data)) {
        check(key.startsWith(prefix), `Key ${key} in ${cc}/${f} starts with ${prefix}`);
        check(Array.isArray(values) && values.length > 0, `Values for ${key} is non-empty array`);
        for (const v of values) {
          check(typeof v === 'string' && v.length > 0, `Value in ${key} is non-empty string`);
        }
      }
    }
  }

  console.log('4. Checking size...');
  function getDirSize(dirPath) {
    let size = 0;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        size += getDirSize(fullPath);
      } else {
        size += fs.statSync(fullPath).size;
      }
    }
    return size;
  }
  
  const totalSize = getDirSize(ASSETS_DIR);
  const sizeMb = (totalSize / (1024 * 1024)).toFixed(2);
  console.log(`Total size of assets/postal: ${sizeMb} MB`);
  
  if (totalSize > 25 * 1024 * 1024) {
    check(false, `Size ${sizeMb} MB exceeds 25 MB limit`);
  } else if (totalSize > 10 * 1024 * 1024) {
    console.warn(`WARN: Size ${sizeMb} MB exceeds 10 MB`);
  }

  if (failCount > 0) {
    console.error(`\nFAILED with ${failCount} errors.`);
    process.exit(1);
  } else {
    let fileCount = 0;
    for (const cc of COUNTRIES) {
      fileCount += fs.readdirSync(path.join(ASSETS_DIR, cc)).filter(f => f.endsWith('.json')).length;
    }
    fileCount += 2; // index.json and LICENSE.txt
    console.log(`\nPASSED. Files generated: ${fileCount}`);
  }
}

runTests();
