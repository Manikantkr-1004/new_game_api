const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server, Room } = require('@colyseus/core');
const { monitor } = require('@colyseus/monitor');
const { WebSocketTransport } = require('@colyseus/ws-transport');

const app = express();
app.use(cors());

const server = http.createServer(app);
const gameServer = new Server({
    transport: new WebSocketTransport({
        server: server,
    })
});

let storeData = [];

// Define your room handlers here

class GameRoom extends Room {
    onCreate(options) {

        this.onMessage('join_room', (client, message) => {
            const { room, name } = message;
            let existingRoom = storeData.filter(ele => ele.room === room);

            if (existingRoom.length===0) {
                storeData.push({ room, name, id: client.sessionId });
                this.broadcast('newjoin', message, { except: client });
            }else if(existingRoom.length===1){
                storeData.push({ room, name, id: client.sessionId });
                this.broadcast('newjoin', message, { except: client });
            }else{}
        });

        this.onMessage('player_position_send', (client, message) => {
            this.broadcast('player_position_receive', message, { except: client });
        });

        this.onMessage('send', (client, message) => {
            this.broadcast('receive', message, { except: client });
        });

        // Define other onMessage handlers here
    }

    onJoin(client, options) {
        console.log(`${client.sessionId} joined.`);
    }

    onLeave(client, consented) {
        let existingRoom = storeData.find(ele => ele.id === client.sessionId);
        this.broadcast('left_room', {room:existingRoom?.room,message:`${existingRoom ? existingRoom?.name : 'Another Person'} left the Game, so You won the Game.`}, { except: client });
        storeData = storeData.filter(ele => ele.id !== client.sessionId);
    }

    onDispose() {
        console.log("Room disposed");
    }
}

gameServer.define('game_room', GameRoom);

//Open this route to see Colyseus Dashboard for Your Game.
app.use('/', monitor());

app.get('/knowroom', async (req, res) => {
    res.send({ storeData });
});


app.use('*', (req, res) => {
    res.send("Welcome to Brandons Game Server.")
})

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
