# What is this?

This is a backend database for the [iLab Annotation Tool](https://github.com/jeff-hykin/iilvd-online).
See the [PDF](https://github.com/jeff-hykin/iilvd-online/blob/master/iLab%20Database.pdf) in the other repo

# Setup / Installation

Everything is detailed in the `documentation/setup.md`!

# Usage

After doing the `commands/start` you can run
- `processes start_all` to get both the mongodb and express server running. They are self-resurrecting if they crash.
- `processes read_log` to see how those processes are doing.
- While `processes restart_all` exists, sometimes it doesn't work. If you're having issues, you can find what proceses are using the port by running `lsof -i tcp:6283` (6283 is the port number) and `lsof -i tcp:27017`.

The port numbers are picked by the `package.json` file.


# Data Extraction

Running `db/backup` should generate a .json file that has all the data in it. It can be used directly or as a restore point.