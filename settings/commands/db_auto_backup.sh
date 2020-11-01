# 
# generate the backup name
# 
backup_name="$1"
if [[ "$1" = "" ]] 
then
    backup_name="backups.nosync/backup.backup"
    # 
    # create some helper functions
    # 
    function file_name_extension {
        file_name="$1"
        dir_of_file="$(dirname $file_name)"
        file_basename="$(basename $file_name)"
        # NOTE! doesn't work properly if there is a newline in the extension
        [[ "$file_basename" = *.* ]] && printf ".${file_basename##*.}" || printf ''
    }
    function file_name_no_extension {
        file_name="$1"
        dir_of_file="$(dirname $file_name)"
        file_basename="$(basename $file_name)"
        # NOTE! doesn't work properly if there is a newline in the file or parent folders
        printf "$dir_of_file/${file_basename%.*}"
    }

    function filename_incrementor {
        number=0
        extension="$(file_name_extension "$1")"
        non_extension_part="$(file_name_no_extension "$1")"
        output_name="$non_extension_part-$extension"
        
        # peform one iteration first
        printf -v output_name '%s-%02d'"$extension" "$non_extension_part" "$(( ++number ))"
        while [ -e "$output_name" ]; do
            printf -v output_name '%s-%02d'"$extension" "$non_extension_part" "$(( ++number ))"
        done
        printf $output_name
    }
    # increment backup name
    backup_name="$(filename_incrementor "$backup_name")"
fi

# 
# actually do the backing up
#
mongodump -o "$backup_name"