const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('image'), async (req, res) => {
  const inputPath = req.file.path;
  const outputPath = path.join('output', req.file.filename + '_watermarked.png');
  const watermarkPath = path.join('watermark', 'watermark.png');

  try {
    const inputImage = sharp(inputPath);
    const metadata = await inputImage.metadata();
    
    const watermark = await sharp(watermarkPath)
      .ensureAlpha()
      .resize(100) // Size of each watermark tile
      .toBuffer();

    // Create tiled watermark pattern
    const columns = Math.ceil(metadata.width / 100);
    const rows = Math.ceil(metadata.height / 100);
    const compositeArray = [];

    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        compositeArray.push({
          input: watermark,
          top: y * 100,
          left: x * 100,
          blend: 'over',
          opacity: 0.3
        });
      }
    }

    await inputImage
      .composite(compositeArray)
      .toFile(outputPath);

    res.download(outputPath, 'watermarked.png', () => {
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Something went wrong.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});