module.exports = {
  plugins: [
    require('autoprefixer')({
      overrideBrowserslist: ['Edge 16']
    }),
    ...(process.env.NODE_ENV === 'production' ? [require('cssnano')({
      preset: 'default'
    })] : [])
  ]
};
  