module.exports = ({ env }) => ({
  syntax: 'postcss-scss',
  map: env !== 'production',
  plugins: {
    autoprefixer: {},
    'postcss-sort-media-queries': {},
    ...(env === 'production' && {
      cssnano: {
        preset: ['advanced', {
          reduceIdents: false,
          zindex: false,
          mergeIdents: false,
          autoprefixer: false,
          normalizePositions: false,
        }],
      },
    }),
  },
});
