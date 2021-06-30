# Eurobot AI
This is a node-js based intelligence to be used in the *Eurobot* and *Coupe de France de Robotique* contests.
It is designed to be used on a rasberryPi, but is also used on Win/Mac/Linux for debug purposes.

It can be interfaced with microcontrollers through serial ports or wathever available on the host board.

# Installation
Most of the command bellow will be addressed for a rapberryPi installation, on other plaforms read the text and use google, nothing is tricky.

### NPM
- Run `uname -m` to get your arch, and `wget` the corresponding file of the [download page](https://nodejs.org/en/download/)
- To uncompress, you might need `xz -d file.tar.gz.xz` and `tar -xzf file.tar.gz` or `tar -xf file.tar`
- `cd` in the extracted folder and install with `sudo cp -R * /usr/local/`
- voilà

### Clone the repo
- Move to the desired folder and `git clone` the repository, or download it.

### Install npm packages
The project requires a fex dependencies to run properly (it's a npm project!). One of them `opencv4nodejs` will take an extra long time to install on machines (hours on a raspberry pi)

- If you are on a raspberry, create a temporary swap file. A swap creates a virtual RAM file on your disk/SD card to temporarly let big programs run (required for the openCV compilation to succeed).
    - `sudo dphys-swapfile swapoff`
    - `sudo nano /etc/dphys-swapfile` and edit to `CONF_SWAPSIZE=2048`
    - `sudo dphys-swapfile setup`
    - `sudo dphys-swapfile swapon`
- Install compilation requirments with `sudo apt install -y build-essential cmake libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`
- INstal npm compilation helper `npm install -g node-gyp`
- From the repositry root, install npm packages with `npm i` (This will be long, a few errors might appear, but unless its stops it's OK!)
- A few packets need an extra compilation step, to do so, run:
    - `npm install serialport --build-from-source`
