const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	experiments: {
		asyncWebAssembly: true,
	},
	mode: 'development',
	entry: {
		auth: './src/auth.js',
		main: './src/index.js'
	},
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
		],
	},
	devServer: {
		static: {
			directory: path.join(__dirname, 'dist'),
		},
		host: '0.0.0.0',
		server: 'https',
		compress: true,
		port: 8081,
	},
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
		clean: true,
	},
	plugins: [
		new ESLintPlugin(),
		new HtmlWebpackPlugin({
			template: './src/auth.html',
			filename: 'index.html',
			chunks: ['auth']
		}),
		new HtmlWebpackPlugin({
            template: './src/index.html',
			filename: 'main.html',
			chunks: ['main']
		}),
		new CopyPlugin({
			patterns: [{ from: 'src/assets', to: 'assets' }],
		}),
	],
	devtool: 'source-map',
};
