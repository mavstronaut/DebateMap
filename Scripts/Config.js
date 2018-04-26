/* eslint key-spacing:0 spaced-comment:0 */
const path = require("path")
const debug = require("debug")("app:config")
const argv = require("yargs").argv
const ip = require("ip")

const {NODE_ENV, PORT, USE_TSLOADER, BASENAME} = process.env;

debug("Creating default configuration.")

const config = {};

// Environment
// ==========

let env = global.env = NODE_ENV;
let devEnv = global.devEnv = env == "development";
let prodEnv = global.prodEnv = env == "production";
let testEnv = global.testEnv = env == "test";
config.env = env;

// Default Configuration
// ==========

Object.assign(config, {
	// Project Structure
	// ----------
	path_base: path.resolve(__dirname, ".."),
	dir_client: USE_TSLOADER ? "Source" : "Source_JS",
	dir_dist: "dist",
	dir_server: "Scripts/Server",
	dir_test: "Tests",

	// Server Configuration
	// ----------
	server_host: ip.address(), // use string "localhost" to prevent exposure on local network
	server_port: PORT || 3000,

	// Compiler Configuration
	// ----------
	// remember that if you change the compiler settings, you'll need to clear the happypack cache
	compiler_babel: {
		//cacheDirectory: true,
		presets: [
			//"babel-preset-es2015",
			"babel-preset-react",
			//"babel-preset-stage-0"
		],
		plugins: [
			// from es2015
			"babel-plugin-check-es2015-constants",
			"babel-plugin-transform-es2015-arrow-functions",
			"babel-plugin-transform-es2015-block-scoped-functions",
			"babel-plugin-transform-es2015-block-scoping",
			"babel-plugin-transform-es2015-classes",
			"babel-plugin-transform-es2015-computed-properties",
			"babel-plugin-transform-es2015-destructuring",
			"babel-plugin-transform-es2015-duplicate-keys",
			//"babel-plugin-transform-es2015-for-of", // ohhh, I hate this thing... (the try-catch wrapping within transpiled for-of's)
			prodEnv && ["babel-plugin-transform-es2015-for-of", {loose: true}], // loose removes the try-catch wrapping
			"babel-plugin-transform-es2015-function-name",
			"babel-plugin-transform-es2015-literals",
			"babel-plugin-transform-es2015-modules-commonjs", // uncommented; went back to using interop... (regenerator needs it -_-)
			//["babel-plugin-transform-es2015-modules-commonjs", {strict: true, noInterop: true}],
			"babel-plugin-transform-es2015-object-super",
			"babel-plugin-transform-es2015-parameters",
			"babel-plugin-transform-es2015-shorthand-properties",
			"babel-plugin-transform-es2015-spread",
			"babel-plugin-transform-es2015-sticky-regex",
			"babel-plugin-transform-es2015-template-literals",
			"babel-plugin-transform-es2015-typeof-symbol",
			"babel-plugin-transform-es2015-unicode-regex",
			prodEnv && "babel-plugin-transform-regenerator", // for "async" transpilation; had been disabled, but found still needed for googlebot

			// from stage-0
			"babel-plugin-transform-object-rest-spread",
			"babel-plugin-transform-class-properties",

			prodEnv && "babel-plugin-transform-runtime", // for "async" transpilation; had been disabled, but found still needed for googlebot
			//["babel-plugin-transform-runtime", {"regenerator": false}],
			"babel-plugin-lodash",
			"babel-plugin-transform-decorators-legacy"
		].filter(a=>a),
	},
	// list of types: https://webpack.js.org/configuration/devtool
	// *: All "eval" ones don't work anymore with new tsc setup -- they don't show original files
	//compiler_devtool: "source-map", // shows: original (in error.stack, shows bundle line) [6s/rebuild]
	//compiler_devtool: "cheap-module-eval-source-map", // *shows: original (in error.stack, shows eval/transpiled-to-js-but-in-module line)
	//compiler_devtool: "cheap-module-source-map", // shows: original [however, for some reason it misses lots of lines -- at least in async functions]
	compiler_devtool: "cheap-source-map", // shows: transpiled-to-js [.8s/rebuild]
	//compiler_devtool: "eval", // *shows: transpiled-to-js
	compiler_fail_on_warning: false,
	compiler_quiet: false,
	compiler_public_path: "/",
	compiler_stats: {
		chunks : false,
		chunkModules : false,
		colors : true
	},

	//compiler_css_modules: true, // enable/disable css modules

 	// Test Configuration
	// ----------
	coverage_reporters: [
		{type : "text-summary"},
		{type : "lcov", dir : "coverage"}
	]
});

// All Internal Configuration Below
// Edit at Your Own Risk
// ==========
// ==========

// N.B.: globals added here must _also_ be added to .eslintrc
config.globals = {
	"process.env": {
		"NODE_ENV": JSON.stringify(config.env)
	},
	"NODE_ENV": config.env,
	"__DEV__": config.env == "development",
	"__PROD__": config.env == "production",
	"__TEST__": config.env == "test",
	"__COVERAGE__": !argv.watch && config.env === "test",
	"__BASENAME__": JSON.stringify(BASENAME || "")
}

// Utilities
// ==========

function base() {
	const args = [config.path_base].concat([].slice.call(arguments));
	return path.resolve.apply(path, args);
}

config.utils_paths = {
	base: base,
	client: base.bind(null, config.dir_client),
	dist: base.bind(null, config.dir_dist)
};

// Environment Configuration
// ==========

/*debug(`Looking for environment overrides for NODE_ENV "${config.env}".`);
const overrides = environments[config.env];
if (overrides) {
	debug("Found overrides, applying to default configuration.");
	Object.assign(config, overrides(config));
} else {
	debug("No environment overrides found, defaults will be used.");
}*/

config.compiler_public_path = devEnv
	// NOTE: In development, we use an explicit public path when the assets are served webpack by to fix this issue:
	// 	http://stackoverflow.com/questions/34133808/webpack-ots-parsing-error-loading-fonts/34133809#34133809
	//? "http://${config.server_host}:${config.server_port}/",
	? "/"
	: "/";

if (prodEnv) {
	config.compiler_fail_on_warning = false;
	config.compiler_hash_type = "chunkhash";
	//config.compiler_devtool = null;
	//config.compiler_devtool = "cheap-module-source-map";
	config.compiler_devtool = "source-map";
	config.compiler_stats = {
		chunks: true,
		chunkModules: true,
		colors: true
	};
}

// disabled for now; I've found I like the control of being able to skip reloads during change sets
config.useHotReloading = false;

module.exports = config;