#!/bin/bash

# Set environment variables from .env file

VAR_STR="rhc set-env NODE_ENV=production "

while read ENV_VAR; do
		VAR_STR+=$ENV_VAR
		VAR_STR+=" "
done <.env

VAR_STR+="-a bureau"

eval $VAR_STR

rhc env list bureau
