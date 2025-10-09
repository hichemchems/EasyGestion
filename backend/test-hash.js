const bcrypt = require('bcryptjs');

async function test() {
  const password = 'admin';
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('New hash:', hash);
  const isValid = await bcrypt.compare(password, hash);
  console.log('Password valid for new hash:', isValid);

  const oldHash = '$2b$12$Y8NVVEzvaQVO5XRdRNszN.dG9wBVYjMJo88L4zNf6rIZtKdmapHiC';
  const isValidOld = await bcrypt.compare(password, oldHash);
  console.log('Password valid for old hash:', isValidOld);
}

test();
