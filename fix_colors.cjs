const fs = require('fs');

const files = [
  'c:/Muma Ramen/frontend/src/pages/Landing.jsx',
  'c:/Muma Ramen/frontend/src/pages/order/Menu.jsx',
  'c:/Muma Ramen/frontend/src/pages/order/Cart.jsx',
  'c:/Muma Ramen/frontend/src/pages/order/History.jsx',
  'c:/Muma Ramen/frontend/src/pages/order/Tracking.jsx',
  'c:/Muma Ramen/frontend/src/components/utils.js'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace hover:text-white with hover:text-primary
  content = content.replace(/hover:text-white/g, 'hover:text-primary');
  
  // Replace text-white/5, text-white/10 with border-border etc
  content = content.replace(/border-white\/5/g, 'border-border/50');
  content = content.replace(/border-white\/10/g, 'border-border');
  content = content.replace(/border-white\/20/g, 'border-border');
  content = content.replace(/bg-white\/5/g, 'bg-surface-hover');
  content = content.replace(/bg-white\/10/g, 'bg-border');
  
  // Replace text-white with text-text EXCEPT in buttons with bg-primary or bg-red or similar
  content = content.replace(/text-white/g, 'text-text');
  
  // Fix primary buttons to use text-white again
  content = content.replace(/bg-primary([^"']*?)text-text/g, 'bg-primary$1text-white');
  content = content.replace(/bg-red-500([^"']*?)text-text/g, 'bg-red-500$1text-white');
  content = content.replace(/bg-emerald-500([^"']*?)text-text/g, 'bg-emerald-500$1text-white');
  content = content.replace(/bg-blue-500([^"']*?)text-text/g, 'bg-blue-500$1text-white');
  content = content.replace(/bg-amber-500([^"']*?)text-text/g, 'bg-amber-500$1text-white');
  
  // Also specific buttons like "bg-primary text-white px-2"
  content = content.replace(/text-text([^"']*?)bg-primary/g, 'text-white$1bg-primary');
  
  // Replace bg-black/60 with bg-background/60
  content = content.replace(/bg-black\/60/g, 'bg-text/10');
  
  fs.writeFileSync(file, content);
});

console.log("Replaced colors.");
