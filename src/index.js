const express = require('express');
const server = require('http').createServer(express);
const io = require('socket.io')(server);



const app = express();
const port = 3000;

/*app.listen(port, ()=> {
    console.info('Listening on port %d', port)
});*/

io.on('connection', () => { console.info('Listening on port %d', port) });
server.listen(3000);
