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
    player = this.physics.add.sprite(100, 450, 'frog');
            player.setBounce(0);
            player.setCollideWorldBounds(true);  //body box 8/48 et décallé de 12 par rapport a la base

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
            cursors = this.input.keyboard.createCursorKeys();
            socket.on('change',(vel)=>{
                player.setVelocityX(parseInt(vel));
                player.anims.play('left', true);
            });
            socket.on('changer',(vel)=>{
                player.setVelocityX(parseInt(vel));
                player.anims.play('right', true);
            });
            socket.on('posx',(vel)=>{
                player.x(parseInt(vel));
            });
            socket.on('posy',(vel)=>{
                player.y(parseInt(vel));
            });
            
}

function update ()
{
    if (cursors.left.isDown ) {
        player.setVelocityX(player.body.velocity.x -5);
        socket.emit('turn',player.body.velocity.x -5);
        socket.emit('posx',player.x);
        socket.emit('posy',player.y);
        player.anims.play('left', true);
    }
    else if (cursors.right.isDown ) {
        player.setVelocityX(player.body.velocity.x +5);
        player.anims.play('right', true);
        socket.emit('turnr',player.body.velocity.x +5);
        socket.emit('posx',player.x);
        socket.emit('posy',player.y);
    }
}

