const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const webpack = require('webpack');

// Konfiguracja developmentowa z centralnego pliku
const config = require('./config/development');

// Załaduj zmienne środowiskowe z odpowiedniego pliku .env
require('dotenv').config({
  path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`)
});

// Fallback dla .env.local jeśli główny plik nie istnieje
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  require('dotenv').config({
    path: path.resolve(__dirname, '.env.local')
  });
}

const isProduction = process.env.NODE_ENV === 'production';

console.log(`🔧 Webpack mode: ${isProduction ? 'production' : 'development'}`);
console.log(`📦 NODE_ENV: ${process.env.NODE_ENV}`);

module.exports = {
  mode: isProduction ? 'production' : 'development',
  
  entry: {
    // Główny punkt wejścia - zawiera główny JS i główny CSS
    main: './src/js/_app.js',
    // Editor styles - osobny entry point
    'editor-styles': './src/css/editor-styles.scss',
    // Biblioteki JS
    libs: './src/js/lib/_libraries.js',
    // Kombinowany JS (libs + main) - tworzy build-combined.js
    combined: ['./src/js/lib/_libraries.js', './src/js/_app.js']
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: (pathData) => {
      // Różne nazwy dla różnych entry points
      if (pathData.chunk.name === 'main') {
        return 'build-js.js';
      }
      if (pathData.chunk.name === 'libs') {
        return 'build-libs.js';
      }
      if (pathData.chunk.name === 'combined') {
        return 'build-combined.js';
      }
      return '[name].js';
    },
    clean: true,
    // Eksportuje biblioteki globalnie
    library: {
      type: 'window'
    }
  },

  devtool: isProduction ? false : 'source-map',

  module: {
    rules: [
      // JavaScript
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      
      // SCSS/CSS
      {
        test: /\.(scss|sass|css)$/,
        use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                url: true,
                import: true,
                sourceMap: !isProduction
              }
            },
            {
            loader: 'postcss-loader',
            options: {
                postcssOptions: {
                plugins: [
                    ['autoprefixer']
                ]
                }
            }
            },
            {
            loader: 'sass-loader',
            options: {
                implementation: require('sass'),
                sassOptions: {
                outputStyle: 'expanded',
                sourceMap: !isProduction,
                includePaths: [
                    path.resolve(__dirname, 'src/css'),
                    path.resolve(__dirname, 'node_modules')
                ]
                }
            }
            }
        ]
        },

      // Obrazy wewnątrz CSS/SCSS
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp)$/,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name][ext]'
        }
      },

      // Czcionki
      {
        test: /\.(eot|ttf|otf|woff|woff2)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]'
        }
      }
    ]
  },

  plugins: [
    new CleanWebpackPlugin(),

    new MiniCssExtractPlugin({
      filename: (pathData) => {
        if (pathData.chunk.name === 'main') {
          return 'build-style.css';
        }
        if (pathData.chunk.name === 'editor-styles') {
          return 'editor-styles.css';
        }
        if (pathData.chunk.name === 'combined') {
          return 'combined-style.css';
        }
        return '[name].css';
      }
    }),

    // Kopiowanie obrazów z folderu assets z optymalizacją
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'assets/img/**/*',
          to: 'img/[name][ext]',
          noErrorOnMissing: true
        },
        {
          from: 'assets/fonts/**/*',
          to: 'fonts/[name][ext]',
          noErrorOnMissing: true
        }
      ]
    }),

    // BrowserSync plugin - tylko w development mode
    ...(isProduction ? [] : [new BrowserSyncPlugin({
      host: 'localhost',
      port: config.WEBPACK_DEV_PORT,
      proxy: config.WORDPRESS_URL,
      files: [
        ...config.WATCH_PATHS.assets,
        ...config.WATCH_PATHS.php
      ],
      watchOptions: {
        ignoreInitial: true
      },
      ...config.BROWSERSYNC_OPTIONS,
      notify: false
    }, {
      reload: false // Webpack będzie sam zarządzał reload
    })])

    // LiveReload usunięty - używamy BrowserSync
  ],

  // Konfiguracja obserwowania plików
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: 1000
  },

  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: isProduction
          }
        }
      })
    ]
  },

  devServer: {
    static: {
      directory: path.join(__dirname, 'dist')
    },
    port: 3000,
    hot: true,
    liveReload: true,
    open: false,
    // Obserwuj pliki PHP WordPress
    watchFiles: [
      '**/*.php',
      '**/*.html',
      'dist/**/*.js',
      '*.php',
      'functions/**/*.php',
      'inc/**/*.php',
      'template-parts/**/*.php',
      'partials/**/*.php',
      'includes/**/*.php'
    ],
    // Konfiguracja dla WordPress development
    allowedHosts: 'all',
    client: {
      logging: 'info',
      overlay: {
        errors: true,
        warnings: false
      },
      progress: true
    }
  },

  resolve: {
    extensions: ['.js', '.scss', '.css'],
    modules: [
      'node_modules',
      path.resolve(__dirname, 'src'),
      path.resolve(__dirname, 'assets')
    ]
  }
};
