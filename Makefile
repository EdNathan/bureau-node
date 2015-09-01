deploy:
	./setEnvironmentOpenshift.sh;
	sleep 2;
	git push openshift master;
