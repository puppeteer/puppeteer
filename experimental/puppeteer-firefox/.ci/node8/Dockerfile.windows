FROM microsoft/windowsservercore:latest

ENV NODE_VERSION 8.11.3

RUN setx /m PATH "%PATH%;C:\nodejs"

RUN powershell -Command \
    netsh interface ipv4 set subinterface 18 mtu=1460 store=persistent ; \
    Invoke-WebRequest $('https://nodejs.org/dist/v{0}/node-v{0}-win-x64.zip' -f $env:NODE_VERSION) -OutFile 'node.zip' -UseBasicParsing ; \
    Expand-Archive node.zip -DestinationPath C:\ ; \
    Rename-Item -Path $('C:\node-v{0}-win-x64' -f $env:NODE_VERSION) -NewName 'C:\nodejs'
