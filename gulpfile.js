'use strict';

const gulp = require('gulp'),
      sass = require('gulp-sass'),
      del = require('del'),
      debug = require('gulp-debug'),
      sourcemaps = require('gulp-sourcemaps'),
      gulpIf = require('gulp-if'),
      newer = require('gulp-newer'),
      autoprefixer = require('gulp-autoprefixer'),
      browserSync = require('browser-sync').create(),
      cssnano = require('gulp-cssnano'),
      
      imagemin = require('gulp-imagemin'),
      pngquant = require('imagemin-pngquant'),
      uglify = require('gulp-uglifyes'),
      rigger = require('gulp-rigger'),
      htmlmin = require('gulp-htmlmin'),
      
      csslint = require('gulp-csslint'),
      
      
      htmlhint = require("gulp-htmlhint"),
      fs = require('fs');

var isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

var path = {
    dst: { //Тут мы укажем куда складывать готовые после сборки файлы
        html: 'dst/',
        js: 'dst/js/',
        css: 'dst/css/',
        img: 'dst/img/',
        fonts: 'dst/fonts/',
        php: 'dst/php/'
    },
    src: { //Пути откуда брать исходники
        html: 'src/*.html', //Синтаксис src/*.html говорит gulp что мы хотим взять все файлы с расширением .html
        js: 'src/js/*.js',//В стилях и скриптах нам понадобятся только main файлы
        style: 'src/scss/main.scss',
        img: 'src/img/**/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        fonts: 'src/fonts/**/*.*',
        php: 'src/php/**/*.php'
    },
    watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
        html: 'src/**/*.html',
//        rigger: 'src/template/**/*.html',
        js: 'src/js/**/*.js',
        style: 'src/scss/**/*.scss',
        img: 'src/img/**/*.*',
        fonts: 'src/fonts/**/*.*',
        browserSync: 'dst/**/*.*'
    },
    debug: {
      css: 'dst/css/*.css',
      html: 'dst/*.html'
    },
    clean: './dst',
    browserSync: './dst'
};

gulp.task('styles', function(){
  
    return gulp.src(path.src.style)
        .pipe(gulpIf(isDevelopment, sourcemaps.init()))
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulpIf(isDevelopment, debug({title:"sass"})))
        .pipe(gulpIf(isDevelopment, sourcemaps.write()))
        .pipe(gulpIf(!isDevelopment, cssnano()))
        .pipe(gulp.dest(path.dst.css));
   
});

gulp.task('clean', function(){
    return del(path.clean);
});

gulp.task('html',function(){
    return gulp.src(path.src.html)
        .pipe(newer(path.src.html))
        .pipe(rigger())
        .pipe(gulpIf(!isDevelopment, htmlmin({collapseWhitespace: true})))
//        .pipe(gulpIf(isDevelopment, htmlhint()))
  
//      .pipe(gulpIf(!isDevelopment, htmlhint()))
//      .pipe(!isDevelopment, htmlhint.reporter())
  
        .pipe(gulp.dest(path.dst.html));
});

gulp.task('js',function(){
    return gulp.src(path.src.js)
      .pipe(rigger())
      .pipe(gulpIf(isDevelopment, sourcemaps.init()))
      .pipe(gulpIf(!isDevelopment, uglify()))
      .pipe(gulpIf(isDevelopment, debug({title:"js"})))
      .pipe(gulpIf(isDevelopment, sourcemaps.write()))
      .pipe(gulp.dest(path.dst.js));
});

gulp.task('img',function(){
    return gulp.src(path.src.img, {since: gulp.lastRun('img')})
        .pipe(newer(path.src.img))
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.dst.img));
});

// gulp.task('fonts',function(){
//    return gulp.src(path.src.fonts)
//        .pipe(gulp.dest(path.dst.fonts));
// });

gulp.task('php',function(){
    return gulp.src(path.src.php)
        .pipe(gulp.dest(path.dst.php));
});

gulp.task('watch',function(){
    gulp.watch(path.watch.style, gulp.series('styles'));
    gulp.watch(path.watch.html, gulp.series('html'));
   // gulp.watch(path.watch.rigger, gulp.series('html'));
    gulp.watch(path.watch.img, gulp.series('img'));
//    gulp.watch(path.watch.fonts, gulp.series('fonts'));
    gulp.watch(path.watch.js, gulp.series('js'));
    
});

gulp.task('css:debug', function(cb){
  var output = '';
  
  return gulp.src(path.debug.css)
  
  
    .pipe(csslint({
      'shorthand': true,
      'import': false,
      'box-model': false,
      'order-alphabetical':false,
      'universal-selector': false,
      'box-model': false,
      'compatible-vendor-prefixes': false,
      'fallback-colors': false
    }))
    .pipe(csslint.formatter('junit-xml', {logger: function(str) { output += str; }}))
    .on('end', function(err) {
      if (err) return cb(err);
      fs.writeFile('./tmp/junit.xml', output, cb);
    });
});

gulp.task('html:debug', function(cb){
//  var output = '';
  
  return gulp.src(path.debug.html)
  
  .pipe(htmlhint())
  .pipe(htmlhint.reporter())
//  .pipe(htmlhint.failOnError( {suppress: true}))
////  .pipe(htmlhint.failAfterError( suppress: true))
//
////    .pipe(csslint.formatter('junit-xml', {logger: function(str) { output += str; }}))
//    .on('end', function(err) {
//      if (err) return cb(err);
//      fs.writeFile('./tmp/html.xml', output, cb);
//    });
});

gulp.task('debug', gulp.parallel('css:debug', 'html:debug'));

gulp.task('serve',function(){
    browserSync.init({
        server: path.browserSync
    });
    browserSync.watch(path.watch.browserSync).on('change', browserSync.reload);
});


gulp.task('dst', gulp.series(
    'clean',
    gulp.parallel('styles', 'html', 'img', 'js', 'php')
));
gulp.task('dev', gulp.series('dst', gulp.parallel('watch', 'serve')) );



