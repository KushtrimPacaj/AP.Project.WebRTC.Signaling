const express = require("express");
const http = require('http');

const app = express();

const httpServer = http.createServer(app).listen(3000);
const io = require('socket.io')({
    transports: ['websocket', 'polling'],
    serveClient: false,
    path: '/socket.io'
}).listen(httpServer);

var clients = []; // clients = [{socketId:"SOCKET_ID", userId:"USER UUID", username: "USER_NAME" }]

app.get("/onlineUsers", function (req, res) {
    res.json(clients);
});

io.on('connection', function (socket) {

    socket.on('saveUserInfo', function (data) {
        console.log("Connected user: (" + data.userId + " , " + data.username + " ) with socketID: " + socket.client.id)
        const index = getClientIndex(socket.client.id);
        const client = {
            socketId: socket.client.id,
            userId: data.userId,
            username: data.username,
        };
        if (index === -1) {
            clients.push(client);
        } else {
            clients[index] = client;
        }

        //send info to others that this client came online
        for (let i = 0; i < clients.length; i++) {
            if (clients[i].socketId !== socket.client.id) {
                io.to(clients[i].socketId).emit('onUserOnline', client);
            }
        }
    });

    socket.on('callUser', function (data) {
        const targetSocketId = findSocketId(data.targetUserId);

        if (targetSocketId != null) {
            console.log("ON.callUser, sending event onIncomingCall to id " + data.targetUserId + " with data: '" + JSON.stringify(data) + "'");
            io.to(targetSocketId).emit('onIncomingCall', data);
        }
    });

    socket.on("answerCall", function (data) {
        const targetSocketId = findSocketId(data.targetUserId);
        if (targetSocketId != null) {
            console.log("ON.answerCall, sending event onCallAnswered to id " + data.targetUserId + " with data: '" + JSON.stringify(data) + "'");
            io.to(targetSocketId).emit('onCallAnswered', data);
        }
    });

    socket.on("declineCall", function (data) {
        const targetSocketId = findSocketId(data.targetUserId);
        if (targetSocketId != null) {
            console.log("ON.declineCall, sending event onCallDeclined to id " + data.targetUserId + " with data: '" + JSON.stringify(data) + "'");
            io.to(targetSocketId).emit('onCallDeclined', data);
        }
    });

    socket.on("endCall", function (data) {
        const targetSocketId = findSocketId(data.targetUserId);
        if (targetSocketId != null) {
            console.log("ON.endCall, sending event onCallEnded to id " + data.targetUserId + " with data: '" + JSON.stringify(data) + "'");
            io.to(targetSocketId).emit('onCallEnded', data);
        }
    });


    socket.on("sendOffer", function (data) {
        const targetSocketId = findSocketId(data.targetUserId);
        if (targetSocketId != null) {
            console.log("ON.sendOffer, sending event onReceivedOffer to id " + data.targetUserId + " with data: '" + JSON.stringify(data) + "'");
            io.to(targetSocketId).emit('onReceivedOffer', data);
        }
    });


    socket.on("sendAnswer", function (data) {
        const targetSocketId = findSocketId(data.targetUserId);
        if (targetSocketId != null) {
            console.log("ON.sendAnswer, sending event onReceivedAnswer to id " + data.targetUserId + " with data: '" + JSON.stringify(data) + "'");
            io.to(targetSocketId).emit('onReceivedAnswer', data);
        }
    });

    socket.on("sendIceCandidate", function (data) {
        const targetSocketId = findSocketId(data.targetUserId);
        if (targetSocketId != null) {
            console.log("ON.sendIceCandidate, sending event onReceivedIceCandidate to id " + data.targetUserId + " with data: '" + JSON.stringify(data) + "'");
            io.to(targetSocketId).emit('onReceivedIceCandidate', data);
        }
    });

    socket.on('disconnect', function (data) {
        console.log("User disconnected: " + socket.client.id)
        let disconnectedClient = null;
        for (let i = 0; i < clients.length; i++) {
            if (clients[i].socketId === socket.client.id) {
                disconnectedClient = clients[i];
                clients.splice(i, 1);
                break;
            }
        }
        for (let i = 0; i < clients.length; i++) {
            io.to(clients[i].socketId).emit('onUserDisconnected', disconnectedClient);
        }

    });

});

function findSocketId(userId) {
    for (let i = 0; i < clients.length; i++) {
        if (clients[i].userId === userId) {
            return clients[i].socketId;
        }
    }
    return null;
}

function deleteBySocketId(socketId) {
    for (let i = 0; i < clients.length; i++) {
        if (clients[i].socketId === socketId) {
            clients.splice(i, 1);
        }
    }
}

function getClientIndex(socketId) {
    for (let i = 0; i < clients.length; i++) {
        if (clients[i].socketId === socketId) {
            return i;
        }
    }
    return -1;
}
