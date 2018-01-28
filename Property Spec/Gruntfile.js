module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        config: {
            // Configurable paths
            app: 'app',
            temp: 'temp',
            dist: 'dist',
            env: 'https://api.appmachine.com/v1/javascript'
        },
        appMachine: {
            appKey: 'zvuQ3QF8oc2HtppCua8FwsgIcGXZmWCeLAW8hxNa',
            clientKey: 'Cms9ADwosptCCYeyUciP8DxrQiIdIXyQrpCXla4L',
            blockId: '38560eaf5cd711e7b1240003ffbb5e34'
        },
        clean: {
            tmp: ['<%= config.temp %>'],
            dist: ['<%= config.dist %>'],
            sync: ['bridge', '<%= config.temp %>'],
            all: ['bridge', '<%= config.temp %>', '<%= config.app %>']
        },
        zip: {
            app: {
                src: '<%= config.dist %>/**/*',
                dest: '<%= config.temp %>/code.zip',
                cwd: '<%= config.dist %>'
            }
        },
        unzip: {
            bridge: {
                src: '<%= config.temp %>/bridge.zip',
                dest: 'bridge'
            },
            app: {
                src: '<%= config.temp %>/app.zip',
                dest: '<%= config.app %>'
            }
        },

        curl: {
            syncBrigde: {
                src: {
                    url: '<%= config.env %>?target=bridge',
                    method: 'GET',
                    headers: {
                        'AM-AppKey': '<%= appMachine.appKey %>',
                        'AM-ClientKey': '<%= appMachine.clientKey %>',
                        'AM-TargetId': '<%= appMachine.blockId %>'
                    }
                },
                dest: '<%= config.temp %>/bridge.zip'
            },
            syncApp: {
                src: {
                    url: '<%= config.env %>?target=app',
                    method: 'GET',
                    headers: {
                        'AM-AppKey': '<%= appMachine.appKey %>',
                        'AM-ClientKey': '<%= appMachine.clientKey %>',
                        'AM-TargetId': '<%= appMachine.blockId %>'
                    }
                },
                dest: '<%= config.temp %>/app.zip'
            },
        },

        http_upload: {
            app: {
                options: {
                    url: '<%= config.env %>',
                    method: 'POST',
                    headers: {
                        'AM-AppKey': '<%= appMachine.appKey %>',
                        'AM-ClientKey': '<%= appMachine.clientKey %>',
                        'AM-TargetId': '<%= appMachine.blockId %>'
                    }
                },
                src: '<%= config.temp %>/code.zip',
                dest: 'block'
            },
        },

        copy: {
            dist: {
                expand: true,
                dot: true,
                dest: '<%= config.dist %>/',
                cwd: '<%= config.app %>/',
                src: [
                    '**'
                ]
            }
        },

        connect: {
            options: {
                port: grunt.option('port') || 1337,
                livereload: grunt.option('livereload') || 35729,
                // Change this to '0.0.0.0' to access the server from outside
                hostname: grunt.option('hostname') || 'localhost'
            },
            server: {
                options: {
                    //open: !grunt.option('no-open'),
                    open: {
                        target: 'http://localhost:' + (grunt.option('port') || 1337) + '/<%= config.app %>'
                    },
                    livereload: false
                }
            }
        }
    });

    // Load the plugin(s).
    grunt.loadNpmTasks('grunt-zip');
    grunt.loadNpmTasks('grunt-curl');
    grunt.loadNpmTasks('grunt-http-upload');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-connect');

    // Default task(s).
    grunt.registerTask('default', []);
    grunt.registerTask('init', ['get:all', 'serve']);
    grunt.registerTask('get', ['clean:sync', 'curl:syncBrigde', 'unzip:bridge']);
    grunt.registerTask('get:all', ['clean:all', 'curl:syncBrigde', 'curl:syncApp', 'unzip:bridge', 'unzip:app']);
    grunt.registerTask('publish', ['clean:tmp', 'clean:dist', 'copy:dist', 'zip:app', 'http_upload:app']);
    grunt.registerTask('serve', ['connect:server:keepalive']);
};