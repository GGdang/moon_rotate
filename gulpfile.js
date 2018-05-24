var gulp = require('gulp');
//編譯SASS
var sass = require('gulp-sass');
//自動判斷前措詞
var autoprefixer = require('gulp-autoprefixer');
//編譯pug
var pug = require('gulp-pug');
//監控檔案
var watch = require('gulp-watch');

var postcss = require('gulp-postcss');
//編譯出錯時不停止gulp
var plumber = require('gulp-plumber');
//編譯ES6
var babel = require('gulp-babel');
//把JS檔合併成一個
var concat = require('gulp-concat');
//將壓縮的js檔在未壓縮的位置標記出來
var sourcemaps = require('gulp-sourcemaps');
//把css檔合併
var concatCss = require('gulp-concat-css');
//載入順序
var order = require('gulp-order');
//建立伺服器
var browserSync = require('browser-sync').create();
//壓縮css
var cleanCSS = require('gulp-clean-css');
//壓縮js
var uglify = require('gulp-uglify');
//將public後的版本，上傳到github上並建立pages
var ghPages = require('gulp-gh-pages');

//刪除資料夾
var clean = require('gulp-clean');

//依序執行gulp方法
var gulpSequence = require('gulp-sequence');

//圖片壓縮
var imagemin = require('gulp-imagemin');

//壓縮HTML
var htmlmin = require('gulp-htmlmin');

//判斷envOptions環境而選擇要執行甚麼 
var gulpif = require('gulp-if');

/* 
        在cmd中改變env值方法為 
        gulp 執行的方法名字 --env 改變的內容
    ex: gulp tranSass --env public   
*/

//設定gulp環境(ex:開發環境時，不壓縮檔案---發佈時，壓縮檔案)
var minimist = require('minimist');
var envOptions = {
    string:'env',
    default:{ env: 'develop' }
}

/* ps 如要排除不執行的檔案的寫法 */
//  gulp.src('css/**/!(_)*; //排除以_开头的文件
//  编译src目录下的所有pug文件
//  除了reset.pug和test.pug（**匹配src/pug的0个或多个子文件夹）	
//  gulp.src(['./src/pug/*.pug','!src/pug/**/{reset,test}.pug'])

//文件路徑
var path = {
    pug:{
        src:'src/**/*.pug',
        dest:'dist/',
        watch:'src/**/*.pug'
    },
    sass:{
        src:['src/css/**/*.sass','src/css/**/*.scss'],
        dest:'dist/css/',
        watch:['src/css/**/*.sass','src/css/**/*.scss']
    },
    js:{
        src:'src/js/**/*.js',
        dest:'dist/js/',
        watch:'src/js/**/*.js'
    },
    img:{
        src:'src/images/**/*',
        dest:'dist/images/',
        watch:'src/images/**/*'
    }
}


var options = minimist(process.argv.slice(2),envOptions);
console.log(options);

gulp.task('clean', function(){
    return gulp.src(['./.tmp','./dist','./.publish'],{read:false}).pipe(clean());
});

gulp.task('tranPug', function buildHTML() {
    return gulp.src('./src/**/*.pug')
    .pipe(plumber())
    .pipe(pug({
      // Your options in here.
      pretty:true,
    }))
    .pipe(gulpif(options.env === 'public', htmlmin({collapseWhitespace:true})))
    .pipe(gulp.dest('./dist/'))
    .pipe(browserSync.stream())
  });

gulp.task('copyhtml',function(){
    return gulp.src('./src/**/*.html')
    .pipe(htmlmin({collapseWhitespace:true}))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('tranSass',function(){
    return gulp.src(['./src/css/**/*.scss','./src/css/**/*.sass'])
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(sass().on('error',sass.logError))
    //編成CSS
    .pipe(autoprefixer({
        browsers:['last 2 version']
    }))
    .pipe(concatCss("all.css"))
    .pipe(gulpif(options.env === 'public',cleanCSS()))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/css'))
    //變動後重新整理網頁
    .pipe(browserSync.stream());
})

gulp.task('babel',function(){
    return gulp.src('./src/js/**/*.js')
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(babel({
        presets:['env']
    }))
    .pipe(concat('all.js'))
    .pipe(gulpif(options.env === 'public',uglify({
        compress:{
            drop_console:true
        }
    })))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'))
    .pipe(browserSync.stream())
})

gulp.task('vendorJs',function(){
    return gulp.src(['node_modules/vue/dist/vue.js'])
    .pipe(order([]))
    .pipe(concat('vendors.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/js'))
})

gulp.task('browser-sync',function(){
    browserSync.init({
        server:{
            baseDir:'./dist'
        },
        reloadDebounce: 1000
    })
})
//重新編譯後要重整網頁需再編譯器最後加上
//.pipe(browserSync.stream());


gulp.task('imagemin',function(){
    return gulp.src('src/images/*')
    .pipe(gulpif(options.env === 'public',imagemin()))
    .pipe(gulp.dest('dist/images'))
})

gulp.task('public',function(){
    return gulp.src(['/dist/**/*'])
    .pipe(ghPages());
})

gulp.task('watch',function(){
    gulp.watch('src/**/*.pug',['tranPug'])
    gulp.watch('src/css/**/*.scss',['tranSass'])
    gulp.watch('src/css/**/*.sass',['tranSass'])
    gulp.watch('src/js/**/*.js',['babel'])
    gulp.watch('src/images/*',['imagemin'])
})

gulp.task('build',gulpSequence('clean','tranPug','tranSass','babel','imagemin'))

gulp.task('default',['tranPug','tranSass','babel','imagemin','browser-sync','watch'])