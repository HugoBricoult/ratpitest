//Appel des modules de node
const express = require('express');
const app = express();

const serv = require('http').Server(app);
const port = 3000;

let player_list = [];
let id_list = new Set();

app.get('/',(req, res) => {
    res.sendFile(__dirname + '/game/index.html');
});

app.use('/game',express.static(__dirname + '/game'));
app.use((req, res, next) => res.status(404).sendFile(__dirname + '/game/404.html'))

serv.listen(process.env.PORT || port);
console.log(`*** Démarage du serveur sur le port ${port} ***`);


//socket io
var io = require('socket.io').listen(serv);

// Quand un joueur se connect, initiation joueur
io.sockets.on('connection',(socket) => {
    let id = generateRandom();
    let player_param = {
        "id":id,
        "posx":100,
        "posy":450,
        "velx":0,
        "vely":0,
        "anim":"right",
        "pseudo":"Spaceman"+id
    };

    player_list.push(player_param);

    socket.id = id;
    socket.emit('player_list', JSON.stringify(player_list));
    socket.emit('id',socket.id);

    //update new player
    socket.broadcast.emit('new_player',JSON.stringify(player_param));

    //update disconnect
    socket.on('disconnect',()=>{
        id_list.delete(socket.id);
        for(el in player_list){
            if(player_list[el].id == socket.id){
                player_list.splice(el,1);
                socket.broadcast.emit('remove_player',socket.id);
            }
        }
        //socket.broadcast.emit('remove_player',JSON.stringify(player_list));
    });

    //Mouvement update
    socket.on('playerMove',(data)=>{
        for(el in player_list){
            if(data[4] == player_list[el].id){
                data.push(player_list[el].pseudo);
                break;
            }
        }
        data = JSON.stringify(data);
        socket.broadcast.emit('updatePlayerMove',data);
    });

    socket.on('pseudoSet',(pseudo)=>{
        let data = JSON.parse(pseudo);
        for(el in player_list){
            if(data[1] == player_list[el].id){
                player_list[el].pseudo = data[0];
                break;
            }
        }
        socket.broadcast.emit('updatePseudo',pseudo);
    });
});



//generate id
let generateRandom = ()=>{
    let id = Math.floor(Math.random() * 1000);
    if(id_list.has(id)){
        generateRandom();
    }else{
        id_list.add(id);
        return id;
    }
}

