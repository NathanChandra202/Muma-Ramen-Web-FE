const fs = require('fs');
const files = [
  'c:/Muma Ramen/frontend/src/pages/order/History.jsx',
  'c:/Muma Ramen/frontend/src/pages/order/Tracking.jsx',
  'c:/Muma Ramen/frontend/src/pages/order/Cart.jsx',
  'c:/Muma Ramen/frontend/src/pages/order/Menu.jsx'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let text = fs.readFileSync(f, 'utf8');
    text = text.replace(/\\\$/g, '$');
    text = text.replace(/\\`/g, '`');
    fs.writeFileSync(f, text);
  }
});
console.log("Fixed escapes.");
