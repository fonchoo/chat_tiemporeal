const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let usuarios = {};
let historialMensajes = [];

io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado');

    // Enviar historial de mensajes al usuario que se conecta
    socket.emit('chat history', historialMensajes);

    socket.on('typing', (user) => {
        socket.broadcast.emit('typing', user);
    });

    socket.on('stop typing', (user) => {
        socket.broadcast.emit('stop typing', user);
    });

    socket.on('set nickname', (nick, callback) => { 
        if (Object.values(usuarios).includes(nick)) {
            callback({ success: false, message: "Ese apodo ya está en uso, elige otro" });
        } else {
            usuarios[socket.id] = nick;
            io.emit('system message', `${nick} se ha unido al chat`);
            io.emit('user list', Object.values(usuarios));
            callback({ success: true });
        }
    });

    socket.on('chat message', (data) => {
        const {user, msg} = data;
        const message = { user: usuarios[socket.id], text: msg.text };

        if(!user) {
            return;
        }

        historialMensajes.push(message);
        if (historialMensajes.length > 50) {
            historialMensajes.shift();
        }

        io.emit('chat message', { user, msg });
    });

    socket.on('disconnect', () => {
        const nick = usuarios[socket.id];
        if (nick) {
            io.emit('system message', `${nick} ha salido del chat`);
            delete usuarios[socket.id];
            io.emit('user list', Object.values(usuarios));
        }
        console.log('Un usuario se ha desconectado');
    });
});


const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Servidor en puerto ${port}`));

/*
server.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
*/