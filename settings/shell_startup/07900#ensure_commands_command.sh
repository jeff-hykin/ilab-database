# create the "commands" command if it doesnt exist
if ! [[ -f "./commands/commands" ]]; then
    echo '#!/usr/bin/env bash
    echo "project commands:"
    tree ./commands -C --dirsfirst  -A -F --noreport | sed '"'"'s/^/    /'"'"' | sed '"'"'s/\.\/settings\/commands/    /'"'"'
    ' > "./commands/commands"
fi 