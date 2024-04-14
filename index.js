const express = require('express');
const { createServer } = require('http');
const { join } = require('path');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = createServer(app);
const io = new Server(server);

const logFilePath = join(__dirname, 'log.txt');

function logToFile(message) {
    fs.appendFile(logFilePath, message + '\n', (err) => {
        if (err) throw err;
        console.log('Message logged to file: ' + message);
    });
}

let onlineUsers = 0;
let usernames = []; // Array to store usernames

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    onlineUsers++;
    console.log('A user has connected...');
    io.emit('update users', onlineUsers, usernames); // Send online user count and usernames

    socket.on('user connected', (username) => {
        socket.username = username;
        usernames.push(username); // Add username to the list
        io.emit('user connected', username);
        io.emit('update users', onlineUsers, usernames); // Send updated user list
    });
    
    socket.on('chat message', (msg) => {
        console.log(`${msg.username}: ${msg.message}`);
        logToFile(`${msg.username}: ${msg.message}`);
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        onlineUsers--;
        console.log('A user has disconnected...');
        const index = usernames.indexOf(socket.username);
        if (index !== -1) {
            usernames.splice(index, 1); // Remove username from the list
        }
        io.emit('user disconnected', socket.username);
        io.emit('update users', onlineUsers, usernames); // Send updated user list
    });
});

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});
