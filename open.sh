#!/bin/bash
# Script to open the Word Duration prototype in the default browser

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Open the index.html file in the default browser
open "$DIR/index.html" 