module.exports = function (gulp, plugins, src, dest) {
    return function () {
        var stream = gulp.src(src)
          .pipe(plugins.cssfont64())
          .pipe(gulp.dest(dest));
        return stream
    };
};
