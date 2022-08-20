const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser,  getRoomUsers, userLeave } = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);



// Set static folder
app.use(express.static(path.join(__dirname,'public')));

const botName = 'ChatCord Bot';

// Run when client connects
io.on("connection", (socket) => {
     // envoi d'un message au client

     // réception d'un message envoyé par le client
    socket.on("joinRoom", ({ username, room }) => {  // on => reception
      const user = userJoin(socket.id, username, room);
  
      socket.join(user.room);
  
      // Welcome current user
      // envoi d'un message au client
      socket.emit("message", formatMessage(botName, "Welcome to ChatCord!")); // emit => envoi
  
      // Broadcast when a user connects
      socket.broadcast  //Broadcasting means We can send the message to all the connected clients, to clients on a namespace and clients in a particular room.
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has joined the chat`)
        );
  
      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    });
  
     
    // this is to all client in general         io.emit() 


     // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});


const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on PORT ${PORT}`));