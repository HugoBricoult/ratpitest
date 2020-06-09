//GAME PARAMETERS
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const GRAVITY = 900;
const RENDER_FPS = 144;
const PLAYER_FRAME_WIDTH = 80;
const PLAYER_FRAME_HEIGT = 80;
const SPAWN_X = 100;
const SPAWN_Y = 450;
const VELOCITY_RIGHT_LEFT_CHANGE_X = 5;
const VELOCITY_X_MAX_SPEED = 300;
const VELOCITY_Y = 460;
const VELOCITY_STOP_SPEED = 15;

const PLAYER_SKIN_PATH = './game/assets/game/img/frog.png';
const TILE_SET_PATH = './game/assets/game/img/tileset.png';
const MAP_PATH = './game/assets/game/map/cityMap.json';

//GAME CONFIG
let config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: GRAVITY },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

//NEW GAME INSTANCE PHASER 3
let game = new Phaser.Game(config);

//CURRENT PLAYER AND PLAYERS LIST
let player;
let players = [];

//INPUTS
let cursors;

//LOAD ASSETS
function preload ()
{
    this.load.image("tiles", TILE_SET_PATH);
    this.load.tilemapTiledJSON("map", MAP_PATH);
    this.load.spritesheet('frog',
        PLAYER_SKIN_PATH,
        { frameWidth: PLAYER_FRAME_WIDTH, frameHeight: PLAYER_FRAME_HEIGT }
    );
}

//GAME CREATE AND SOCKET LISTENNER
function create ()
{
    console.log(this.cameras.main);
    //RENDER FPS
    this.physics.world.setFPS(RENDER_FPS);

    //CREATE MAP
    const MAP = this.make.tilemap({ key: "map"});
    const tset = MAP.addTilesetImage("road", "tiles");

    const Road = MAP.createStaticLayer("road", tset, 0, 0);
    Road.setCollisionByProperty({ collides: true });
    Road.setScale(1);

    /* const debugGraphics = this.add.graphics().setAlpha(0.75);
    Road.renderDebug(debugGraphics, {
        tileColor: null, // Color of non-colliding tiles
        collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
       }); */

    const plateforms = MAP.createStaticLayer("plateforms", tset, 0, 0);
    plateforms.setCollisionByProperty({ collides: true });
    plateforms.setScale(1);


    const decorsOverlay = MAP.createStaticLayer("decors overlay", tset, 0, 0);
    const decors = MAP.createStaticLayer("decors", tset, 0, 0);

    const spawnPoint = MAP.objects[1];


    //create other players
    for(i in playerList){
        if(playerList[i].id != idClient){
            let p = this.physics.add.sprite(210,2070,'frog');
            //p.setCollideWorldBounds(true);
            p.setBounce(0);
            p.id = playerList[i].id;
            p.tint = (playerList[i].id / 1000) * 0xffffff;
            p.setScale(0.25);
            this.physics.add.collider(p,Road);
            this.physics.add.collider(p,plateforms);
            players.push(p);
        }
    }

    //create main player
    player = this.physics.add.sprite(210,2070, 'frog');
    player.setBounce(0);
    //player.setCollideWorldBounds(true);  //body box 8/48 et décallé de 12 par rapport a la base
    player.id = idClient;
    player.tint = (idClient/1000) * 0xffffff;
    player.setScale(0.25);

    const camera = this.cameras.main;
    camera.startFollow(player);
    camera.setBounds(0, 0, MAP.widthInPixels, MAP.heightInPixels);
    
    this.physics.add.collider(player, Road);
    this.physics.add.collider(player, plateforms);

    //create animations
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

    //update other players
    socket.on('updatePlayerMove',(data)=>{
        let d = JSON.stringify(data);
        for(i in players){
            if(players[i].id == data[4]){
                players[i].x = data[0];
                players[i].y = data[1];
                players[i].setVelocityX(data[2]);
                players[i].setVelocityY(data[3]);
                players[i].anims.play(data[5]);
            }
        }
    });
    //remove a player
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
    //add a player
    socket.on('new_player',(newPlayer)=>{
        let newP = JSON.parse(newPlayer);
        if(newP.id != idClient){
            playerList.push(newP);
            console.log(playerList);
            let p = this.physics.add.sprite(210,2070,'frog');
            //p.setCollideWorldBounds(true);
            p.setBounce(0);
            p.id = newP.id;
            p.tint = (newP.id/1000) * 0xffffff;
            p.setScale(0.25);
            this.physics.add.collider(p,Road);
            this.physics.add.collider(p,plateforms);
            players.push(p);
        }
    });
            
}

//GAME LOOP
function update ()
{
    //CURRENT PLAYER VELOCITY X
    if (cursors.left.isDown & player.body.velocity.x >= -VELOCITY_X_MAX_SPEED) {
        //left
        player.anims.play('left', true);
        player.setVelocityX(player.body.velocity.x - VELOCITY_RIGHT_LEFT_CHANGE_X);
        //emit
        socket.emit('playerMove',[player.x,player.y,player.body.velocity.x - VELOCITY_RIGHT_LEFT_CHANGE_X,player.body.velocity.y,idClient,'left']);
        socket.emit('playerPos',[]);
        
    }
    else if (cursors.right.isDown & player.body.velocity.x <= VELOCITY_X_MAX_SPEED) {
        //right
        player.anims.play('right', true);
        player.setVelocityX(player.body.velocity.x +VELOCITY_RIGHT_LEFT_CHANGE_X);
        //emit
        socket.emit('playerMove',[player.x,player.y,player.body.velocity.x + VELOCITY_RIGHT_LEFT_CHANGE_X,player.body.velocity.y,idClient,'right']);
    }
    else{ //stop if nothings (with innertie)
        if(player.body.velocity.x >= VELOCITY_STOP_SPEED){
            player.setVelocityX(player.body.velocity.x - VELOCITY_STOP_SPEED);
        }else if(player.body.velocity.x <= -VELOCITY_STOP_SPEED){
            player.setVelocityX(player.body.velocity.x + VELOCITY_STOP_SPEED);
        }else{
            player.setVelocityX(0);
        }
    }

    //CURRENT PLAYER VELOCITY Y
    if(cursors.space.isDown & player.body.blocked.down){
        //jump
        player.setVelocityY(- VELOCITY_Y);
        //emit
        socket.emit('playerMove',[player.x,player.y,player.body.velocity.x,- VELOCITY_Y,idClient,'right']);
    }

    
}

