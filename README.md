![cf](https://i.imgur.com/7v5ASc8.png) Lab 06: TCP Chat Server - Haley Mendoza
======


## Features   
This is a TCP chatroom, created using the NodeJS `net` module. Clients are able to connect to the chatroom through the use of telnet. Clients are able to run special commands to exit the chatroom, list all users, reset their nickname, and send direct messages. No third party libraries were used. Client commands:
  * Send `@quit` to disconnect
  * Send `@list` to list all connected users
  * Send `@nickname <new-name>` to change their nickname
  * Send `@dm <to-username> <message>` to send a message directly to another user by their nickname

## Starting up the Application
Clone code to your machine and run `npm i` to install all node dependencies. Install telnet if needed - to check if you have it installed, run `telnet` in command line. To install, run `brew install telnet`

In root directory, run server on desired port or 3001 by default. Run `node index.js`

In separate tab, connect to chatroom using telnet and your IP address `telnet <ip-address> <port>`

