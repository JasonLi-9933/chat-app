const express = require("express");
const http = require("http");
const path = require("path");
const Filter = require("bad-words");
const app = express();
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server); // socketio requires to take raw http server as input
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages.js");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users.js");

app.use("/", express.static(path.join(__dirname, "../public")));
const port = process.env.PORT || 3000;

// arg socket contains info about the new connection
io.on("connection", (socket) => {
  console.log("New websocket connection.");
  // io.emit() emit to every connection
  // socket.emit() emit to a specific connection
  // socket.broadcast.emit emit everyone else except itself

  // io.to(room).emit() and socket.broadcast.to(room).emit() are room-specific emission

  socket.on("join", (payload, callback) => {
    const {error, user} = addUser({
      id: socket.id,
      username: payload.username,
      room: payload.room
    });

		if (error) {
			callback(error);
			return;
		}

    socket.join(user.room); // join() can only be called on server side
    socket.emit("message", generateMessage("Welcome!", "Admin"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage(`${user.username} has joined the chat!`, "Admin")
      );
		io.to(user.room).emit("roomData", {
			room: user.room,
			users: getUsersInRoom(user.room)
		});
		callback();
  });

  socket.on("sendMessage", (payload, callback) => {
    let filter = new Filter();
    if (filter.isProfane(payload.message)) {
      callback("Profanity is not allowed");
      return;
    }
		let targetUser= getUser(socket.id);
		if (!targetUser) {
			callback("NO user found!");
			return;
		}
    io.to(targetUser.room).emit("message", generateMessage(payload.message, targetUser.username));
    callback(); // acknowledgement
  });

  socket.on("disconnect", () => {
		const removedUser = removeUser(socket.id);
		if (removedUser) {
			io.to(removedUser.room).emit("message", generateMessage(`${removedUser.username} has left`, "Admin"));
			io.to(removedUser.room).emit("roomData", {
				room: removedUser.room,
				users: getUsersInRoom(removedUser.room)
			});
		}
  });
  socket.on("sendLocation", (payload, callback) => {
		let targetUser= getUser(socket.id);
		if (!targetUser) {
			callback("NO user found!");
			return;
		}
    io.to(targetUser.room).emit(
      "locationMessage",
      generateLocationMessage(
        `https://google.com/maps/?q=${payload.position.lat},${payload.position.lng}`,
        targetUser.username
      )
    );
    callback();
  });
});

server.listen(port, () => {
  console.log("Server listening on port " + port);
});
