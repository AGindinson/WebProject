const express = require("express");
const app = express();

let broadcasterSet = new Set();
let watcherToBroadcasterMap = new Map();
const port = 4000;

const http = require("http");
const server = http.createServer(app);

const io = require("socket.io")(server);
app.use(express.static(__dirname + "/public"));

io.sockets.on("error", e => console.log(e));
io.sockets.on("connection", socket => {
    socket.on("broadcaster", () => {
	broadcasterSet.add(socket.id);
	console.log(socket.id);
      socket.broadcast.emit("broadcaster", socket.id);
  });
    socket.on("watcher", (id, requestedStreamerId) => {
	console.log(requestedStreamerId);
      if (!broadcasterSet.has(requestedStreamerId)) return;
      watcherToBroadcasterMap.set(socket.id, requestedStreamerId);
      socket.to(requestedStreamerId).emit("watcher", socket.id);
  });
  socket.on("offer", (id, message) => {
    socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message) => {
      console.log("Answer from socket ${socket.id}");
    socket.to(id).emit("answer", socket.id, message);
  });
  socket.on("info", (id, message) => {
      console.log("Message from socket ${id}");
    console.log(message);
  });
  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });
  socket.on("disconnect", () => {
      if (!watcherToBroadcasterMap.has(socket.id)) return;
      let broadcaster = watcherToBroadcasterMap.get(socket.id);
      watcherToBroadcasterMap.delete(socket.id);
      socket.to(broadcaster).emit("disconnectPeer", socket.id);
  });
});
server.listen(port, () => console.log(`Server is running on port ${port}`));
