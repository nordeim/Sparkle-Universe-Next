// /scripts/generate-icons.js
// Run this script to generate all PWA icons from a base SVG
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Base SVG for the Sparkle icon
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#ec4899;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#10b981;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="102" fill="url(#sparkleGradient)"/>
  <path d="M256 128 L288 224 L384 256 L288 288 L256 384 L224 288 L128 256 L224 224 Z" 
        fill="white" opacity="0.95"/>
  <circle cx="160" cy="160" r="16" fill="white" opacity="0.8"/>
  <circle cx="352" cy="160" r="12" fill="white" opacity="0.7"/>
  <circle cx="160" cy="352" r="12" fill="white" opacity="0.7"/>
  <circle cx="352" cy="352" r="16" fill="white" opacity="0.8"/>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(process.cwd(), 'public');
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  // Save the base SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

  // Generate PNG icons for each size
  for (const size of sizes) {
    try {
      await sharp(Buffer.from(svgIcon))
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, `icon-${size}x${size}.png`));
      
      console.log(`✓ Generated icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate icon-${size}x${size}.png:`, error);
    }
  }

  // Generate favicon.ico (multi-resolution)
  try {
    await sharp(Buffer.from(svgIcon))
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.png'));
    
    console.log('✓ Generated favicon.png');
  } catch (error) {
    console.error('✗ Failed to generate favicon:', error);
  }

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
