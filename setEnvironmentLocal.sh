#!/bin/bash

# Set environment variables from .env file

while read ENV_VAR; do
		VAR_STR="export "
		VAR_STR+=$ENV_VAR
		eval $VAR_STR
done <.env
