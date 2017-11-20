const path = require("path");
const nodeExternals = require("webpack-node-externals");
const webpack = require("webpack");

const context = __dirname;

process.traceDeprecation = true; //https://github.com/webpack/loader-utils/issues/56

module.exports = {
	devtool: "nosources-source-map",

	externals: [nodeExternals()],

	target: "node",
	node: {
		__dirname: false,
		__filename: false
	},

	context,

	entry: [path.join(__dirname, "src")],

	output: {
		path: path.join(__dirname, "build/"),
		filename: "compiled.js"
	},

	plugins: [
		new webpack.DefinePlugin({
			"process.env": {
				NODE_ENV: JSON.stringify("production")
			}
		}),
		new webpack.NoEmitOnErrorsPlugin()
	],

	resolve: {
		modules: [
			path.resolve(__dirname, "src"),
			path.resolve(__dirname, "node_modules")
		],
		extensions: [".js"]
	},

	module: {
		rules: [
			{
				test: /\.js$/,
				include: [path.resolve(__dirname, "src")],

				use: [
					{
						loader: "babel-loader",
						options: {
							presets: [
								[
									"env",
									{
										targets: {
											node: "8"
										}
									}
								]
							],
							plugins: [
								"transform-object-rest-spread",
								"transform-class-properties"
							]
						}
					}
				]
			}
		]
	}
};
