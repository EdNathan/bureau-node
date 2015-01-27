deploy:
	grunt build;
	sleep 3;
	cd build;
	sleep 3;
	jitsu deploy
	sleep 1;
	cd ../
