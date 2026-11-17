// Adds what the app needs to the generated Android manifest: camera (360 capture), location (the globe),
// vibration, and a portrait-only screen.
import { readFileSync, writeFileSync } from 'node:fs';
const path = 'android/app/src/main/AndroidManifest.xml';
let xml = readFileSync(path, 'utf8');
const need = [
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '<uses-permission android:name="android.permission.VIBRATE" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />',
  '<uses-feature android:name="android.hardware.sensor.gyroscope" android:required="false" />',
].filter((l) => !xml.includes(l.match(/name="([^"]+)"/)[1]));
xml = xml.replace('</manifest>', `    ${need.join('\n    ')}\n</manifest>`);
if (!xml.includes('screenOrientation')) xml = xml.replace(/<activity\b/, '<activity\n            android:screenOrientation="portrait"');
writeFileSync(path, xml);
console.log('Added', need.length, 'entries to AndroidManifest.xml');
