deploy:
	./setEnvironmentOpenshift.sh;
	sleep 2;
	git push openshift master;

docs:
	rm -rf static/apidoc/
	node_modules/.bin/apidoc -i api/endpoints/ -o static/apidoc/

apilog:
	rhc ssh bureau "cat **/logs/api.log"
