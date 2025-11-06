const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const stubSrc = path.join(projectRoot, 'stubs', '7zip-bin');
const dest = path.join(projectRoot, 'node_modules', 'builder-util', 'node_modules', '7zip-bin');

try {
  if (!fs.existsSync(stubSrc)) {
    console.error('Stub source not found:', stubSrc);
    process.exit(1);
  }
  if (fs.existsSync(dest)) {
    console.log('7zip-bin stub already present at', dest);
    process.exit(0);
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.cpSync) {
    fs.cpSync(stubSrc, dest, { recursive: true });
  } else {
    const copyRecursive = (src, dst) => {
      fs.mkdirSync(dst, { recursive: true });
      for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dst, entry.name);
        if (entry.isDirectory()) copyRecursive(s, d);
        else fs.copyFileSync(s, d);
      }
    };
    copyRecursive(stubSrc, dest);
  }
  console.log('Copied 7zip-bin stub to', dest);
} catch (err) {
  console.error('Failed to ensure 7zip-bin stub:', err);
  process.exit(1);
}