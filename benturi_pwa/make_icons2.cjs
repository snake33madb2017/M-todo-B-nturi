const sharp = require('sharp');
sharp('public/icon-192.svg').resize(192).png().toFile('public/icon-192.png');
sharp('public/icon-512.svg').resize(512).png().toFile('public/icon-512.png');
sharp('public/icon-192.svg').resize(180).png().toFile('public/apple-touch-icon.png');
console.log('Icons generated successfully.');
