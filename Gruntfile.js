module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    var parseScripts = [
        '<%= config.assets %>/scripts/chart.js',
        '<%= config.assets %>/scripts/moment.js',
        '<%= config.assets %>/scripts/underscore.js',
        '<%= config.assets %>/scripts/jQuery.payment.js',
        '<%= config.assets %>/scripts/donateServ.js'
    ];

    grunt.initConfig({
        config: {
            assets: 'assets',
            parse: 'public',
            templates: 'views'
        },

        watch: {
            livereload: {
                options: { livereload: true },
                files: [
                    '<%= config.parse %>/**/*.{css,js}',
                    '<%= config.templates %>/**/*.{html,twig}'
                ]
            },
            scss: {
                files: ['<%= config.assets %>/styles/*.scss'],
                tasks: ['sass:parse']
            },
            js: {
                files: ['<%= config.assets %>/**/*.js'],
                tasks: ['uglify:parse']
            }
        },

        clean: {
            parse: ["<%= config.parse %>"]
        },

        uglify: {
            parse: {
                options: {
                    sourceMap: true
                },
                files: {
                    '<%= config.parse %>/scripts/donateServ.js': parseScripts
                }
            }
        },

        copy: {
            parse: {
                files: [
                    { expand: true, cwd: '<%= config.assets %>/images', src: ['**'], dest: '<%= config.parse %>/images/' },
                    { expand: true, cwd: '<%= config.assets %>/fonts', src: ['**'], dest: '<%= config.parse %>/fonts/' }
                ]
            }
        },

        sass: {
            parse: {
                options: {
                    outputStyle: 'compressed',
                    sourceComments: 'map'
                },
                files: {
                    '<%= config.parse %>/styles/donateserv.css': '<%= config.assets %>/styles/donateserv.scss'
                }
            },
        }
    });


    grunt.registerTask('default', ['clean:parse', 'uglify:parse', 'copy:parse', 'sass:parse', 'watch']);
};
