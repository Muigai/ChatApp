var gulp = require('gulp');
var tslint = require("gulp-tslint");
var gutil = require("gulp-util");
var browserify = require('browserify');
var watchify = require("watchify");
var source = require('vinyl-source-stream');
var tsify = require('tsify');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var buffer = require('vinyl-buffer');
var paths = {
    pages: ['src/*.html', 'src/*.css']
};

gulp.task("lint", function () {
    return gulp.src([
        "src/*.ts"
    ])
        .pipe(tslint({}));
    //.pipe(tslint.report("verbose"));
});

gulp.task('copyHtml', function () {
    return gulp.src(paths.pages)
        .pipe(gulp.dest('dist'));
});

var watchedBrowserify = watchify(browserify({
    basedir: '.',
    debug: true,
    entries: ['src/spa-dummy-data.ts'],
    cache: {},
    packageCache: {}
}).plugin(tsify));

function bundle() {
    return watchedBrowserify
        .plugin(tsify)
        .transform('babelify', {
            presets: ['es2015'],
            extensions: ['.ts']
        })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist'));
}

gulp.task('default', ['lint', 'copyHtml'], bundle);

watchedBrowserify.on("update", bundle);

watchedBrowserify.on("log", gutil.log);