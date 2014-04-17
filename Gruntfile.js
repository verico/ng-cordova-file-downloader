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
        },
        shell: {
            install: {
                options: { stdout: true },
                command: [
                    'npm install',
                    'bower install'
                ].join('&&')
            }
        },
        watch: {
            scripts: {
                files: ['src/**/*.js', 'tests/**/*.js'],
                tasks: ['concat'],
                options: {
                    spawn: false
                }
            }
        }
    });

    //Modules
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-ngmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-watch');

    //Tasks
    grunt.registerTask('install', ['shell:install']);
    grunt.registerTask('build', ['clean','concat','karma','ngmin','uglify']);
    grunt.registerTask('default', ['install', 'build']);
};