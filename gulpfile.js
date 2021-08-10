const { src, dest, watch, series, parallel } = require('gulp');
const cheerio = require('gulp-cheerio'); // Jquery syntax
const imagemin = require('gulp-imagemin');
const pug = require('gulp-pug'); //temlating
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const sass = require('gulp-sass')(require('sass')); //theming
const sourcemaps = require('gulp-sourcemaps');
const svgmin = require('gulp-svgmin'); // svg minification
const svgstore = require('gulp-svgstore'); // svg combine
const terser = require('gulp-terser');
//postCSS stuff
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const postcssNormalize = require('postcss-normalize');
// Files Paths
const paths = {
  cache: {
    src: ['./dist/**/*.html'],
    dest: './dist/',
  },
  images: {
    src: ['./src/images/**/*'],
    svg: ['./src/svg/**/*'],
    dest: './dist/assets/images/',
  },
  
  scripts: {
    src: ['./src/scripts/**/*.js'],
    dest: './dist/assets/',
  },
  theme: {
    src: ['./src/theme/**/*.+(scss|sass)'],
    dest: './dist/assets/',
  },
  views: {
    src: ['./src/templates/views/*.pug'],
    dest: './dist/',
  },
};

function cacheCleaner() {
  return src(paths.cache.src)
    .pipe(replace(/cache=\d+/g, 'cache=' + new Date().getTime()))
    .pipe(dest(paths.cache.dest));
}

function imgOptimizer() {
  return src(paths.images.src)
    .pipe(imagemin().on('error', (error) => console.log(error)))
    .pipe(dest(paths.images.dest));
}


function pageBuilder() {
  return src(paths.views.src)
    .pipe(pug({pretty: true,}))
    .pipe(dest(paths.theme.dest));
}

function scriptsBuilder() {
  return src(paths.scripts.src)
  .pipe(sourcemaps.init())
  .pipe(terser().on('error', (error) => console.log(error)))
  .pipe(rename({ suffix: '.min' }))
  .pipe(sourcemaps.write('.'))
  .pipe(dest(paths.scripts.dest));
}

function themeBuilder() {
  var plugins = [
    postcssNormalize(),
    autoprefixer(),
    cssnano()
  ];
  return src(paths.theme.src)
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss(plugins))
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(paths.theme.dest));
}

function svgSpriter() {
  return src(paths.images.svg)
      .pipe(svgmin()) 
      .pipe(svgstore({
        fileName: 'sprite.svg',
      }),
      )
      .pipe(
        cheerio({
          run: function($) {
            $('[fill]').removeAttr('fill');
          },
          parserOptions: {
            xmlMode: true,
          },
        }),
      )
      .pipe(dest(paths.images.dest));
}

function watcher() {
  watch(paths.images.src, imgOptimizer);
  watch(paths.images.svg, svgSpriter);
  watch(paths.scripts.src, parallel(scriptsBuilder, cacheCleaner));
  watch(paths.theme.src, parallel(themeBuilder, cacheCleaner));
  watch(paths.views.src, series(pageBuilder, cacheCleaner));  
}

exports.imgOptimizer = imgOptimizer;
exports.pageBuilder = pageBuilder;
exports.cacheCleaner = cacheCleaner;
exports.scriptsBuilder = scriptsBuilder;
exports.svgSpriter = svgSpriter;
exports.themeBuilder = themeBuilder;
exports.watcher = watcher;
exports.default = series(
  parallel(imgOptimizer, svgSpriter, pageBuilder, scriptsBuilder, themeBuilder),
  cacheCleaner, watcher);