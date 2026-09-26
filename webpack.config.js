const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlBeautifyPlugin = require("@nurminen/html-beautify-webpack-plugin");
const postHtmlInclude = require("posthtml-include");
const inlineSVG = require("posthtml-inline-svg");
const expressions = require("posthtml-expressions");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const StylelintPlugin = require("stylelint-webpack-plugin");

const ESLintPlugin = require("eslint-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

dotenv.config({ quiet: true });

const cacheDir = path.resolve(__dirname, "node_modules", ".cache");
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

const postHtmlCustomLoader = path.resolve(cacheDir, "posthtml-watch-loader.js");
fs.writeFileSync(
  postHtmlCustomLoader,
  `
  const path = require('path');
  module.exports = function(content) {
    const regex = /<include[^>]+src="([^"]+)"/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      this.addDependency(path.resolve(this.rootContext, 'src', match[1]));
    }
    return content;
  };
`,
);

const includeRoot = path.resolve(__dirname, "src");
const pages = fs
  .readdirSync(includeRoot)
  .filter((file) => file.endsWith(".html"));

const wordPressThemeHeader = [
  "/*",
  `Theme Name: ${process.env.WP_THEME_NAME || "Theme"}`,
  `Description: ${process.env.WP_THEME_DESCRIPTION || ""}`,
  `Author: ${process.env.WP_THEME_AUTHOR || ""}`,
  `Author URI: ${process.env.WP_THEME_AUTHOR_URI || ""}`,
  `Version: ${process.env.WP_THEME_VERSION || "1.0.0"}`,
  "*/",
  "",
  "",
].join("\n");

// Добавляет служебный заголовок WordPress в начало style.css
class WordPressThemeHeaderPlugin {
  apply(compiler) {
    const { Compilation, sources } = compiler.webpack;

    compiler.hooks.thisCompilation.tap(
      "WordPressThemeHeaderPlugin",
      (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: "WordPressThemeHeaderPlugin",
            stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
          },
          () => {
            const asset = compilation.getAsset("style.css");

            if (!asset) {
              return;
            }

            compilation.updateAsset(
              "style.css",
              new sources.ConcatSource(wordPressThemeHeader, asset.source),
            );
          },
        );
      },
    );
  }
}

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  const isWordPress = Boolean(env?.wp);
  const buildDateValue = new Intl.DateTimeFormat("ru-RU").format(new Date());

  return {
    entry: "./src/js/app.js",
    stats: {
      preset: "errors-warnings",
      children: false,
      errorStack: false,
      moduleTrace: false,
    },

    infrastructureLogging: {
      level: "warn",
    },

    mode: isProduction ? "production" : "development",
    devtool: isProduction ? false : "source-map",

    output: {
      filename: isWordPress ? "assets/js/bundle.js" : "js/bundle.js",
      path: path.resolve(__dirname, "dist"),
      clean: true,
      assetModuleFilename: (pathData) => {
        const filepath = path
          .dirname(pathData.filename)
          .split("/")
          .slice(1)
          .join("/");
        return `${filepath}/[name][ext]`;
      },
    },

    resolve: {
      alias: {
        "@assets": path.resolve(__dirname, "src/assets"),
      },
    },

    module: {
      rules: [
        /* HTML */
        {
          test: /\.html$/i,
          use: [
            {
              loader: "html-loader",
              options: {
                esModule: false,
                minimize: false,
              },
            },
            {
              loader: "posthtml-loader",
              options: {
                plugins: [
                  postHtmlInclude({
                    root: includeRoot,
                    posthtmlExpressionsOptions: { strictMode: false },
                  }),
                  expressions({
                    strictMode: false,
                    locals: {
                      buildDate: buildDateValue,
                    },
                  }),
                  inlineSVG({
                    cwd: includeRoot,
                    tag: "inline",
                    attr: "src",
                    svgo: {
                      plugins: [
                        { removeXMLNS: true },
                        { removeViewBox: false },
                        { removeDimensions: false },
                      ],
                    },
                  }),
                ],
              },
            },
            {
              loader: postHtmlCustomLoader,
            },
          ],
        },

        /* ASSETS */
        {
          test: /\.(png|svg|jpe?g|gif|mp4|webp)$/i,
          type: "asset/resource",
        },

        {
          test: /\.(woff2?|ttf|eot|otf)$/i,
          type: "asset/resource",
        },

        /* CSS */
        {
          test: /\.css$/i,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                sourceMap: !isProduction,
                importLoaders: 2,
                modules: false,
              },
            },
            {
              loader: "postcss-loader",
              options: {
                sourceMap: !isProduction,
              },
            },
          ],
        },

        /* SCSS */
        {
          test: /\.s[ac]ss$/i,
          exclude: /old/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                sourceMap: true,
                importLoaders: 2,
                modules: false,
              },
            },
            {
              loader: "postcss-loader",
              options: {
                sourceMap: !isProduction,
              },
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: !isProduction,
                sassOptions: {
                  silenceDeprecations: [
                    "legacy-js-api",
                    "import",
                    "global-builtin",
                  ],
                  outputStyle: isProduction ? "compressed" : "expanded",
                },
              },
            },
          ],
        },
      ],
    },

    plugins: [
      new ESLintPlugin(),
      new StylelintPlugin({ allowEmptyInput: true }),

      ...pages.map(
        (page) =>
          new HtmlWebpackPlugin({
            template: path.join(__dirname, "src", page),
            filename: page,
            inject: "body",
            minify: false,
          }),
      ),

      new HtmlBeautifyPlugin({
        config: {
          html: {
            end_with_newline: true,
            indent_size: 2,
            indent_with_tabs: true,
            indent_inner_html: true,
            preserve_newlines: true,
          },
        },
      }),

      new MiniCssExtractPlugin({
        filename: isWordPress ? "style.css" : "css/[name].css",
      }),
      new CopyWebpackPlugin({
        patterns: [{ from: "./src/assets", to: "assets/" }],
      }),

      isWordPress && new WordPressThemeHeaderPlugin(),

      isProduction &&
        new FaviconsWebpackPlugin({
          logo: "./src/assets/favicons/favicon.png",
          prefix: "assets/favicons/",
          favicons: {
            icons: {
              favicons: true,
              android: false,
              appleIcon: false,
              appleStartup: false,
              windows: false,
              yandex: false,
            },
          },
        }),
    ].filter(Boolean),

    devServer: {
      hot: true,
      port: "auto",
      static: path.resolve(__dirname, "dist"),
      watchFiles: ["src/**/*.html"],
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },

    optimization: {
      minimize: isProduction,
      minimizer: [
        new CssMinimizerPlugin(),
        new TerserPlugin({
          parallel: true,
          extractComments: false,
        }),
      ],
    },

    performance: {
      hints: isProduction ? "warning" : false,
    },
  };
};
