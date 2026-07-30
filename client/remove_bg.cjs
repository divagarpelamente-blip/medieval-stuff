const { Jimp } = require('jimp');

async function main() {
  console.log('Reading image...');
  const image = await Jimp.read('C:\\Users\\silva\\Downloads\\Dashboard-tab-button.png');
  
  console.log('Processing pixels to remove background...');
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // Background in the uploaded image is dark charcoal (approx R=32, G=35, B=38).
    // Let's clear any dark gray background pixels.
    if (r < 60 && g < 60 && b < 60) {
      this.bitmap.data[idx + 3] = 0; // Transparent
    }
  });

  console.log('Writing output...');
  await image.write('src\\assets\\insights_scroll_tab.png');
  console.log('Background removed successfully and saved to src/assets/insights_scroll_tab.png!');
}

main().catch(console.error);
