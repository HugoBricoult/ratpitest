//Appel des modules de node
const express = require('express');
const app = express();

const serv = require('http').Server(app);
const port = 3000;

let player_list = {};
let player = {};

app.get('/',(req, res) => {
    res.sendFile(__dirname + '/game/index.html');
});

app.use('/game',express.static(__dirname + '/game'));
app.use((req, res, next) => res.status(404).sendFile(__dirname + '/game/404.html'))

serv.listen(process.env.PORT || port);
console.log(`*** Démarage du serveur sur le port ${port} ***`);


//socket io
var io = require('socket.io').listen(serv);

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection',(socket) => {
    socket.on('turn',(message)=>{
        socket.broadcast.emit('change',message);
    });
    socket.on('turnr',(message)=>{
        socket.broadcast.emit('changer',message);
    });
    socket.on('posx',(message)=>{
        socket.broadcast.emit('posx',message);
    });
    socket.on('posy',(message)=>{
        socket.broadcast.emit('posy',message);
    });
});

