const fs = require('fs');

const dir = 'src/components/watermelon/templates/landing-01/landing';
const files = fs.readdirSync(dir);

for (const f of files) {
  if (!f.endsWith('.tsx')) continue;
  const path = `${dir}/${f}`;
  let content = fs.readFileSync(path, 'utf8');
  let changed = false;

  if (content.includes("from 'react-router-dom'")) {
    content = content.replace(/from 'react-router-dom'/g, "from 'next/link'");
    changed = true;
  }
  if (content.includes('from "react-router-dom"')) {
    content = content.replace(/from "react-router-dom"/g, 'from "next/link"');
    changed = true;
  }

  const needsClient = content.includes('useEffect') || 
                      content.includes('useState') || 
                      content.includes('useRef') || 
                      content.includes('motion');
                      
  if (needsClient && !content.startsWith('"use client"')) {
    content = '"use client";\n' + content;
    changed = true;
  }

  if (content.includes('@/assets/logo-icon')) {
    content = content.replace(/@\/assets\/logo-icon/g, 'lucide-react');
    content = content.replace(/LogoIcon/g, 'Activity');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(path, content);
    console.log('Updated ' + f);
  }
}
