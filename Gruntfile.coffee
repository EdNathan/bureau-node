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
					src: ['static/images/**.{jpg,jpeg,gif,png}']
					dest: 'build/'
				}]
		
		svgmin:
			build: {
				files: [{
					expand: true,
					src: ['static/images/**.svg']
					dest: 'build/'
				}]
			}
		
		
		clean:
			build: ['build/**']
		
		copy:
			build:
				files: [
					{
						expand: true
						cwd: 'static/'
						src: ['**', '!images/**', '!css/**', '!js/**', 'js/**.min.js']
						dest: 'build/static'
					}
					{
						expand: true
						src: ['.{npm,git}ignore', '*.{js,json}', 'views/**', 'games/**', 'temp/', '!temp/**.jpg']
						dest: 'build/'
					}
				]
			
		less: 
			development: 
				options: 
					paths: ['less']
					cleancss: false
				files:
					'static/css/bureau.css': 'less/main.less'
					
			build:
				options:
					paths: ['less']
					cleancss: true
				files:
					'build/static/css/bureau.css': 'less/main.less'
		cssmin: 
			build:
				expand: true
				cwd: 'static/css/'
				src: ['*.css', '!bureau.css']
				dest: 'build/static/css/'
		uglify:
			build:
				files:
					'build/static/js/bureau.js' : ['client-js/**.js', 'client-js/components/**.js']
			buildcopymin:
				files: [{
					expand: true
					cwd: 'static/js/'
					src: ['**.js', '*/**.js', '!**.min.js', '!bureau.js']
					dest: 'build/static/js/'
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
	
	# Default task(s)
	grunt.registerTask 'default', ['watch:less', 'watch:js']
	grunt.registerTask 'build', [
			'clean:build',
			'copy:build',
			'imagemin:build',
			'svgmin:build',
			'cssmin:build',
			'less:build',
			'uglify:buildcopymin',
			'uglify:build'
		]