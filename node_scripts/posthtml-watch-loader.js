const path = require('path');

/*
 * Помечает файлы из <include src="..."> как зависимости модуля,
 * чтобы Webpack пересобирал страницу при их изменении.
 */
module.exports = function (content) {
  const regex = /<include[^>]+src=["']([^"']+)["']/gi;
  let match;

  while ((match = regex.exec(content)) !== null) {
    this.addDependency(path.resolve(this.rootContext, 'src', match[1]));
  }

  return content;
};
