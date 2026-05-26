import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SRC_ICON = path.join(process.cwd(), 'src/assets/images/logo_pwa_icon_1779816422308.png');

console.log('--- Preparing PWA Resources ---');

// Ensure /public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  console.log('Created /public directory.');
}

// Sizes requested by PWA specs
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

if (fs.existsSync(SRC_ICON)) {
  // Copy to each requested size
  sizes.forEach(size => {
    const destPath = path.join(PUBLIC_DIR, `pwa-icon-${size}.png`);
    fs.copyFileSync(SRC_ICON, destPath);
  });
  // Also copy main pwa-icon.png
  fs.copyFileSync(SRC_ICON, path.join(PUBLIC_DIR, 'pwa-icon.png'));
  console.log(`Successfully copied launcher icon into ${sizes.length} dimensions in /public.`);
} else {
  console.warn(`Source icon not found at: ${SRC_ICON}`);
}

console.log('PWA assets updated successfully!');
