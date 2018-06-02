'use strict';

// First Party Modules
const EventEmitter = require('events');
const net = require('net');

// Third Party Modules
const uuid = require('uuid/v4');

const port = process.env.PORT || 3001;
const server = net.createServer();
const eventEmitter = new EventEmitter();
const socketPool = {};

/**
 * User Constructor
 * @param socket
 * @constructor
 */
let User = function(socket) {
  let id = uuid();
  this.id = id;
  this.nickname = `User-${id}`;
  this.socket = socket;
};

const connectionPool = [];

/**
 * Connection listener.
 * When the user first connects, create a new user instance for them, noting the socket
 * Add them into the pool, by id.  We're using an object for the socket pool here
 * to make any lookups, or write operations O(1) instead of O(n)
 */
server.on('connection', (socket) => {
  console.log('CONNECTION!');
  let user = new User(socket);
  socketPool[user.id] = user;
  connectionPool.push(user.id);
  console.log(connectionPool);
  socket.on('data', (buffer) => dispatchAction(user.id, buffer));
});

/**
 * Command Parser
 * Handles commands such as:
 *    @all message
 *    @nick newname
 *    @quit
 *    @list
 *    @dm username message
 * @param buffer
 * @returns {*}
 *    format:
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

/**
 * Dispatcher -- parses the command buffer and then triggers an event with:
 *    command
 *    parsed entry object
 *    and the current user's id
 * @param userId
 * @param buffer
 */
let dispatchAction = (userId, buffer) => {
  let entry = parse(buffer);
  entry && eventEmitter.emit(entry.command, entry, userId);
};

/**
 * Command Handlers.
 * These respond when events are triggered (emitted) that match their "on" clause
 * This patter rocks ... you can add/remove command support without adding any
 * conditional logic, just listeners
 */

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
  for(let i=0; i < connectionPool.length; i++){
    let user = socketPool[userId];
    user.socket.write(`${connectionPool[i]};\n`);
  }

});

eventEmitter.on('@dm', (data, userId) => {
  // data.target == who it's going to
  // data.message == the message
  // find socketPool[target].socket.write(message);
});

eventEmitter.on('@quit', (data, userId) => {
// end
});

server.listen(port, () => {
  console.log(`Chat Server up on ${port}`);
});