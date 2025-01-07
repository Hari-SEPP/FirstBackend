const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    const room = rooms.get(roomId) || new Set();
    room.add(socket.id);
    rooms.set(roomId, room);

    // Notify other peers in the room
    socket.to(roomId).emit("user-joined", socket.id);

    // Send number of peers in the room
    io.to(roomId).emit("room-info", Array.from(room));
  });

  socket.on("offer", ({ offer, roomId, toId }) => {
    socket.to(toId).emit("offer", { offer, fromId: socket.id });
  });

  socket.on("answer", ({ answer, roomId, toId }) => {
    socket.to(toId).emit("answer", { answer, fromId: socket.id });
  });

  socket.on("ice-candidate", ({ candidate, roomId, toId }) => {
    socket.to(toId).emit("ice-candidate", { candidate, fromId: socket.id });
  });

  socket.on("disconnect", () => {
    // Remove user from all rooms
    rooms.forEach((peers, roomId) => {
      if (peers.has(socket.id)) {
        peers.delete(socket.id);
        if (peers.size === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit("user-left", socket.id);
          io.to(roomId).emit("room-info", Array.from(peers));
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});

//              this is for the videoChat1.jsx

// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });

// io.on("connection", (socket) => {
//   console.log("User connected");

//   socket.on("create-call", (callId) => {
//     socket.join(callId);
//   });

//   socket.on("join-call", (callId) => {
//     socket.join(callId);
//   });

//   socket.on("offer", ({ callId, offer }) => {
//     socket.to(callId).emit("offer", { callId, offer });
//   });

//   socket.on("answer", ({ callId, answer }) => {
//     socket.to(callId).emit("answer", { callId, answer });
//   });

//   socket.on("ice-candidate", ({ callId, candidate }) => {
//     socket.to(callId).emit("ice-candidate", { callId, candidate });
//   });

//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//   });
// });

server.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
