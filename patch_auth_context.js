const fs = require('fs');
const content = fs.readFileSync('src/contexts/AuthContext.tsx', 'utf8');

const newContent = content
  .replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);')
  .replace(
    'setCurrentUser(user);\n      if (user) {\n        await fetchProfileData(user);\n      } else {',
    'setLoading(true);\n      setCurrentUser(user);\n      if (user) {\n        await fetchProfileData(user);\n      } else {'
  )
  .replace(
    '{!loading && children}',
    '{children}'
  );

fs.writeFileSync('src/contexts/AuthContext.tsx', newContent, 'utf8');
