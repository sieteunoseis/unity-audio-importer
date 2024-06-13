# Cisco Unity Connections Audio Importer

A NodeJS application that allows you to upload new greeting audio files to Unity Connections. Application uses the Cisco Unity Connection Provisioning Interface (CUPI) to download the greetings and the Webex Audio API to upload them.

Cisco Unity Connection Provisioning Interface (CUPI) information can be found at:
[Cisco Unity Connection Provisioning Interface (CUPI)](https://www.cisco.com/c/en/us/td/docs/voice_ip_comm/connection/REST-API/CUPI_API/b_CUPI-API.html).

## Installation Options

1. Run as native node application using npm:

```javascript
npm install
npm run start
```

2. Build and run using Docker:

```bash
npm run docker:build
npm run docker:run
```

3. Pull image from Docker.io and run with the following:

```bash
docker run -d --rm -v ./files:/app/files --env-file=.env sieteunoseis/unity-audio-importer:latest
```

## Usage

Need to have an input.csv file in the volume of the project that you map to the container with the following columns:

```csv
name,extension,file,greeting
TEST-CallHandler,5035551212,standard-greeting.wav,Standard
```

All wav files should be in the same folder. The above example uses a file structure like the following:

Folder: files
- input.csv
- standard-greeting.wav

Log files will be created in the folder that you map to the container.

## Environment Variable

```bash
CUC_HOSTNAME=devnetsandbox.cisco.com
CUC_USERNAME=administrator
CUC_PASSWORD=ciscopsdt
```

| Variable | Description | Required | Default |
|---|---|---|---|
| CUC_HOSTNAME | Cisco Unity Connections Hostname or IP Address. | Yes | N/A |
| CUC_USERNAME | Cisco Unity Connections REST Username. | Yes | N/A |
| CUC_PASSWORD | Cisco Unity Connections REST Password. | Yes | N/A |

## Giving Back

If you would like to support my work and the time I put in creating the code, you can click the image below to get me a coffee. I would really appreciate it (but is not required).

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/automatebldrs)
