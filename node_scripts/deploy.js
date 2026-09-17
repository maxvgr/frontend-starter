const ftp = require('basic-ftp');
const dotenv = require('dotenv');

dotenv.config();

const secureValues = new Set(['true', '1', 'yes', 'on']);

const requiredVariables = [
  'FTP_HOST',
  'FTP_USER',
  'FTP_PASSWORD',
  'FTP_REMOTE_DIR',
];

function validateEnvironment() {
  const missingVariables = requiredVariables.filter(
    variable => !process.env[variable],
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Не заполнены переменные окружения: ${missingVariables.join(', ')}`,
    );
  }
}

async function deploy() {
  validateEnvironment();

  const client = new ftp.Client();

  const secure = secureValues.has(
    (process.env.FTP_SECURE || 'true').toLowerCase(),
  );

  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure,
    });

    await client.ensureDir(process.env.FTP_REMOTE_DIR);
    await client.clearWorkingDir();
    await client.uploadFromDir('dist');

    console.log('Deploy completed successfully.');
  } finally {
    client.close();
  }
}

deploy().catch((error) => {
  console.error('Deploy failed:', error.message);
  process.exitCode = 1;
});