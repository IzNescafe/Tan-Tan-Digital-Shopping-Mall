import crypto from 'crypto';
const salt='4a62a306-8965-4685-9ead-f88a4e8e5298';
const target='0854f1567b7fba53f23f472a9f5c0315b426381d49fcf05ac31be94151580c917477d3a31a5f9984dd99eb4adce82870a7886a77802f2a97079775f5d822d4ac';
const password='asdfjkl;';
const tests={
  sha512_pw_salt: crypto.createHash('sha512').update(password + salt).digest('hex'),
  sha512_salt_pw: crypto.createHash('sha512').update(salt + password).digest('hex'),
  hmac_sha512_salt_key_pw: crypto.createHmac('sha512', salt).update(password).digest('hex'),
  hmac_sha512_pw_key_salt: crypto.createHmac('sha512', password).update(salt).digest('hex'),
  pbkdf2_1000_sha512_64: crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex'),
  pbkdf2_10000_sha512_64: crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex'),
  scrypt_64: crypto.scryptSync(password, salt, 64).toString('hex'),
};
for (const [name, value] of Object.entries(tests)) {
  console.log(name, value === target ? 'MATCH' : 'no');
}
