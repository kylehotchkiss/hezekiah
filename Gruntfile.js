module.exports = function(grunt) {
    require('load-grunt-tasks')(grunt);

    var wordpressScripts = [
        '<%= config.assets %>/scripts/parsley.js',
        '<%= config.assets %>/scripts/jQuery.cycle2.js',
        '<%= config.assets %>/scripts/jQuery.payment.js',
        '<%= config.assets %>/scripts/jQuery.magnific.js',
        '<%= config.assets %>/scripts/jQuery.superfish.js',
        '<%= config.assets %>/scripts/jQuery.imagesLoaded.js',
        '<%= config.assets %>/scripts/jQuery.masonry.js',
        '<%= config.assets %>/scripts/illuminatenations.js'
    ];

    var parseScripts = [
        '<%= config.assets %>/scripts/chart.js',
        '<%= config.assets %>/scripts/moment.js',
        '<%= config.assets %>/scripts/underscore.js',
        '<%= config.assets %>/scripts/donateServ.js'
    ];

    grunt.initConfig({
        config: {
            assets: 'assets',
            parse: 'public',
            wordpress: 'wordpress/wp-content/themes/illuminatenations/assets',
            templates: 'wordpress/wp-content/themes/illuminatenations'
        },

        watch: {
            livereload: {
                options: { livereload: true },
                files: [
                    '<%= config.wordpress %>/**/*.{css,js}',
                    '<%= config.templates %>/**/*.{html,twig}'
                ]
            },
            scss: {
                files: ['<%= config.assets %>/styles/**/*.scss'],
                tasks: ['sass:wordpress']
            },
            js: {
                files: ['<%= config.assets %>/**/*.js'],
                tasks: ['uglify:wordpress']
            }
        },

        clean: {
            parse: ["<%= config.parse %>"],
            wordpress: ["<%= config.wordpress %>"]
        },

        uglify: {
            wordpress: {
                options: {
                    sourceMap: true
                },
                files: {
                    '<%= config.wordpress %>/scripts/illuminatenations.js': wordpressScripts
                }
            },
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
            wordpress: {
                files: [
                    { expand: true, cwd: '<%= config.assets %>/images', src: ['**'], dest: '<%= config.wordpress %>/images/' },
                    { expand: true, cwd: '<%= config.assets %>/fonts', src: ['**'], dest: '<%= config.wordpress %>/fonts/' }
                ]
            },
            parse: {
                files: [
                    { expand: true, cwd: '<%= config.assets %>/images', src: ['**'], dest: '<%= config.parse %>/images/' },
                    { expand: true, cwd: '<%= config.assets %>/fonts', src: ['**'], dest: '<%= config.parse %>/fonts/' }
                ]
            }
        },

        sass: {
            wordpress: {
                options: {
                    outputStyle: 'compressed',
                    sourceComments: 'map',
                    sourceMap: 'illuminatenations.css.map'
                },
                files: {
                    '<%= config.wordpress %>/styles/illuminatenations.css': '<%= config.assets %>/styles/illuminatenations.scss'
                }
            },
            parse: {
                options: {
                    outputStyle: 'compressed',
                    sourceComments: 'map',
                },
                files: {
                    '<%= config.parse %>/styles/donateserv.css': '<%= config.assets %>/styles/donateserv.scss'
                }
            },
        }
    });


    grunt.registerTask('default', ['clean:wordpress', 'uglify:wordpress', 'copy:wordpress', 'sass:wordpress', 'watch']);
    grunt.registerTask('parse', ['clean:parse', 'uglify:parse', 'copy:parse', 'sass:parse']);
};
