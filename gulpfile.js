var del = require('del');
var gulp = require("gulp");
var run = require('run-sequence');
var $ = require('gulp-load-plugins')();

var config = {
    assets: 'assets',
    public: 'public',
    templates: 'views'
};

gulp.task('styles', function() {
    return gulp.src(config.assets + '/styles/**/*.scss')
        .pipe($.sass({
            style: 'expanded',
            onError: function( error ) {
                $.notify().write( error );
            }
        }))
        .pipe( $.autoprefixer('last 2 versions') )
        .pipe( $.csso() )
        .pipe( gulp.dest( config.public + '/styles' ) );
});

gulp.task('scripts', function() {
    var assets = $.useref.assets({
        searchPath: '/assets'
    });

    return gulp.src( config.templates + '/layout.html' )
        .pipe( assets )
        .pipe( $.uglify() )
        .pipe( gulp.dest( config.public ) );
});

gulp.task('watch', function() {
    gulp.watch( config.assets + '/styles/**/*.scss', ['styles'] );
});

gulp.task('copy-images', function() {
    gulp.src( config.assets + '/images/**', { base: '' } )
        .pipe(gulp.dest( config.public + '/images' ));
});

gulp.task('copy-scripts', function() {
    return gulp.src( config.assets + '/scripts/**', { base: '' } )
        .pipe(gulp.dest( config.public + '/scripts' ));
});


gulp.task('clean', function( callback ) {
    del( [ config.public ], callback );
});


gulp.task('default', function( callback ) {
    run('clean', ['copy-images', 'copy-scripts', 'styles'], ['watch'], callback);
});
