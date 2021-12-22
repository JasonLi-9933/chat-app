const express = require("express");
const http = require("http");
const path = require("path");
const Filter = require("bad-words");
const app = express();
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server); // socketio requires to take raw http server as input
const { generateMessage, generateLocationMessage } = require("./utils/messages.js");
app.use("/", express.static(path.join(__dirname, "../public")));
const port = process.env.PORT || 3000;

let count = 0;

// arg socket contains info about the new connection
io.on("connection", (socket) => {
  console.log("New websocket connection.");
  // io.emit() emit to every connection
  // socket.emit() emit to a specific connection
  // socket.broadcast.emit emit everyone else except itself
  socket.emit("message", generateMessage("Welcome!"));
  socket.on("sendMessage", (msg, callback) => {
    let filter = new Filter();
    if (filter.isProfane(msg)) {
      callback("Profanity is not allowed");
      return;
    }
    io.emit("message", generateMessage(msg));
    callback(); // acknowledgement
  });
  socket.broadcast.emit("message", generateMessage("A new user has joined the chat!"));

  socket.on("disconnect", () => {
    io.emit("message", generateMessage("A user has left."));
  });
  socket.on("sendLocation", (position, callback) => {
    io.emit(
      "locationMessage",
      generateLocationMessage(`https://google.com/maps/?q=${position.lat},${position.lng}`)
    );
    callback();
  });
});

server.listen(port, () => {
  console.log("Server listening on port " + port);
});
