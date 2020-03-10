var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

var onlineUsers = [];
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

// listen on the connection event for incoming sockets
io.on('connection', function (socket) {
  console.log('A new client connected');

  // To subscribe the socket to a given channel
  socket.on('join', function (data) {
    socket.join(data.username);
  });

  // To keep track of online users
  socket.on('userPresence', function (data) {
    onlineUsers[socket.id] = {
      username: data.username
    };
    socket.broadcast.emit('onlineUsers', onlineUsers);
  });

  // For message passing
  socket.on('message', function (data) {
    io.sockets.to(data.toUsername).emit('message', data.data);
  });

  // To listen for a client's disconnection from server and intimate other clients about the same
  socket.on('disconnect', function (data) {
    socket.broadcast.emit('disconnected', onlineUsers[socket.id].username);

    delete onlineUsers[socket.id];
    socket.broadcast.emit('onlineUsers', onlineUsers);
  });

});

http.listen(3000, function () {
  console.log('listening on *:3000');
});