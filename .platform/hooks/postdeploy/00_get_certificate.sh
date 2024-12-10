#!/usr/bin/env bash
# Place in .platform/hooks/postdeploy directory
sudo certbot -n -d pondsandpuddles.is404.net -d jewelrystore.us-east-1.elasticbeanstalk.com  --nginx --agree-tos --email micrindi@byu.edu