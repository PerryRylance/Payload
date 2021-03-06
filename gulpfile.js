const
	gulp			= require('gulp'),
	del				= require('del'),
	source			= require('vinyl-source-stream'),
	buffer			= require('vinyl-buffer'),
	sourcemaps		= require('gulp-sourcemaps'),
	
	babel			= require('gulp-babel'),
	babelify		= require('babelify'),
	log				= require('gulplog'),
	inject			= require('gulp-inject'),
	injectString	= require('gulp-inject-string'),
	browserify		= require('browserify'),
	
	concat			= require('gulp-concat'),
	deporder		= require('gulp-deporder'),
	
	uglify			= require("gulp-uglify"),
	uglifycss		= require('gulp-uglifycss'),
	include			= require("gulp-html-tag-include"),
	browserSync		= require('browser-sync'),
	directoryMap	= require('gulp-directory-map'),
	gulpCopy		= require('gulp-copy'),
	sass			= require('gulp-sass');

sass.compiler		= require('node-sass');

const server = browserSync.create();

const paths = {
	assets:		"src/assets/**/*",
    scripts:	"src/js/**/*.js",
	html:		"src/html/**/*.html",
	css:		"src/css/**/*.scss"
};

function assets()
{
	return gulp.src(paths.assets)
		.pipe(directoryMap({
			filename: "assets.json"
		}))
		.pipe(gulp.dest("dist"));
}

function copy()
{
	return gulp.src(paths.assets)
		.pipe(gulpCopy("dist/assets", {prefix: 2}));
}

function js()
{
	var b = browserify({
		entries: [
			'./src/js/entry.js',
			// NB: Temporary solution until I can figure out how to properly import these modules. Maybe try Rollup instead of Browserify?
			'./src/lib/MTLLoader.js',
			'./src/lib/OBJLoader.js'
		],
		debug: true
	}).transform(babelify, {
		presets: ['@babel/preset-env']
	});
	
	del("dist/js/**/*");
	
	return b.bundle()
		.pipe(source("entry.js"))
		.pipe(buffer())
		.pipe(sourcemaps.init({
			loadMaps: true
		}))
		// .pipe(uglify())
		.on("error", log.error)
		.pipe(injectString.prepend("jQuery(function($) {"))
		.pipe(injectString.append("});"))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./dist/js/'));
}

function css()
{
	return gulp.src(paths.css)
		.pipe(sourcemaps.init())
		.pipe(concat("main.css"))
		.pipe(sass().on("error", sass.logError))
		.pipe(uglifycss())
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest("dist/css/"));
}

function html()
{
	return gulp.src(paths.html)
		.pipe(include())
		.pipe(gulp.dest("dist"));
}

function reload(done)
{
	server.reload();
	done();
}

function serve(done)
{
	server.init({
		server: {
			baseDir: "./dist"
		}
	});
	
	done();
}

assets();
copy();

const task = gulp.parallel(html, js, css);

const watch = () => gulp.watch("src/**/(*.js|*.html|*.scss)", gulp.series(task, reload));
const dev = gulp.series(task, serve, watch);

exports.default = dev;
