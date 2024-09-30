# Use the official Ubuntu 20.04 as a base image
FROM ubuntu:20.04

# Set environment variables to avoid user prompts during package installations
ENV DEBIAN_FRONTEND=noninteractive

# Update the package list and install any packages your application needs
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    wget \
    vim \
    nano \
    systemd \
    systemd-sysv \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# install nix (installer version 0.19.1)
RUN curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix/tag/v0.19.1 | sh -s -- install --no-confirm

# install some basics
RUN bash -c "$(printf '\
#                                                                                                                                   \n\
# setup nix command                                                                                                                 \n\
#                                                                                                                                   \n\
if [ -f "/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh" ]; then                                                         \n\
    . "/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh"                                                                   \n\
fi                                                                                                                                  \n\
if [ -f "$HOME/.nix-profile/etc/profile.d/nix.sh" ]; then                                                                           \n\
    . "$HOME/.nix-profile/etc/profile.d/nix.sh"                                                                                     \n\
fi                                                                                                                                  \n\
export PATH="$PATH:$HOME/.nix-profile/bin:/nix/var/nix/profiles/default/bin/:/nix/var/nix/profiles/per-user/$(whoami)/profile/bin/" \n\
export NIXPKGS_ALLOW_UNFREE=1                                                                                                       \n\
                                                                                                                                    \n\
#                                                                                                                                   \n\
# install some basics                                                                                                               \n\
#                                                                                                                                   \n\
nix --extra-experimental-features nix-command profile install "$(nix eval --impure --expr "<nixpkgs>")#git"                         \n\
nix --extra-experimental-features nix-command profile install "$(nix eval --impure --expr "<nixpkgs>")#dua"                         \n\
nix --extra-experimental-features nix-command profile install "$(nix eval --impure --expr "<nixpkgs>")#unzip"                       \n\
')"

# copy only whats needed to prebuild the nix packages
COPY ./settings /nix_prebuild/settings
COPY ./commands/shell /nix_prebuild/commands/shell
COPY ./commands/start /nix_prebuild/commands/start

RUN bash -c "$(printf '\
                                                                                                                                    \n\
#                                                                                                                                   \n\
# setup nix command                                                                                                                 \n\
#                                                                                                                                   \n\
if [ -f "/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh" ]; then                                                         \n\
    . "/nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh"                                                                   \n\
fi                                                                                                                                  \n\
if [ -f "$HOME/.nix-profile/etc/profile.d/nix.sh" ]; then                                                                           \n\
    . "$HOME/.nix-profile/etc/profile.d/nix.sh"                                                                                     \n\
fi                                                                                                                                  \n\
export PATH="$PATH:$HOME/.nix-profile/bin:/nix/var/nix/profiles/default/bin/:/nix/var/nix/profiles/per-user/$(whoami)/profile/bin/" \n\
                                                                                                                                    \n\
git init                                                                                                                            \n\
cd /nix_prebuild                                                                                                                    \n\
commands/start                                                                                                                      \n\
')"

# Copy full application
COPY . /app
# Set the working directory
WORKDIR /app
# start the project
CMD ["commands/start"]