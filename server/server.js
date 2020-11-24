require("dotenv").config();
const http = require("http");
const path = require("path");
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const socketIO = require("socket.io");
const jwtAuth = require("socketio-jwt-auth");
require("./config/passport");
const db = require("./database");
const apiRoute = require("./routes/index");
const app = express();

app.use(express.static(path.join(__dirname, "../dist/cooperatex")));
app.get("/*", (req, res) => res.sendFile(path.join(__dirname)));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use("/api", apiRoute);

app.use((req, res, next) => {
  let error = new Error("Not Found");
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send("Unauthorized access");
  }
});

const server = http.createServer(app);
const port = process.env.HTTP_PORT || 4201;
const host = process.env.HTTP_HOST || "::";
server.listen(port, host, () =>
  console.log(`Server running on: http://${host}:${port}`)
);

const io = socketIO(server);

// Authentication middleware
io.use(
  jwtAuth.authenticate({ secret: process.env.JWT_SECRET }, (payload, done) => {
    try {
      const user = db.get("user").find({ _id: payload._id }).value();
      
      if (!user) return done(null, false, "User does not exist");
      return done(null, { _id: user._id, username: user.username });
    } catch (err) {
      return done(err);
    }
  })
);

const userPrefix = "user-";
io.sockets.on("connection", (socket) => {
  socket.on("joinUserSession", () => {
    const prefixedUserId = userPrefix + socket.request.user._id;
    if (!socket.rooms[prefixedUserId]) socket.join(prefixedUserId);
  });

  socket.on("joinProjectSession", (projectId) => {
    socket.join(projectId, () => {
      socket.to(projectId).emit("joinedProjectSession", socket.request.user);

      let activeUserIds = [];
      Object.keys(io.sockets.adapter.rooms[projectId].sockets).forEach(
        (socketId) => {
          const userId = Object.keys(
            io.sockets.adapter.sids[socketId]
          ).find((room) => room.includes(userPrefix));
          if (userId) activeUserIds.push(userId.substring(userPrefix.length));
        }
      );

      io.sockets
        .to(projectId)
        .emit("activeUserIdsInProjectSession", activeUserIds);
    });
  });

  socket.on("leaveProjectSession", (projectId) => {
    socket.leave(projectId, (err) => {
      if (!err)
        socket.to(projectId).emit("leftProjectSession", socket.request.user);
    });
  });

  socket.on("projectChange", (projectId) => {
    socket.to(projectId).emit("projectChange");
  });

  socket.on("cursorChange", (projectId, data) => {
    socket.to(projectId).emit("cursorChange", data);
  });

  socket.on("selectionChange", (projectId, data) => {
    socket.to(projectId).emit("selectionChange", data);
  });

  socket.on("fileContentsChange", (projectId, data) => {
    socket.to(projectId).emit("fileContentsChange", data);
  });

  socket.on("invitationChange", (user) => {
    io.sockets.to(userPrefix + user._id).emit("invitationChange");
  });

  socket.on("collaboratorChange", (user) => {
    io.sockets.to(userPrefix + user._id).emit("collaboratorChange");
  });

  socket.on("projectAvailabilityChange", (user) => {
    io.sockets.to(userPrefix + user._id).emit("projectAvailabilityChange");
  });
});
