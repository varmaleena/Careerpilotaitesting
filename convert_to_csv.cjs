const fs = require('fs');

const users = JSON.parse(
  fs.readFileSync('users.json', 'utf8')
);

let csv = 'id,data\n';

users.forEach(user => {
  const id = `"${user.id.replace(/"/g, '""')}"`;

  const data = `"${JSON.stringify(user).replace(/"/g, '""')}"`;

  csv += `${id},${data}\n`;
});

fs.writeFileSync('supabase_import.csv', csv);

console.log('CSV created successfully!');