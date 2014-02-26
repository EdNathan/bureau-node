module.exports = (grunt) ->

	# Project configuration
	grunt.initConfig 
		pkg: grunt.file.readJSON 'package.json'
		
		watch:
			options:
				livereload: true
				
#			styles: 
#				files: ['css/less/*']
#				tasks: ['less']
#			
#			coffeescript:
#				files: ['js/coffee/*']
#				tasks: ['coffee']
#			
#			html: 
#				files: ['index.html', 'cookies.html']
#				
			all:
				files: ['less/**']
				tasks: ['less']
		
		concat:
			js:
				src: ['js/base/**.js', 'js/base/components/**.js']
				dest: 'js/bureau.js'

				
# 		coffee:
# 			compileWithMaps:
# 				options:
# 					sourceMap: true
# 				
# 				files:
# 					'js/main.js': 'js/coffee/main.coffee'
# 			
# 			production:
# 				options:
# 					sourceMap: false
# 				
# 				files:
# 					'staging/js/main.js': 'js/coffee/main.coffee'
		
		less: 
			development: 
				options: 
					paths: ['less']
					cleancss: false
				
				files:
					'static/css/bureau.css': 'less/main.less'



	grunt.loadNpmTasks 'grunt-contrib-less'
	grunt.loadNpmTasks 'grunt-contrib-coffee'
	grunt.loadNpmTasks 'grunt-contrib-watch'
	grunt.loadNpmTasks 'grunt-contrib-concat'
	grunt.loadNpmTasks 'grunt-contrib-copy'
	
	# Default task(s)
	grunt.registerTask 'default', ['watch']	