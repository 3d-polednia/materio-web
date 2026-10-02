/**
 * scripts/build-postal.mjs
 * 
 * Why self-hosted?
 * 1. Privacy: The postal code typed by the user never leaves liczmat.com.
 * 2. Reliability: No dependency on third-party APIs for core functionality.
 * 
 * How to re-run:
 * Run `node scripts/build-postal.mjs` from the project root.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';

const COUNTRIES = ['PL', 'DE', 'AT', 'CH', 'CZ', 'SK', 'RO', 'HR', 'RS', 'IT', 'NL', 'BE', 'ES', 'FR', 'UA', 'LU'];
const LOCALES = { PL: 'pl', DE: 'de', AT: 'de', CH: 'de', CZ: 'cs', SK: 'sk', RO: 'ro', HR: 'hr', RS: 'sr', IT: 'it', NL: 'nl', BE: 'nl', ES: 'es', FR: 'fr', UA: 'uk', LU: 'fr' };
const ASSETS_DIR = path.join(process.cwd(), 'assets', 'postal');

function extractFileFromZip(buffer, filename) {
  // Simple zip extractor without external dependencies.
  // Finds the End of Central Directory (EOCD), iterates Central Directory,
  // locates the Local File Header for the target file and extracts the deflated data.
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error("EOCD not found");
  
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  let offset = cdOffset;
  
  while (offset < eocdOffset) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const compMethod = buffer.readUInt16LE(offset + 10);
    const compSize = buffer.readUInt32LE(offset + 20);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLen);
    if (name === filename) {
      const lhOffset = localHeaderOffset;
      if (buffer.readUInt32LE(lhOffset) !== 0x04034b50) throw new Error("Invalid local header");
      const lhNameLen = buffer.readUInt16LE(lhOffset + 26);
      const lhExtraLen = buffer.readUInt16LE(lhOffset + 28);
      const dataOffset = lhOffset + 30 + lhNameLen + lhExtraLen;
      
      const compressedData = buffer.subarray(dataOffset, dataOffset + compSize);
      if (compMethod === 8) {
        return zlib.inflateRawSync(compressedData);
      } else if (compMethod === 0) {
        return compressedData;
      } else {
        throw new Error(`Unsupported compression method ${compMethod}`);
      }
    }
    offset += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`${filename} not found in zip`);
}

async function build() {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  
  const indexData = {
    source: "GeoNames (geonames.org), CC BY 4.0",
    built: new Date().toISOString().split('T')[0],
    countries: {}
  };
  
  for (const cc of COUNTRIES) {
    console.log(`Processing ${cc}...`);
    const ccLower = cc.toLowerCase();
    const url = `https://download.geonames.org/export/zip/${cc}.zip`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const txtBuffer = extractFileFromZip(buffer, `${cc}.txt`);
    const txtContent = txtBuffer.toString('utf8');
    const lines = txtContent.split('\n');
    
    const prefixMap = new Map();
    let codeCount = 0;
    
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split('\t');
      const countryCode = parts[0];
      const postalCode = parts[1];
      const placeName = parts[2];
      
      if (countryCode !== cc) continue;
      
      // Normalize postal code to a lookup key
      // Note: For NL, the GeoNames file contains only the 4-digit part,
      // so this operation results in just those 4 digits, exactly as required.
      const key = postalCode.toUpperCase().replace(/[\s-]/g, '');
      if (!key) continue;
      
      const prefix = key.slice(0, 2);
      if (!prefixMap.has(prefix)) prefixMap.set(prefix, new Map());
      const keyMap = prefixMap.get(prefix);
      
      if (!keyMap.has(key)) {
        keyMap.set(key, new Set());
      }
      keyMap.get(key).add(placeName);
    }
    
    const countryDir = path.join(ASSETS_DIR, ccLower);
    fs.mkdirSync(countryDir, { recursive: true });
    
    let totalBytes = 0;
    const locale = LOCALES[cc] || 'en';
    
    for (const [prefix, keyMap] of prefixMap.entries()) {
      const outObj = {};
      const sortedKeys = Array.from(keyMap.keys()).sort();
      for (const key of sortedKeys) {
        const places = Array.from(keyMap.get(key)).sort((a, b) => a.localeCompare(b, locale));
        outObj[key] = places;
        codeCount++; // Increment for each unique code
      }
      // Compact JSON without extra spaces, ensuring deterministic output with LF line ending
      const fileData = JSON.stringify(outObj) + '\n';
      const filePath = path.join(countryDir, `${prefix}.json`);
      fs.writeFileSync(filePath, fileData, 'utf8');
      totalBytes += Buffer.byteLength(fileData, 'utf8');
    }
    
    indexData.countries[ccLower] = {
      files: prefixMap.size,
      codes: codeCount
    };
    
    console.log(`  Codes: ${codeCount}, Files: ${prefixMap.size}, Bytes: ${totalBytes}`);
  }
  
  fs.writeFileSync(path.join(ASSETS_DIR, 'index.json'), JSON.stringify(indexData, null, 2) + '\n', 'utf8');
  
  const licenseText = `Data from GeoNames (https://www.geonames.org/)
Licensed under Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/)
Built on: ${indexData.built}
Note: The original data was regrouped into per-prefix JSON files.
`;
  fs.writeFileSync(path.join(ASSETS_DIR, 'LICENSE.txt'), licenseText, 'utf8');
  console.log("Done.");
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});
