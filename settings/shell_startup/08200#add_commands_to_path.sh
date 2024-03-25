# add commands to path
PATH="$PWD/settings/commands:$PATH"

# if theres a help command
if [[ -f "./commands/help" ]]; then
    # override the default bash "help"
    alias help="./commands/help" 
fi