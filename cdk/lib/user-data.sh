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
if [ -f "$TEST_FILE" ]; then
    echo "$TEST_FILE exists. VM Initialised."
else
    echo "$TEST_FILE does not exist. Initialising VM."
    apt update -y

    echo "Installing nginx..."

    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx

    chmod 2775 /usr/share/nginx/html
    find /usr/share/nginx/html -type d -exec chmod 2775 {} \;
    find /usr/share/nginx/html -type f -exec chmod 0664 {} \;
    echo '<h1>It worked!</h1>' > /var/www/html/index.nginx-debian.html

    echo "nginx Installed"

    echo "installing docker ..."
    
    apt-get install ca-certificates curl gnupg lsb-release
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
    service docker start

    echo "installing aws cli ..."

    apt install awscli -y

    touch $TEST_FILE
fi

echo "fetching firstcoin docker container..."

aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 525135309370.dkr.ecr.eu-west-1.amazonaws.com
docker pull 525135309370.dkr.ecr.eu-west-1.amazonaws.com/firstcoinstack-firstcoinrepository4a4774a5-brndmcpptvud