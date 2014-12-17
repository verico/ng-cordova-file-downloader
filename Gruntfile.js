module.exports = function(grunt) {

// 1. All configuration goes here

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        karma: {
            unit: {
                configFile: 'karma.config.js'
            }
        },
        clean: {
            build: {
                src: [ 'coverage', 'build' ],
                options: { force: true }
            }
        },
        concat: {
            dist: {
                src: [
                    'src/bootstrap.js',
                    'src/**/*.js'
                ],
                dest: 'ng-cordova-file-downloader.js'
            }
        },
        ngmin: {
            all:{
                src:['ng-cordova-file-downloader.js'],
                dest: 'build/ng-cordova-file-downloader.ng.js'
            }
        },
        uglify: {
            build: {
                src: 'build/ng-cordova-file-downloader.ng.js',
                dest: 'ng-cordova-file-downloader.min.js'
            }
        }
    });

    //Modules
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.loadNpmTasks('grunt-ngmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');


    grunt.registerTask('build', ['clean','concat','ngmin','uglify']);
    grunt.registerTask('default', 'build');
};