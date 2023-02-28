Install Raspbian 64bit lite

## Generic
```bash
sudo apt update
sudo apt install git build-essential
```

## Screen MHS-3.5
```bash
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
sudo apt install --no-install-recommends xserver-xorg x11-xserver-utils xinit chromium-browser

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
chromium-browser --disable-infobars --kiosk 'https://www.google.com'
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