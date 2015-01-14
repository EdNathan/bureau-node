deploy:
	grunt build
	cd build
	jitsu deploy
	cd ../
