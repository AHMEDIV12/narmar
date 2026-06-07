const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure 64-byte hex string
const secret = crypto.randomBytes(64).toString('hex');

// Path to .env file
const envPath = path.join(__dirname, '.env');

// Read current .env content
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
    console.log('.env file not found, creating new one');
}

// Replace or add JWT_SECRET
const lines = envContent.split('\n');
const jwtSecretRegex = /^JWT_SECRET=/;
let found = false;

const newLines = lines.map(line => {
    if (jwtSecretRegex.test(line.trim())) {
        found = true;
        return `JWT_SECRET=${secret}`;
    }
    return line;
});

if (!found) {
    newLines.push(`JWT_SECRET=${secret}`);
}

// Write back to .env
fs.writeFileSync(envPath, newLines.join('\n'));

console.log('JWT_SECRET updated successfully!');
console.log('Please restart your development server for changes to take effect.');
