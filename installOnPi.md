Install Raspbian 64bit lite

## Generic
```bash
sudo apt update
sudo apt install git build-essential
```

## Screen MHS-3.5
```bash
cd
git clone https://github.com/Lcdwiki/LCD-show.git
chmod -R 755 LCD-show
cd LCD-show/
sudo ./MHS35-show
# A the pi will reboot
cd LCD-show/
./rotate.sh 90
```

## GUI
```bash
sudo apt install --no-install-recommends xserver-xorg x11-xserver-utils xinit openbox chromium-browser

mkdir -p ~/.config/openbox && cp /etc/xdg/openbox/* ~/.config/openbox
```

`nano ~/.config/openbox/autostart`
```
# Disable any form of screen saver / screen blanking / power management
xset s off
xset s noblank
xset -dpms

# Allow quitting the X server with CTRL-ATL-Backspace
setxkbmap -option terminate:ctrl_alt_bksp

# Start Chromium in kiosk mode
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/'Local State'
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[^"]\+"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences
chromium-browser --disable-infobars  --force-device-scale-factor=0.65 --kiosk 'http://127.0.0.1:8080/panel.html'
```

### Autologin
```bash
sudo systemctl set-default multi-user.target
sudo ln -fs /lib/systemd/system/getty@.service /etc/systemd/system/getty.target.wants/getty@tty1.service
```
`sudo nano /etc/systemd/system/getty@tty1.service.d/autologin.conf`
```
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin pi --noclear %I \$TERM
```
`nano ~/.bash_profile`
```
[[ -z $DISPLAY && $XDG_VTNR -eq 1 ]] && startx -- -nocursor
```
### Node

```bash
curl -sL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install nodejs
sudo apt install python2.7 #Needed by some packages for compilation
sudo ln -fs /usr/bin/python2.7 /usr/bin/python # Set python 2.7 as default python
```
### Eurobot-AI
```bash
cd
git clone https://github.com/nesnes/Eurobot-AI.git
cd Eurobot-AI
# Install packages for canvas dependencie compilation
sudo apt install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libraspberrypi-dev
npm i
```
### Autostart
```bash
sudo npm install pm2 -g
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi
pm2 start main.js
pm2 save
```

## WIFI
Set list of wifi networks to auto-connect to in `/etc/wpa_supplicant/wpa_supplicant.conf`
```
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
        ssid="MyNetwork1"
        psk="myPsw0d1"
        priority=10
}

network={
        ssid="MyNetwork2"
        psk="myPsw0d2"
        priority=5
}

```

## Lidar
Add `sudo nano /etc/udev/rules.d/49-ld06.rules`
```
SUBSYSTEMS=="usb", ATTRS{idVendor}=="0403", ATTRS{idProduct}=="6001", SYMLINK+="lidar"
```

## Camera
To use the wide angle 160° camera module
Edit `sudo nano /boot/config.txt` to add
```
# Enable OV5647 camera module
dtoverlay=ov5647
```