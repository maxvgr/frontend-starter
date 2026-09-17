const path = require('../gulpfile');
const { task, src, dest } = require('gulp');

const replace = require('gulp-replace');

/*
- Смена путей к файлу стилей
*/

task('layout', () => src(path.layout.folder.build + path.layout.name)
  .pipe(replace('css/main.css', 'style.css'))
  .pipe(replace('js/bundle.js', 'assets/js/bundle.js'))
  .pipe(dest(path.layout.folder.build)));