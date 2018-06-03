'use strict';

// require('dotenv').config();

// First Party Modules
const EventEmitter = require('events');
const net = require('net');

// Third Party Modules
const uuid = require('uuid/v4');

const port = process.env.PORT || 3001;
const server = net.createServer();
const eventEmitter = new EventEmitter();
const socketPool = {};


let User = function(socket) {
  let id = uuid();
  this.id = id;
  this.nickname = `User-${id}`;
  this.socket = socket;
};

// Connection listener. Uses obhect for socket pool to make references to it O(1)

server.on('connection', (socket) => {
  console.log('CONNECTION!');
  let user = new User(socket);
  socketPool[user.id] = user;
  socket.on('data', (buffer) => dispatchAction(user.id, buffer));
});

server.on('error', () => {
  console.log('error occured');

});

/**
 * Command Parser
 *    Format:
 *      command: the @command given
 *      payload: the full text after the @command
 *      target: the first word after the @command (might be useful for @dm, @kick)
 *      message: all of the words after "target" (only useful for @dm)
 */

let parse = (buffer) => {

  let text = buffer.toString().trim();
  if ( !text.startsWith('@') ) { return null; }
  let [command,payload] = text.split(/\s+(.*)/);
  let [target,message] = payload ? payload.split(/\s+(.*)/) : [];
  return {command,payload,target,message};

};

// Dispatcher -- parses the command buffer and then triggers an event with: command,parsed entry object, and the current user's id


let dispatchAction = (userId, buffer) => {
  let entry = parse(buffer);
  entry && eventEmitter.emit(entry.command, entry, userId);
};


// Command Handlers

eventEmitter.on('@all', (data, userId) => {
  for( let key in socketPool ) {
    let user = socketPool[key];
    user.socket.write(`<${socketPool[userId].nickname}>: ${data.payload}\n`);
  }
});

eventEmitter.on('@nick', (data, userId) => {
  let user = socketPool[userId];
  user.nickname = data.target;
});

eventEmitter.on('@list', (data, userId) => {
  for(let value in socketPool){
    let user = socketPool[userId];
    user.socket.write(`${socketPool[value].nickname}\n`);
  }
});

eventEmitter.on('@dm', (data, userId) => {
  let recipient = data.target;
  let message = data.message;
  let sender = socketPool[userId].nickname;

  for(let key in socketPool){
    let candidate = socketPool[key];
    if(candidate.nickname === recipient){
      candidate.socket.write(`From ${sender}: ${message}`);
      break;
    }
  }
});

eventEmitter.on('@quit', (data, userId) => {
  let user = socketPool[userId];
  user.socket.destroy();
  delete socketPool[userId];
});

server.listen(port, () => {
  console.log(`Chat Server up on ${port}`);
});