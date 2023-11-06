Download the proper orangePi image from their website, using **debian server**: `Orangepizero2w_1.0.0_debian_bookworm_server_linux6.1.31_1.5gb.img`. 
Flash the SD card with balena etcher.

insert SDCard + connect keyboard + screen + power. The orange pi will boot and auto-resize its SDCard partition

## System setup
`sudo orangepi-config`  (password by default is orangepi, keyboard by defaukt is querty)

- go to `personal>Keyboard` and select your keyboard layout
- go to `Network>Wifi`, select a network, and connect to it
- got to `Network>RemoveIR` (to remove IR daemon)
- save & exit

- `sudo apt update`
- `sudo dpkg-reconfigure --priority=low unattended-upgrades` # and select **NO**
- `systemctl disable unattended-upgrades.service`
- `systemctl stop unattended-upgrades.service`

- `sudo apt install git build-essential`

## Node
```bash
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
NODE_MAJOR=18
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list
sudo apt-get update
sudo apt-get install nodejs -y
```

### Eurobot-AI
```bash
sudo apt install ffmpeg
cd
git clone https://github.com/nesnes/Eurobot-AI.git
cd Eurobot-AI
# Install packages for canvas dependencie compilation
sudo apt install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libraspberrypi-dev
npm i
```