// scripts/generate-icons.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// You'll need to install sharp: npm install --save-dev sharp

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="sparkle" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.9" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.3" />
    </linearGradient>
  </defs>
  
  <!-- Background Circle -->
  <circle cx="256" cy="256" r="240" fill="url(#bg)"/>
  
  <!-- Sparkle Icon -->
  <g transform="translate(256, 256)">
    <!-- Main sparkle shape -->
    <path d="M0,-120 L20,-40 L100,-20 L20,0 L0,80 L-20,0 L-100,-20 L-20,-40 Z" 
          fill="url(#sparkle)" 
          transform="scale(1.5)"/>
    
    <!-- Secondary sparkles -->
    <circle cx="-80" cy="-80" r="15" fill="white" opacity="0.8"/>
    <circle cx="80" cy="80" r="10" fill="white" opacity="0.6"/>
    <circle cx="80" cy="-80" r="8" fill="white" opacity="0.7"/>
    <circle cx="-80" cy="80" r="12" fill="white" opacity="0.5"/>
  </g>
</svg>
`;

async function generateIcons() {
  const publicDir = path.join(process.cwd(), 'public');
  
  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Generate icons for each size
  for (const size of sizes) {
    const filename = size === 192 ? 'icon-192.png' : 
                    size === 512 ? 'icon-512.png' : 
                    `icon-${size}x${size}.png`;
    
    await sharp(Buffer.from(inputSvg))
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, filename));
    
    console.log(`✅ Generated ${filename}`);
  }

  // Generate special icons
  await sharp(Buffer.from(inputSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✅ Generated apple-touch-icon.png');

  await sharp(Buffer.from(inputSvg))
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('✅ Generated favicon-16x16.png');

  await sharp(Buffer.from(inputSvg))
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('✅ Generated favicon-32x32.png');

  await sharp(Buffer.from(inputSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✅ Generated favicon.ico');

  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
