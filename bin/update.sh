#!/bin/bash

deno run --allow-all update-releases-file.ts > logs/update-releases-file.log
deno run --allow-all fetch-releases.ts > logs/fetch-releases.log