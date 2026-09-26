/*
-----------------------------------------------------------------------------
Конвертация локальных TTF/OTF в WOFF и WOFF2

Использование:
  yarn fonts:convert
  yarn fonts:convert path/to/font.ttf
  yarn fonts:convert --force
  yarn fonts:convert --keep

Для конвертации используются временные CLI-пакеты через npx.
Они скачиваются в npm-кэш и не добавляются в package.json, yarn.lock или node_modules проекта.
-----------------------------------------------------------------------------
*/

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const FONTS_DIR = path.resolve(__dirname, '../src/assets/fonts');
const SOURCE_EXTENSIONS = new Set(['.ttf', '.otf']);
const NPX_COMMAND = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const args = process.argv.slice(2);
const force = args.includes('--force');
const keepSource = args.includes('--keep');
const fileArgs = args.filter((arg) => !arg.startsWith('--'));

function collectFonts(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) return collectFonts(fullPath);

    return SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
      ? [fullPath]
      : [];
  });
}

function runNpx(packageName, command, commandArgs) {
  const result = spawnSync(
    NPX_COMMAND,
    ['--yes', '--package', packageName, command, ...commandArgs],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe',
    },
  );

  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || '').trim();
    throw new Error(message || `Не удалось выполнить ${command}`);
  }
}

function convertTarget({ packageName, command, inputPath, outputPath }) {
  if (!force && fs.existsSync(outputPath)) {
    console.log(`Пропуск (уже есть): ${path.relative(process.cwd(), outputPath)}`);
    return;
  }

  runNpx(packageName, command, [inputPath, outputPath]);

  const before = (fs.statSync(inputPath).size / 1024).toFixed(1);
  const after = (fs.statSync(outputPath).size / 1024).toFixed(1);
  console.log(`OK: ${path.relative(process.cwd(), outputPath)} (${before} KB -> ${after} KB)`);
}

async function convertFont(filePath) {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Файл не найден: ${resolvedPath}`);
  }

  const { dir, name } = path.parse(resolvedPath);
  const woffPath = path.join(dir, `${name}.woff`);
  const woff2Path = path.join(dir, `${name}.woff2`);

  convertTarget({
    packageName: 'ttf2woff@3.0.0',
    command: 'ttf2woff',
    inputPath: resolvedPath,
    outputPath: woffPath,
  });

  convertTarget({
    packageName: 'wawoff2@2.0.1',
    command: 'woff2_compress.js',
    inputPath: resolvedPath,
    outputPath: woff2Path,
  });

  if (!keepSource && fs.existsSync(woffPath) && fs.existsSync(woff2Path)) {
    fs.unlinkSync(resolvedPath);
    console.log(`Удалён исходник: ${path.relative(process.cwd(), resolvedPath)}`);
  }
}

async function main() {
  const files = fileArgs.length > 0
    ? fileArgs.map((file) => path.resolve(file))
    : collectFonts(FONTS_DIR);

  if (files.length === 0) {
    console.log(`Файлы .ttf/.otf не найдены в ${FONTS_DIR}`);
    return;
  }

  for (const file of files) {
    try {
      await convertFont(file);
    } catch (error) {
      console.error(`Ошибка конвертации ${path.relative(process.cwd(), file)}: ${error.message}`);
    }
  }
}

module.exports = { convertFont, FONTS_DIR };

if (require.main === module) {
  main();
}
