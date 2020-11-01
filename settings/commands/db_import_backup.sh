
backup_name="$1"

DEFAULT_DATABASE="$(node -e 'console.log(require("./package.json").parameters.database.DEFAULT_DATABASE)')"
DEFAULT_COLLECTION="$(node -e 'console.log(require("./package.json").parameters.database.DEFAULT_COLLECTION)')"

mongorestore -d "$DEFAULT_DATABASE" "$backup_name"