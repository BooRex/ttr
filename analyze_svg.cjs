const fs = require('fs');
const svg = fs.readFileSync('C:/Users/Oleh/Desktop/Blank_map_of_Europe_cropped.svg', 'utf8');

// Collect all absolute coords from path d attributes
const allX = [], allY = [];
const pathReg = /d="([^"]+)"/g;
let m;
while ((m = pathReg.exec(svg)) !== null) {
  const d = m[1];
  // Find all absolute M and L coordinates
  const coords = [...d.matchAll(/[ML]\s*([\d.]+),([\d.]+)/g)];
  for (const c of coords) {
    const x = parseFloat(c[1]);
    const y = parseFloat(c[2]);
    if (x < 1700 && y < 1600) { allX.push(x); allY.push(y); }
  }
}

const xs = allX.sort((a,b)=>a-b);
const ys = allY.sort((a,b)=>a-b);
const n = xs.length;
console.log('Total coord pairs (< 1700):', n);
console.log('X range:', xs[0].toFixed(1), '-', xs[n-1].toFixed(1));
console.log('Y range:', ys[0].toFixed(1), '-', ys[n-1].toFixed(1));
console.log('X 1%:', xs[Math.floor(n*0.01)].toFixed(1), 'X 99%:', xs[Math.floor(n*0.99)].toFixed(1));
console.log('Y 1%:', ys[Math.floor(n*0.01)].toFixed(1), 'Y 99%:', ys[Math.floor(n*0.99)].toFixed(1));

// Known anchor cities: find closest SVG paths to calibrate
// Identify largest paths by counting their M+L pairs
const pathsData = [];
let pm;
const pathReg2 = /id="([^"]+)"[^>]*d="([^"]+)"|d="([^"]+)"[^>]*id="([^"]+)"/g;
// simpler: just find all d= and count points
const allPaths = [...svg.matchAll(/d="([^"]+)"/g)];
for (const p of allPaths) {
  const coords = [...p[1].matchAll(/[ML]\s*([\d.]+),([\d.]+)/g)];
  if (coords.length > 50) {
    const pts = coords.map(c => [parseFloat(c[1]), parseFloat(c[2])]).filter(([x,y]) => x < 1700);
    if (pts.length > 20) {
      const minX = Math.min(...pts.map(p=>p[0]));
      const maxX = Math.max(...pts.map(p=>p[0]));
      const minY = Math.min(...pts.map(p=>p[1]));
      const maxY = Math.max(...pts.map(p=>p[1]));
      const cx = (minX+maxX)/2;
      const cy = (minY+maxY)/2;
      pathsData.push({ pts: pts.length, cx: cx.toFixed(0), cy: cy.toFixed(0), bbox: `${minX.toFixed(0)}-${maxX.toFixed(0)}, ${minY.toFixed(0)}-${maxY.toFixed(0)}` });
    }
  }
}
pathsData.sort((a,b)=>b.pts-a.pts);
console.log('\nTop 20 largest paths (center x, y, bbox):');
pathsData.slice(0,20).forEach(p => console.log(`  pts=${p.pts} center=(${p.cx},${p.cy}) bbox=[${p.bbox}]`));

