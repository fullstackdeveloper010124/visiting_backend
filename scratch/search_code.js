import fs from 'fs';
import path from 'path';

const dirs = [
  'C:\\Users\\USER\\Documents\\GitHub\\visiting_backend',
  'C:\\Users\\USER\\Documents\\GitHub\\visiting_frontend\\src'
];

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(fullPath, query);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          console.log(`Found "${query}" in: ${fullPath}`);
          // Print matching lines
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              console.log(`  L${idx + 1}: ${line.trim().slice(0, 100)}`);
            }
          });
        }
      }
    }
  }
}

console.log('Searching for "mail" or "email" in code...');
dirs.forEach(d => {
  if (fs.existsSync(d)) {
    searchDir(d, 'mail');
  }
});
