var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var less = require('gulp-less');
var minifyCSS = require('gulp-minify-css');
var runSequence = require('run-sequence');
var del = require('del');

var config = {
  src: {
    appJs:[
      'app/js/config/*.js',
      'app/js/components/*.js',
      'app/js/directives/*.js',
      'app/js/services/*.js'
    ],
    appLess: [
      'app/less/**/*.less'
    ],
    libsJs: [
      'app/libs/jquery/dist/jquery.min.js',
      'app/libs/bootstrap/dist/js/bootstrap.min.js',
      'app/libs/angular/angular.min.js',
      'app/libs/angular-sanitize/angular-sanitize.min.js',
      'app/libs/angular-route/angular-route.min.js',
      'app/libs/angular-material/angular-material.min.js',
      'app/libs/angular-animate/angular-animate.min.js',
      'app/libs/angular-aria/angular-aria.min.js',
      'app/libs/angular-messages/angular-messages.min.js',
      'app/libs/angular-ui-router/release/angular-ui-router.min.js',
      'app/libs/angular-bootstrap/ui-bootstrap.min.js',
      'app/libs/angular-bootstrap/ui-bootstrap-tpls.js',
      'app/libs/socket.io-client/dist/socket.io.js'

    ],
    libsCSS: [
      'app/libs/angular-material/angular-material.min.css',
      'app/libs/bootstrap/dist/css/bootstrap.min.css',
      'app/libs/font-awesome/css/font-awesome.min.css',
      'app/libs/animate.css/animate.min.css',
      'app/libs/angular-bootstrap/ui-bootstrap-csp.css'
    ],
    libsFonts: [
      'app/libs/font-awesome/fonts/**',
      'app/libs/bootstrap/fonts/**'
    ]
  },
  dest:{
    appJs:'public/js',
    appCSS:'public/css',
    appFonts:'public/fonts'
  }
};

gulp.task('clean', function(){
  var files = [].concat(
		config.dest.appJs,
		config.dest.appCSS
	);

  return del.sync(files, {force: true });
});

gulp.task('app-js', function(){
  // Bundle all JS files into one files
  return gulp.src(config.src.appJs)
      .pipe(concat('bundle.js'))
      .pipe(gulp.dest(config.dest.appJs));
});

gulp.task('app-less', function(){
  // Build all Less files into one min CSS
  return gulp.src(config.src.appLess)
      .pipe(concat('styles.min.css'))
      .pipe(less())
      .pipe(minifyCSS())
      .pipe(gulp.dest(config.dest.appCSS));
});

gulp.task('lib-js', function(){
  // Bundle all JS Library files into one files
  return gulp.src(config.src.libsJs)
      .pipe(concat('libs.min.js'))
      .pipe(gulp.dest(config.dest.appJs));
});
gulp.task('lib-css', function(){
  // Bundle all JS Library files into one files
  return gulp.src(config.src.libsCSS)
      .pipe(concat('libs.min.css'))
      .pipe(gulp.dest(config.dest.appCSS));
});
gulp.task('lib-fonts', function(){
  // Move all fonts files into one the public fonts folder
  return gulp.src(config.src.libsFonts)
      .pipe(gulp.dest(config.dest.appFonts));
});

gulp.task('build', function(done){
  runSequence('clean', ['app-js', 'app-less', 'lib-js', 'lib-css','lib-fonts'], done);
});

gulp.task('watch', function() {
  gulp.watch(config.src.appJs, ['build']);
  gulp.watch(config.src.appLess, ['build']);
  gulp.watch(config.src.libsJs, ['lib-js']);
  gulp.watch(config.src.libsCSS, ['lib-css']);
  gulp.watch(config.src.libsFonts, ['lib-fonts']);
});

//gulp.task('default', ['build'], function () { });
gulp.task('default', ['watch','build']);
