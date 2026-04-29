import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

async function createIcons() {
  // Ensure public directory exists
  if (!existsSync('./public')) {
    await mkdir('./public', { recursive: true });
  }

  // SVG content
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect x="24" y="24" width="464" height="464" fill="#F7F6F3" stroke="#111111" stroke-width="32"/>
    <path d="M128 128h256M256 128v256M256 256h128M384 256v128" stroke="#111111" stroke-width="40" fill="none" stroke-linecap="square" stroke-linejoin="miter"/>
  </svg>`;

  // Create 192x192
  await sharp(Buffer.from(svgContent))
    .resize(192, 192)
    .png()
    .toFile('./public/icon-192.png');

  // Create 512x512
  await sharp(Buffer.from(svgContent))
    .resize(512, 512)
    .png()
    .toFile('./public/icon-512.png');

  console.log('Icons created: icon-192.png, icon-512.png');
}

createIcons().catch(console.error);
