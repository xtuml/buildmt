# How to work on the build server

This document provides the information required to set up and contribute to the
Jenkins based build server

### How to modify the build server

#### Changing the Jenkins server settings

To modify the build server, we can utilize our existing engineering process
since everything is in a git repository.

1. Launch the current build server AMI (marked with "current") on AWS  
2. SSH into the server and change to the `/build` directory. This is the root of
the git repository  
3. Make any changes through the web UI or on the command line  
4. Commit your changes  
    * The repository is shared between all users in the "build" group. This
      allows multiple users to make commits to the same files  
    * You will have to configure git with your name and email before making
      commits. See guide [here](https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup)  
    * Be careful when pushing changes to remotes. The "origin" remote is the
      "xtuml" repository and not a fork! Add your own fork and push your changes
      there  

The Jenkins server is set up to pull the latest changes from the `buildmt`
repository on startup. Once your changes are committed to "master", they will be
applied at the next build server startup

The `.gitignore` files inside the `jenkins-home` directory are very broad. This
is because Jenkins produces a lot of files that we do not want to commit, so it
is easier to ignore everything and whitelist the files we want to keep. With
this in mind, if a change is made that introduces a new configuration file, it
must be added as an exception in the `.gitignore` file.

#### Jenkins job strategy

The "multijob" Jenkins plugin allows us to run jobs which consist of several
other jobs sequentially. This gives us great freedom to create "building block"
jobs which are used to compile top level jobs. For example, the job
"bridgepoint" and "publish" can be put together sequentially to build
BridgePoint and publish to AWS S3. By convention "building block" jobs are named
with lower case, while top level jobs are named with capitalized first letters.
Spaces are avoided in names.

#### Installing packages

Any Linux packages that are installed that the build server depends on must be
added to the `buildmt/get-package-dependencies.sh` script. This script runs when
the server is installed and contains all of the software that the Jenkins build
is dependant on.

#### Installing plugins

It is not good to commit the installed Jenkins plugins. If a new plugin is
installed, it should be added to the `buildmt/jenkins-home/plugins.txt` file.
This file is read when the server is installed and the plugins are downloaded
and installed automatically.

### How to setup a new build server

1. Start an AWS EC2 instance (or use a local VM) running Ubuntu 16.04 LTS  
   * Note: Root privileges are necessary for this setup
2. Log on to the server  
3. Create a directory `/build`  
    * `sudo mkdir /build; cd /build`  
    * Note: if you are on a new AWS instance, you may want to mount the large
      block storage device to this directory  
4. Start the build server install script  
    * `curl https://raw.githubusercontent.com/xtuml/buildmt/master/install-build-server.sh | sudo bash`  
5. When the script completes, copy the file `awsconfig` into the
   `/build/buildmt` directory  

    * Create the file `/build/buildmt/awsconfig`; change the file mode to `660`;
      set the owner to `jenkins` and the group to `build`  
    ```
    touch /build/buildmt/awsconfig
    chmod 660 /build/buildmt/awsconfig
    chown jenkins:build /build/buildmt/awsconfig
    ```
    * Copy the text from the gray box [here](https://docs.google.com/document/d/16iUguxC3uT20UgSO9YvkeP_wm-7pdiRNzZ6cdTt5iO8/edit) into this file  
6. Add any other users to the machine (optional)  
    * Note: assure that the primary group of any new user is `build`  
    * `sudo useradd -g build levi`  
    * Add public keys to each users home directory for future logins  

_Note: the default umask for all users has been set to 002 meaning any new file
a user creates will be readable and writable by the user's primary group. The
git directory in which the build server lives is also configured to be shared by
the group. In this way, any user with primary group of `build` can read, write,
and commit files to this git repository_
