Content-Type: multipart/mixed; boundary="//"
MIME-Version: 1.0

--//
Content-Type: text/cloud-config; charset="us-ascii"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Content-Disposition: attachment; filename="cloud-config.txt"

#cloud-config
cloud_final_modules:
- [scripts-user, always]

--//
Content-Type: text/x-shellscript; charset="us-ascii"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Content-Disposition: attachment; filename="userdata.txt"

#!/bin/bash

TEST_FILE=/home/ubuntu/user-data-has-run-once.test

#This is just to run once since the above cloud_final_modules setting is set to run on every reboot 
#An alternative is to run a systemd script that runs on every reboot to d/l a script from s3 and run that
if [-f "$TEST_FILE"]
then

else
    sudo su
    apt update -y

    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx

    chmod 2775 /usr/share/nginx/html
    find /usr/share/nginx/html -type d -exec chmod 2775 {} \;
    find /usr/share/nginx/html -type f -exec chmod 0664 {} \;

    touch $TEST_FILE
fi


echo '<h1>It worked!</h1>' > /var/www/html/index.nginx-debian.html