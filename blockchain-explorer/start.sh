#
#    SPDX-License-Identifier: Apache-2.0
#

#!/bin/bash
#
#Redirecting console.log to log file.
#Please visit ./logs/app to view the application logs and visit the ./logs/db to view the Database logs and visit the ./log/console for the console.log
# Log rotating for every 7 days.

sudo rm -rf /tmp/fabric-client-kvs_peerOrg*

sudo mkdir -p ./logs/app & mkdir -p ./logs/db & mkdir -p ./logs/console

sudo node main.js >>logs/console/console.log-"$(date +%Y-%m-%d)" 2>&1 &

find ./logs/app -mtime +7 -type f -delete & find ./logs/db -mtime +7 -type f -delete & find ./logs/console -mtime +7 -type f -delete
