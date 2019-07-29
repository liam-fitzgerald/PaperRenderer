// Gulp plugins
var gulp = require("gulp");
var rollup = require("gulp-better-rollup");
var cssimport = require('gulp-cssimport');
var cssnano = require('gulp-cssnano');
var minify = require("gulp-minify");
var sucrase = require("@sucrase/gulp-plugin");
var rename = require("gulp-rename");
var exec = require('child_process').exec;
var gzip = require('gulp-gzip')
var server = require("gulp-server-livereload");

// Rollup plugins
var resolve = require("rollup-plugin-node-resolve");
var commonjs = require("rollup-plugin-commonjs");
var replace = require("rollup-plugin-replace");
var json = require("rollup-plugin-json");
var builtins = require("rollup-plugin-node-builtins");
var rootImport = require("rollup-plugin-root-import");
var globals = require("rollup-plugin-node-globals");
// var babel = require("rollup-plugin-babel");
var babel = require("gulp-babel");

// Package.json
var pkg = require("./package.json");

const plugins = {
  // gulp
  minify: minify,
  sucrase: sucrase,
  rename: rename,
  exec: exec,
  // rollup
  rollup: rollup,
  resolve: resolve,
  commonjs: commonjs,
  replace: replace,
  json: json,
  builtins: builtins,
  rootImport: rootImport,
  globals: globals,
  babel: babel,
};

function getTask(task, src, dest, pkg) {
  return require("./gulp/" + task)(gulp, plugins, src, dest);
}


var PATHS = {
  src: "./lib/src",
  dist: "./lib/dist",
  preview: "./preview"
};

// Build sigil-js library //////////////////////////////////////////////////////
gulp.task(
  "transpile",
  getTask(
    "js_sucrase",
    `${PATHS.src}/**/*.js`,
    `${PATHS.dist}`
  )
);


gulp.task(
  "bundle-cjs",
  getTask(
    "js_bundle_cjs",
    `${PATHS.dist}/index.js`,
    `${PATHS.dist}`,
  )
);

gulp.task('babel', function () {
  var stream = gulp
    .src(`${PATHS.dist}/**/*.js`)
    .pipe(plugins.babel({
      presets: [
        // '@babel/preset-react',
        // '@babel/preset-env',
      ],
      babelrc: false,
      // extensions: ['js'],
      plugins: [
        ["@babel/plugin-proposal-object-rest-spread", { useBuiltIns: true }]
      ],
      // exclude: [
      //   "node_modules/**",
      //   "docs/**",
      //   "bin/**",
      //   "assets/**",
      // ]
    })
  )
  .pipe(gulp.dest(`${PATHS.dist}`))
  return stream
})

gulp.task('sucrase', function () {
  var stream = gulp
    .src(`${PATHS.src}/**/*.js`)
    .pipe(plugins.sucrase({
      transforms: [
        'jsx',
      ],
    })
  )
  .pipe(gulp.dest(`${PATHS.dist}`))
  return stream
})

gulp.task('copy-template-json', function () {
  return gulp
    .src(`${PATHS.src}/templates.json`)
    .pipe(gulp.dest(`${PATHS.dist}`))
})

gulp.task('copy-sample-wallets', function () {
  return gulp
    .src(`${PATHS.preview}/src/js/sampleWallets`)
    .pipe(gulp.dest(`${PATHS.preview}/dist`))
})

gulp.task(
  "minify",
  getTask(
    "js_minify",
    `${PATHS.dist}/index.js`,
    `${PATHS.dist}`,
  )
);


gulp.task('gzip', function () {
  return gulp
    .src(`${PATHS.dist}/index-min.js`)
    .pipe(gzip())
    .pipe(gulp.dest(`${PATHS.dist}`));
});


gulp.task(
  'default',
  gulp.series(
    'copy-template-json',
    'sucrase',
    'babel',
    'bundle-cjs',
    // 'minify',
    // 'gzip'
  )
)

// Build and serve preview site ////////////////////////////////////////////////

gulp.task(
  "site-transpile",
  getTask("js_sucrase", `${PATHS.preview}/src/**/*.js`, `${PATHS.preview}/dist`)
);

gulp.task(
  "site-bundle",
  getTask(
    "js_bundle_cjs",
    `${PATHS.preview}/dist/js/index.js`,
    `${PATHS.preview}/dist/js`
  )
);

gulp.task(
  "copy-site-html",
  getTask("copy", `${PATHS.preview}/src/index.html`, `${PATHS.preview}/dist`)
);

gulp.task(
  "copy-site-assets",
  getTask("copy", `${PATHS.preview}/src/assets/**/*.*`, `${PATHS.preview}/dist/assets`)
);


gulp.task("site-react", gulp.series("site-transpile", "site-bundle"));

// TODO: Change to SASS
gulp.task("site-css", function() {
  return gulp
    .src(`${PATHS.preview}/src/css/index.css`)
    .pipe(cssimport())
    .pipe(cssnano())
    .pipe(gulp.dest(`${PATHS.preview}/dist/css`));
});

gulp.task("watch-site-react", function() {
  gulp.watch(`${PATHS.preview}/src/js/**/*.{js,json}`, gulp.series("site-react"));
  gulp.watch(`./lib/dist/*.js`, gulp.series("site-react"));
});

// TODO: Change to SASS
gulp.task("watch-site-css", function() {
  gulp.watch(`${PATHS.preview}/src/css/**/*.css`, gulp.series("site-css"));
});

gulp.task("watch-site-assets", function() {
  gulp.watch(`${PATHS.preview}/src/assets/**/*.*`, gulp.series("copy-site-assets"));
});

gulp.task("site-webserver", function() {
  gulp.src(`${PATHS.preview}/dist`).pipe(
    server({
      livereload: true,
      open: true,
      port: 3001,
      defaultFile: "index.html"
    })
  );
});

gulp.task(
  "preview",
  gulp.series(
    gulp.series('copy-sample-wallets', "site-react", "site-css", "copy-site-assets", "copy-site-html"),
    gulp.parallel(
      "watch-site-react",
      "watch-site-css",
      "watch-site-assets",
      "site-webserver"
    )
  )
);
