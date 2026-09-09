const fs = require('fs');

const files = [
  'src/components/watermelon/templates/landing-01/landing/navbar.tsx',
  'src/components/watermelon/templates/landing-01/landing/hero.tsx'
];

for (const p of files) {
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('to="')) {
    fs.writeFileSync(p, c.replace(/to="/g, 'href="'));
    console.log('Fixed ' + p);
  }
}
