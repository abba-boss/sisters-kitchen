#!/usr/bin/env node

/**
 * PWA Icon Generator for Sisters Kitchen
 * 
 * This script generates all required PWA icons in different sizes.
 * It creates a simple branded icon with the Sisters Kitchen colors.
 * 
 * Usage:
 *   node frontend/scripts/generate-icons.js
 * 
 * Or install canvas dependency first:
 *   npm install canvas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load canvas, provide helpful error if not installed
let createCanvas;
try {
  const Canvas = await import('canvas');
  createCanvas = Canvas.createCanvas;
} catch (error) {
  console.error('\n❌ Error: canvas package not installed\n');
  console.log('To generate icons, install canvas:');
  console.log('  npm install canvas\n');
  console.log('Or use the HTML generator instead:');
  console.log('  Open frontend/scripts/generate-pwa-icons.html in your browser\n');
  process.exit(1);
}

// Icon sizes required for PWA
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Create an icon canvas with Sisters Kitchen branding
 */
function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Create gradient background (Orange theme)
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#FF7A59');
  gradient.addColorStop(1, '#FF9478');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Draw chef hat icon (simple representation)
  ctx.fillStyle = 'white';
  const centerX = size / 2;
  const centerY = size / 2;
  const scale = size / 512;

  // Chef hat top circles
  ctx.beginPath();
  ctx.arc(centerX - 60 * scale, centerY - 40 * scale, 50 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(centerX, centerY - 60 * scale, 60 * scale, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(centerX + 60 * scale, centerY - 40 * scale, 50 * scale, 0, Math.PI * 2);
  ctx.fill();

  // Hat body
  ctx.fillRect(centerX - 120 * scale, centerY - 20 * scale, 240 * scale, 80 * scale);
  
  // Hat base/band
  ctx.fillRect(centerX - 140 * scale, centerY + 50 * scale, 280 * scale, 30 * scale);

  // Add "SK" text (Sisters Kitchen monogram)
  ctx.fillStyle = '#FF7A59';
  ctx.font = `bold ${Math.round(80 * scale)}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SK', centerX, centerY + 20 * scale);

  return canvas;
}

/**
 * Generate and save all icon sizes
 */
function generateAllIcons() {
  console.log('\n🎨 Generating PWA Icons for Sisters Kitchen...\n');

  let successCount = 0;
  let errorCount = 0;

  SIZES.forEach(size => {
    try {
      const canvas = createIcon(size);
      const filename = `icon-${size}x${size}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);

      // Save to file
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(filepath, buffer);

      console.log(`✅ Generated: ${filename} (${(buffer.length / 1024).toFixed(2)} KB)`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size}:`, error.message);
      errorCount++;
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount} icons`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed: ${errorCount} icons`);
  }
  console.log(`   📁 Output: ${OUTPUT_DIR}\n`);

  if (successCount === SIZES.length) {
    console.log('🎉 All PWA icons generated successfully!\n');
    console.log('Next steps:');
    console.log('  1. Icons are saved in frontend/public/icons/');
    console.log('  2. Test your PWA: npm run dev');
    console.log('  3. Open DevTools → Application → Manifest');
    console.log('  4. Verify all icons are loaded correctly\n');
  } else {
    console.log('⚠️  Some icons failed to generate. Please check errors above.\n');
  }
}

// Run the generator
generateAllIcons();
