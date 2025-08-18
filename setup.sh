#!/usr/bin/env bash

# Install dependecies
npm i

# Download seed data
wget -O ./data/jobPostings.cjs https://cf-courses-data.s3.us.cloud-object-storage.appdomain.cloud/PuG2Nqinq_7G71t1NPOJeQ/jobPostings.js
wget -P ./data https://cf-courses-data.s3.us.cloud-object-storage.appdomain.cloud/4V1kcXr8NDjTN6Sof83-4w/testResume.pdf
