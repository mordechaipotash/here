const fs = require('fs');
const path = require('path');

// Read the PDF pages data
const pdfPagesData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'pdf_pages.json'), 'utf-8'));

// Create images directory if it doesn't exist
const imagesDir = path.join(process.cwd(), 'public', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Create placeholder images for each jpg_filename
pdfPagesData.pdf_pages.forEach((page) => {
  if (page.jpg_filename) {
    const imagePath = path.join(imagesDir, page.jpg_filename);
    if (!fs.existsSync(imagePath)) {
      // Create a simple SVG placeholder
      const svg = `<svg width="612" height="792" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#666" text-anchor="middle">
          ${page.jpg_filename}
        </text>
      </svg>`;
      fs.writeFileSync(imagePath, svg);
    }
  }
});
