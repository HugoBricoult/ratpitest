//Appel des modules de node
const express = require('express');
const app = express();
const fs = require('fs');

const serv = require('http').Server(app);
const port = 3000;
const top10="top10.json";

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

    socket.on('score',(score)=>{
        let mylist=readTopToList(top10);
        let newlist=checkAndAddToTop10(mylist,score);
        writeListToTop(top10,newlist);
    });
});


function checkAndAddToTop10(listTop,Contender){//takes a list of object and the contender as object
    let added=false;
    for(el in listTop){
        if (listTop[el].time>=Contender.time){
            listTop.splice(el,0,Contender);
            break
        }
         //returns new top based on time in ms as a list of objects
    }
    if(listTop.length <10 && !added){
        listTop.push(Contender);
    }else if(listTop.length >10){
        listTop=listTop.slice(0,10);
    }
    return listTop;
}
function writeListToTop(filepath,listTop){
    let obj={
        "top":listTop
    }
    let json = JSON.stringify(obj)
    fs.writeFile (filepath, json, function(err) {
        if (err) throw err;
        console.log('Updating leaderboard');
        });
}

function readTopToList(filepath){
    return JSON.parse(fs.readFileSync(filepath, 'utf8'))["top"]
}



let test={"pseudo":"newratpi2",
time: 97011}



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

