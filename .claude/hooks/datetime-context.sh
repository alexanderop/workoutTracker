#!/bin/bash
# Injects current date, time, and day of week into the session context

# Get current datetime in Europe/Berlin timezone
DATETIME=$(TZ="Europe/Berlin" date +"%A, %B %d, %Y at %I:%M %p %Z")

# Output as system reminder
cat << EOF
<system-reminder>
Current date/time: ${DATETIME}
</system-reminder>
EOF
