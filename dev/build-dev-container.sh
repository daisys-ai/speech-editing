#!/bin/bash

cd $(dirname $0)
docker build -t word-duration-app-dev . --build-arg USER=$(whoami) --build-arg USERID=$(id -u) --build-arg GROUPID=$(id -g)
