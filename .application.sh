#!/bin/bash
sqlite3 ../khk-ssa/khk-access/db.sqlite "INSERT INTO apps (name, privilegeRequired, subdomain, icon) values (\"Paparazzi\", 1, \"paparazzi\", \"fa-camera-retro\");"
