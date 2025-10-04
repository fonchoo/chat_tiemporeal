const socket = io();
let nickname = null;
let typingTimeout;
let isTyping = false;

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages'); // usamos este
const nicknameInput = document.getElementById('nickname');
const nicknameContainer = document.getElementById('nickname-container');
const userList = document.createElement('div');
const typingDiv = document.getElementById('typing');

userList.id = "userList";
document.body.appendChild(userList);

// Recibir historial de mensajes al conectarse
socket.on('chat history', (messagesHistory) => {
    messagesHistory.forEach((msg) => {
        const item = document.createElement('li');
        item.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
        messages.appendChild(item);   // CORREGIDO
    });
    messages.scrollTop = messages.scrollHeight;
});

// Indicador de escritura
input.addEventListener('input', () => {
    if (!isTyping && input.value.trim() !== "" && nickname) {
        socket.emit('typing', nickname);
        isTyping = true;
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        socket.emit('stop typing', nickname);
        isTyping = false;
    }, 1500);
});

socket.on('typing', (user) => {
    typingDiv.textContent = `${user} está escribiendo...`;
});

socket.on('stop typing', () => {
    typingDiv.textContent = '';
});

// Establecer apodo
function setNickname() {
    const nick = nicknameInput.value.trim();
    if (nick) {
        socket.emit('set nickname', nick, (response) => {
            if (response.success) {
                nickname = nick;
                nicknameContainer.style.display = 'none';
                form.style.display = 'flex';
            } else {
                alert(response.message);
            }
        });
    } else {
        alert("Por favor ingresa un apodo válido");
    }
}

// Enviar mensaje
form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value && nickname) {
        socket.emit('chat message', { text: input.value });
        input.value = '';
    } else if (!nickname){
        alert('Debes ingresar un apodo antes de escribir.');
    }
});

// Mostrar mensajes en la lista
socket.on('chat message', function(msg) {
    const item = document.createElement('li');
    item.innerHTML = `<strong>${msg.user}:</strong> ${msg.text}`;
    if(msg.user === nickname){
        item.classList.add('me');
    } else{
        item.classList.add('other');
    }

    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});

// Mensajes del sistema
socket.on('system message', function(msg) {
    const item = document.createElement('li');
    item.style.color = "gray";
    item.textContent = msg;
    messages.appendChild(item);
});

// Lista de usuarios conectados
socket.on('user list', function(users) {
    userList.innerHTML = `<h3>Usuarios conectados:</h3><ul>${users.map(u => `<li>${u}</li>`).join("")}</ul>`;
});
