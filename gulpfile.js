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
      'ps118/js/config/*.js',
      'ps118/js/components/*.js',
      'ps118/js/directives/*.js',
      'ps118/js/services/*.js'
    ],
    appLess: [
      'ps118/less/**/*.less'
    ],
    libsJs: [
      'ps118/libs/jquery/dist/jquery.min.js',
      'ps118/libs/bootstrap/dist/js/bootstrap.min.js',
      'ps118/libs/angular/angular.min.js',
      'ps118/libs/angular-sanitize/angular-sanitize.min.js',
      'ps118/libs/angular-route/angular-route.min.js',
      'ps118/libs/angular-material/angular-material.min.js',
      'ps118/libs/angular-animate/angular-animate.min.js',
      'ps118/libs/angular-aria/angular-aria.min.js',
      'ps118/libs/angular-messages/angular-messages.min.js',
      'ps118/libs/angular-ui-router/release/angular-ui-router.min.js',
      'ps118/libs/angular-bootstrap/ui-bootstrap.min.js',
      'ps118/libs/angular-bootstrap/ui-bootstrap-tpls.js',
      'ps118/libs/socket.io-client/dist/socket.io.js'

    ],
    libsCSS: [
      'ps118/libs/angular-material/angular-material.min.css',
      'ps118/libs/bootstrap/dist/css/bootstrap.min.css',
      'ps118/libs/font-awesome/css/font-awesome.min.css',
      'ps118/libs/animate.css/animate.min.css',
      'ps118/libs/angular-bootstrap/ui-bootstrap-csp.css'
    ],
    libsFonts: [
      'ps118/libs/font-awesome/fonts/**',
      'ps118/libs/bootstrap/fonts/**'
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
