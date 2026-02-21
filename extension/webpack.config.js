const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    background: './background.js',
    sidepanel: './sidepanel/index.jsx',
    content_field_detector: './content/field-detector.js',
    content_pdf_injector: './content/pdf-injector.js',
    content_form_filler: './content/form-filler.js',
    content_linkedin: './content/linkedin-easy-apply.js',
    content_linkedin_profile: './content/linkedin-profile-scraper.js',
    content_platforms: './content/platforms.js',
    content_scraper: './content/scraper.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader']
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles.css'
    }),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' }
      ]
    }),
    new HtmlWebpackPlugin({
      template: './sidepanel/index.html',
      filename: 'sidepanel/index.html',
      chunks: ['sidepanel']
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx']
  }
};
