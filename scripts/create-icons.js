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
    <rect width="512" height="512" rx="96" fill="#10B981"/>
    <path d="M128 256l85 85 171-171" stroke="white" stroke-width="48" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
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