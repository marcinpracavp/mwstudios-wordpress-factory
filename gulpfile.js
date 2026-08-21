const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass")); // Używamy dart-sass
const concat = require("gulp-concat");
const csso = require("gulp-csso");
const autoprefixer = require("gulp-autoprefixer");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const include = require("gulp-include");
const livereload = require("gulp-livereload");
const fs = require("fs");
const merge = require("merge-stream");

// Dynamiczne ładowanie gulp-imagemin
const loadImagemin = async () => (await import("gulp-imagemin")).default;

// Ścieżki
let dirs = {
    css: "src/css/**/*.scss",
    js: "src/js/*.js",
    jslib: "src/js/lib/_libraries.js",
    img: "assets/img/**/*.{png,jpg,jpeg,gif,svg,webp}",
    fonts: "assets/fonts/**/*.{eot,svg,ttf,otf,woff,woff2}",
    build: "dist/",
    buildcss: "dist/build-style.css",
    buildjs: "dist/build-js.js",
    buildjslibs: "dist/build-libs.js",
    imgdist: "dist/img/",
    fontsdist: "dist/fonts/",
};

// Zadanie: Kompilacja SCSS
gulp.task("css", function () {
    const mainCSS = gulp
        .src("src/css/style.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(
            csso({
                sourceMap: false,
                debug: false,
            })
        )
        .pipe(autoprefixer())
        .pipe(concat("build-style.css"))
        .pipe(gulp.dest(dirs.build))
        .pipe(livereload());

    const editorCSS = gulp
        .src("src/css/editor-styles.scss")
        .pipe(sass().on("error", sass.logError))
        .pipe(
            csso({
                sourceMap: false,
                debug: false,
            })
        )
        .pipe(autoprefixer())
        .pipe(concat("editor-styles.css"))
        .pipe(gulp.dest(dirs.build))
        .pipe(livereload());

    // Zwracamy zmergowany strumień, aby Gulp wiedział, że trzeba poczekać na oba.
    return merge(mainCSS, editorCSS);
});

// Zadanie: Babel i minimalizacja JS
gulp.task("js", () =>
    gulp
        .src(dirs.js)
        .pipe(
            babel({
                presets: ["@babel/preset-env"],
            })
        )
        .pipe(concat("build-js.js"))
        .pipe(uglify())
        .pipe(gulp.dest(dirs.build))
        .pipe(livereload())
);

// Zadanie: Biblioteki JS
gulp.task("jslibs", () =>
    gulp
        .src(dirs.jslib)
        .pipe(concat("build-libs.js"))
        .pipe(include())
        .pipe(uglify())
        .pipe(gulp.dest(dirs.build))
        .pipe(livereload())
);

// Zadanie: Połączenie plików JS
gulp.task("combine-jsbuild", function () {
    if (fs.existsSync(dirs.buildjs) && fs.existsSync(dirs.buildjslibs)) {
        return gulp
            .src([dirs.buildjslibs, dirs.buildjs])
            .pipe(concat("build-combined.js"))
            .pipe(gulp.dest(dirs.build));
    } else {
        console.log("Brak plików do połączenia.");
    }
});

// Zadanie: Kopiowanie i optymalizacja obrazów
gulp.task("images", async function () {
    const imagemin = await loadImagemin();
    return gulp
        .src(dirs.img)
        .pipe(imagemin())
        .pipe(gulp.dest(dirs.imgdist))
        .pipe(livereload());
});

// Zadanie: Kopiowanie czcionek
gulp.task("fonts", function () {
    return gulp
        .src(dirs.fonts)
        .pipe(gulp.dest(dirs.fontsdist))
        .pipe(livereload());
});

// Zadanie: Watcher dla PHP
gulp.task("watchphp", function () {
    return gulp.src("*.php").pipe(livereload());
});

// Zadanie: Uruchomienie Watcherów
const runWatchers = () => {
    gulp.watch(["*.php", "**/*.php"], gulp.series("watchphp"));
    gulp.watch(dirs.css, gulp.series("css"));
    gulp.watch(dirs.js, gulp.series("js"));
    gulp.watch(dirs.jslib, gulp.series("jslibs"));
    gulp.watch(dirs.img, gulp.series("images"));
    gulp.watch(dirs.fonts, gulp.series("fonts"));
    gulp.watch(
        [dirs.buildjs, dirs.buildjslibs],
        gulp.series("combine-jsbuild")
    );
    livereload.listen();
};

// Zadanie główne: Budowanie + Watchery
gulp.task("default", function () {
    if (fs.existsSync(dirs.buildjs) && fs.existsSync(dirs.buildjslibs)) {
        console.log("Uruchamianie watcherów...");
        runWatchers();
    } else {
        console.log("Budowanie aplikacji...");
        gulp.series("build")();
        runWatchers();
    }
});

// Zadanie: Budowanie
gulp.task(
    "build",
    gulp.series("css", "js", "jslibs", "images", "fonts", "combine-jsbuild")
);