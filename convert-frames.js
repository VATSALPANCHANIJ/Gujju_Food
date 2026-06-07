const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputDir = path.join(__dirname, 'frame by frame video');
const outputDir = path.join(__dirname, 'public', 'frames');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function convertFrames() {
  console.log('Reading input directory:', inputDir);
  const files = fs.readdirSync(inputDir)
    .filter(file => file.endsWith('.png'))
    .sort((a, b) => {
      // Extract numeric part, e.g., INDs123.png -> 123
      const numA = parseInt(a.replace(/[^\d]/g, ''), 10);
      const numB = parseInt(b.replace(/[^\d]/g, ''), 10);
      return numA - numB;
    });

  console.log(`Found ${files.length} PNG frames to convert.`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const inputPath = path.join(inputDir, file);
    
    // Format output filename as frame_0001.webp (1-indexed)
    const frameNum = String(i + 1).padStart(4, '0');
    const outputName = `frame_${frameNum}.webp`;
    const outputPath = path.join(outputDir, outputName);

    console.log(`Converting [${i + 1}/${files.length}]: ${file} -> ${outputName}`);

    try {
      await sharp(inputPath)
        .resize({ width: 1920 })
        .webp({ quality: 83 })
        .toFile(outputPath);
    } catch (err) {
      console.error(`Error converting ${file}:`, err);
    }
  }

  console.log('Frame conversion complete!');
}

convertFrames();
