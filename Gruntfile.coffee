module.exports = (grunt) ->

	# Project configuration
	grunt.initConfig
		pkg: grunt.file.readJSON 'package.json'

		watch:
			options:
				livereload: true
			less:
				files: ['less/**']
				tasks: ['less:development']
			js:
				files: ['client-js/**', 'client-js/components/**']
				tasks: ['concat:js']

		concat:
			js:
				src: ['client-js/**.js', 'client-js/components/**.js']
				dest: 'static/js/bureau.js'

		imagemin:
			options:
				cache: false
			build:
				files: [{
					expand: true
					src: ['static/images/**/*.{jpg,jpeg,gif,png}']
					dest: 'build/'
				}]

		svgmin:
			build: {
				files: [{
					expand: true,
					src: ['static/images/**/*.svg']
					dest: 'build/'
				}]
			}


		clean:
			build: ['build/**']
			babel: ['build/babel-temp/']

		copy:
			build:
				files: [
					{
						expand: true
						cwd: 'static/'
						src: ['**', '!images/**', '!css/**', '!js/**', 'js/**.min.js']
						dest: 'build/static'
					}
				]

		less:
			development:
				options:
					paths: ['less']
					sourceMap: true
					sourceMapBasepath: 'less/'
					sourceMapRootpath: '/devstatic/less/'
				files:
					'static/css/bureau.css': 'less/main.less'
					'static/css/bureau-login.css': 'less/login.less'
					'static/css/bureau-landingpage.css': 'less/landingpage.less'

			build:
				options:
					paths: ['less']
					plugins: [
						new (require('less-plugin-clean-css'))()
					]
				files:
					'build/static/css/bureau.css': 'less/main.less'
					'build/static/css/bureau-login.css': 'less/login.less'
					'build/static/css/bureau-landingpage.css': 'less/landingpage.less'

		cssmin:
			build:
				expand: true
				cwd: 'static/css/'
				src: ['*.css', '!bureau.css']
				dest: 'build/static/css/'

		uglify:
			build:
				files:
					'build/static/js/bureau.js' : [
						'client-js/**.js',
						'client-js/components/**.js',
						'build/babel-temp/**/*.jsx',
						'build/babel-temp/**/*.es6'
					]
			buildcopymin:
				files: [{
					expand: true
					cwd: 'static/js/'
					src: ['**.js', '*/**.js', '!**.min.js', '!bureau.js']
					dest: 'build/static/js/'
				}]

		babel:
			build:
				files: [{
						expand: true
						cwd: 'client-js/'
						src: ['**/**.jsx', '**/**.es6']
						dest: 'build/babel-temp/'
				}]



	grunt.loadNpmTasks 'grunt-contrib-less'
	grunt.loadNpmTasks 'grunt-contrib-coffee'
	grunt.loadNpmTasks 'grunt-contrib-watch'
	grunt.loadNpmTasks 'grunt-contrib-concat'
	grunt.loadNpmTasks 'grunt-contrib-copy'
	grunt.loadNpmTasks 'grunt-contrib-imagemin'
	grunt.loadNpmTasks 'grunt-contrib-clean'
	grunt.loadNpmTasks 'grunt-contrib-cssmin'
	grunt.loadNpmTasks 'grunt-contrib-uglify'
	grunt.loadNpmTasks 'grunt-svgmin'
	grunt.loadNpmTasks 'grunt-babel'

	# Default task(s)
	grunt.registerTask 'default', ['watch:less', 'watch:js']
	grunt.registerTask 'build', [
			'clean:build',
			'concat:js',
			'copy:build',
			'imagemin:build',
			'svgmin:build',
			'cssmin:build',
			'less:build',
			'uglify:buildcopymin',
			'babel:build',
			'uglify:build',
			'clean:babel'
		]
