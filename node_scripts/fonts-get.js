/*
-----------------------------------------------------------------------------
Загрузка статических шрифтов с Google Fonts и конвертация в WOFF/WOFF2

Использование:
  yarn fonts:get "Moderustic:300,400,500,600,700"
  yarn fonts:get "Yeseva One"
  yarn fonts:get "Inter:400,600,700i"

"i" после веса означает italic. Можно передать несколько семейств подряд.
Исходные TTF после успешной конвертации удаляются.
-----------------------------------------------------------------------------
*/

const fs = require('fs');
const path = require('path');
const { convertFont, FONTS_DIR } = require('./fonts-convert');

// UA без поддержки WOFF/WOFF2 заставляет Google Fonts вернуть статические TTF.
const TTF_USER_AGENT = 'curl/8.0';

const WEIGHT_NAMES = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};

function parseFamilyArg(arg) {
  const [rawFamily, rawWeights = '400'] = arg.split(':');
  const family = rawFamily.trim();

  if (!family) return null;

  const styles = [...new Set(rawWeights.split(','))]
    .map((token) => {
      const normalizedToken = token.trim();
      const italic = normalizedToken.endsWith('i');
      const weight = Number.parseInt(
        italic ? normalizedToken.slice(0, -1) : normalizedToken,
        10,
      );

      return Number.isNaN(weight) ? null : { weight, italic };
    })
    .filter(Boolean);

  return styles.length > 0 ? { family, styles } : null;
}

function buildCssUrl(family, styles) {
  const normal = styles
    .filter((style) => !style.italic)
    .map((style) => style.weight)
    .sort((a, b) => a - b);

  const italic = styles
    .filter((style) => style.italic)
    .map((style) => style.weight)
    .sort((a, b) => a - b);

  const familyParam = encodeURIComponent(family).replace(/%20/g, '+');

  if (italic.length === 0) {
    return `https://fonts.googleapis.com/css2?family=${familyParam}:wght@${normal.join(';')}`;
  }

  const tuples = [
    ...normal.map((weight) => `0,${weight}`),
    ...italic.map((weight) => `1,${weight}`),
  ];

  return `https://fonts.googleapis.com/css2?family=${familyParam}:ital,wght@${tuples.join(';')}`;
}

function parseFontFaces(css) {
  const faces = [];

  for (const block of css.split('@font-face').slice(1)) {
    const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
    const style = block.match(/font-style:\s*(\w+)/)?.[1];
    const url = block.match(/url\((https:\/\/[^)]+)\)/)?.[1];

    if (weight && url) {
      faces.push({
        weight: Number.parseInt(weight, 10),
        italic: style === 'italic',
        url,
      });
    }
  }

  return faces;
}

async function downloadFont({ family, weight, italic, url }) {
  const dirName = family.replace(/\s+/g, '');
  const weightName = WEIGHT_NAMES[weight] || `W${weight}`;
  const fileName = `${dirName}-${weightName}${italic ? '-Italic' : ''}`;
  const dir = path.join(FONTS_DIR, dirName);
  const ttfPath = path.join(dir, `${fileName}.ttf`);
  const woff2Path = path.join(dir, `${fileName}.woff2`);

  fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(woff2Path)) {
    console.log(`Пропуск (уже есть): ${dirName}/${fileName}.woff2`);
    return;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} при загрузке ${url}`);
  }

  fs.writeFileSync(ttfPath, Buffer.from(await response.arrayBuffer()));
  console.log(`Скачан: ${dirName}/${fileName}.ttf`);

  await convertFont(ttfPath);
}

async function main() {
  const families = process.argv.slice(2)
    .filter((arg) => !arg.startsWith('--'))
    .map(parseFamilyArg)
    .filter(Boolean);

  if (families.length === 0) {
    console.log('Укажи семейство: yarn fonts:get "Moderustic:300,400,500,600,700"');
    return;
  }

  for (const { family, styles } of families) {
    try {
      const cssUrl = buildCssUrl(family, styles);
      const response = await fetch(cssUrl, {
        headers: { 'User-Agent': TTF_USER_AGENT },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} — проверь имя семейства и веса`);
      }

      const faces = parseFontFaces(await response.text());

      if (faces.length === 0) {
        console.log(`${family}: в ответе Google Fonts не найдено @font-face`);
        continue;
      }

      for (const face of faces) {
        await downloadFont({ family, ...face });
      }
    } catch (error) {
      console.error(`${family}: ${error.message}`);
    }
  }
}

main();
