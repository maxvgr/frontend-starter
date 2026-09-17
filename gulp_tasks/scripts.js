const path = require('../gulpfile');
const { task, src, series, dest } = require('gulp');

const del = require('del');

/*
- Перенос JS-файла в структуру WordPress-темы
*/

task('js', () => src(path.scripts.folder.build + path.scripts.name)
  .pipe(dest(path.scripts.folder.theme)));

task('clean_js', () => del(path.scripts.folder.build));

task('scripts',
  series(
    'js',
    'clean_js',
  ),
);
