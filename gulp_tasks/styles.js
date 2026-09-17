const path = require('../gulpfile');
const { task, src, series, dest } = require('gulp');

const del = require('del');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const header = require('gulp-header');

require('dotenv').config({ quiet: true });

const theme = {
  name: process.env.WP_THEME_NAME || 'Theme',
  description: process.env.WP_THEME_DESCRIPTION || '',
  author: process.env.WP_THEME_AUTHOR || '',
  authorUri: process.env.WP_THEME_AUTHOR_URI || '',
  version: process.env.WP_THEME_VERSION || '1.0.0',
};

task('css', () => src(path.style.folder.build + path.style.name.build)
  .pipe(header([
    '/*',
    `Theme Name: ${theme.name}`,
    `Description: ${theme.description}`,
    `Author: ${theme.author}`,
    `Author URI: ${theme.authorUri}`,
    `Version: ${theme.version}`,
    '*/',
    '',
    '',
  ].join('\n')))
  .pipe(replace('../assets/', 'assets/'))
  .pipe(rename(path.style.name.theme))
  .pipe(dest(path.style.folder.theme)));

task('clean_css', () => del(path.style.folder.build));

task('styles',
  series(
    'css',
    'clean_css',
  ),
);