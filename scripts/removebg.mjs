import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = 'YOUR_REMOVEBG_API_KEY'; // Replace with your key from remove.bg

const icons = [
  'TotalSubmissions.png',
  'Pending.png',
  'UnderAnalysis.png',
  'Completed.png',
  'ReviewNeeded.png',
];

const inputDir = path.join(__dirname, '../public/DiseaseDetectionicon');
const outputDir = inputDir;

async function removeBg(filename) {
  const inputPath = path.join(inputDir, filename);
  const outputPath = path.join(outputDir, filename);

  const imageData = fs.readFileSync(inputPath);
  const base64 = imageData.toString('base64');

  const res = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: {
      'X-Api-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_base64: base64,
      size: 'auto',
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error(`❌ Failed ${filename}:`, err);
    return;
  }

  const buffer = await res.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`✅ Done: ${filename}`);
}

for (const icon of icons) {
  await removeBg(icon);
}
