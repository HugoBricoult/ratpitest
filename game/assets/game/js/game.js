let config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    fps: 144,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};
let game = new Phaser.Game(config);

let player;
let players = [];
let cursors;
function preload ()
{
    this.load.spritesheet('frog',
        './game/assets/game/img/frog.png',
        { frameWidth: 80, frameHeight: 80 }
    );
}

function create ()
{
    this.physics.world.setFPS(60);

    //create other players
    
    for(i in playerList){
        if(playerList[i].id != idClient){
            let p = this.physics.add.sprite(playerList[i].posx,playerList[i].posy,'frog');
            p.setCollideWorldBounds(true);
            p.setBounce(0);
            p.id = playerList[i].id;
            p.tint = Math.random() * 0xffffff;;
            players.push(p);
        }
    }

    //create own players
    player = this.physics.add.sprite(100, 450, 'frog');
    player.setBounce(0);
    player.setCollideWorldBounds(true);  //body box 8/48 et décallé de 12 par rapport a la base
    player.id = idClient;
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('frog', { start: 0, end: 15 }),
        frameRate: 15,
        repeat: -1
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('frog', { start: 16, end: 30 }),
        frameRate: 15,
        repeat: -1
    });

    //keyboard
    cursors = this.input.keyboard.createCursorKeys();

    //update player
    socket.on('updatePlayerMove',(data)=>{
        let d = JSON.stringify(data);
        for(i in players){
            if(players[i].id == data[4]){
                players[i].x = data[0];
                players[i].y = data[1];
                players[i].setVelocityX(data[2]);
                players[i].anims.play(data[5]);
            }
        }
    });
    socket.on('remove_player',(remove_player)=>{
        for(el in playerList){
            if(playerList[el].id == parseInt(remove_player)){
                playerList.splice(el,1);
            }
        }
        for(el in players){
            if(players[el].id == remove_player){
                players[el].destroy();
                players.splice(el,1);
            }
        }

    });
    socket.on('new_player',(newPlayer)=>{
        let newP = JSON.parse(newPlayer);
        if(newP.id != idClient){
            playerList.push(newP);
            console.log(playerList);
            let p = this.physics.add.sprite(newP.posx,newP.posy,'frog');
            p.setCollideWorldBounds(true);
            p.setBounce(0);
            p.id = newP.id;
            p.tint = Math.random() * 0xffffff;;
            players.push(p);
        }
    });
            
}

function update ()
{
    //current player
    if (cursors.left.isDown ) {
        //current affect
        player.anims.play('left', true);
        player.setVelocityX(player.body.velocity.x - 5);
        //emit
        socket.emit('playerMove',[player.x,player.y,player.body.velocity.x -5,player.body.velocity.y,idClient,'left']);
        socket.emit('playerPos',[]);
        
    }
    else if (cursors.right.isDown ) {
        //current affect
        player.anims.play('right', true);
        player.setVelocityX(player.body.velocity.x +5);
        //emit
        socket.emit('playerMove',[player.x,player.y,player.body.velocity.x +5,player.body.velocity.y,idClient,'right']);
    }
}

