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

_Note: A working knowledge of Linux system administration is assumed for this
guide. The reader should be familiar with the following: manipulating file
permissions and ownership, logging on to a remote server and transferring files,
adding users, etc. For the sake of brevity, this guide will **not** always
include explicit commands to copy and paste. A working understanding of AWS EC2
is also required._

1. Start an AWS EC2 instance running Ubuntu 16.04 LTS in the US East (N.
   Virginia) region. 
   * Select m5.large for the instance type
   * Create and attach a new 100 GiB EBS storage device (assure that "delete on
     termination" is **checked**)
   * Select the "build server security group" security group
2. Log on to the server  
   * Select `build-server-keypair.pem` when launching the instance
   * The key file can be found in this [Google Drive folder](https://drive.google.com/drive/u/1/folders/0B3XvTeswC_kOTXRFeHI0aU1JZGM)
   * Assure that the permissions for the key are set to read/write for user
     only (600)
   * `ssh -i build-server-keypair.pem ubuntu@<server IP>`
3. Create a directory `/build`  
    * `sudo mkdir /build`  
    * Mount the 100 GiB EBS device to the `/build` directory. A full tutorial
      can be found [here](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-using-volumes.html)
    * First, determine the name of the device:  
      ```
      lsblk
      ```
      The 100G device is the one you want
    * Create a file system on the device:  
      ```
      sudo mkfs -t ext4 /dev/<device name>
      ```
    * Mount the new file system to the `/build` directory:
      ```
      sudo mount /dev/<device name> /build
      ```
    * Add the following line to `/etc/fstab`:
      ```
      /dev/<device name> /build ext4 defaults,nofail 0 2
      ```
4. Start the build server install script (do this from the `/build` directory)  
    * `cd /build`  
    * `curl https://raw.githubusercontent.com/xtuml/buildmt/master/install-build-server.sh | sudo bash`  
5. When the script completes, copy the file `awsconfig` into the
   `/build/buildmt` directory  

    * Create the file `/build/buildmt/awsconfig`; change the file mode to `660`;
      set the owner to `jenkins` and the group to `build`  
      ```
      sudo touch /build/buildmt/awsconfig
      sudo chmod 660 /build/buildmt/awsconfig
      sudo chown jenkins:build /build/buildmt/awsconfig
      ```
    * Copy the text from the gray box [here](https://docs.google.com/document/d/16iUguxC3uT20UgSO9YvkeP_wm-7pdiRNzZ6cdTt5iO8/edit) into this file  
6. Copy the file `MacOSX10.11.sdk.tar.xz` into the `/build/buildmt` directory  
    * Assure that the file permissions are 660 and that the ownership is
      "jenkins:build"  
    * This file can be found [here](https://drive.google.com/drive/u/1/folders/0B698ZDpSSasPei1FQk9QU3NrenM)  
7. Download the Jenkins CLI Java application
    * Download the jar file to the `/build/buildmt` directory:  
      `sudo -u jenkins wget http://localhost:8080/jnlpJars/jenkins-cli.jar -O /build/buildmt/jenkins-cli.jar`  
      _Note: This download requires that the Jenkins service is running on the
      local machine. If the command fails, try restarting Jenkins with
      `/etc/init.d/jenkins restart`_.
7. Add other user accounts to the machine (optional)  
    * A script `add-user.sh` is included in this repository to streamline this
      process
    * Install user data and ssh keys. The easiest way to do this is to zip up
      the contents of `/home` from the old build server, unzip it on the new
      server and modify the ownership recursively.
8. Reboot the server.
