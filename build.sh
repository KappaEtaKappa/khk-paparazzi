#!/bin/bash

if ! which node > /dev/null 2>&1; then
	echo "Node not installed. Install and retry"
	exit 1
fi
if ! which npm > /dev/null 2>&1; then
	echo "npm not installed. Install and retry"
	exit 1
fi

git pull origin master
npm install



