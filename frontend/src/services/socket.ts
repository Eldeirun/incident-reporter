import { io, Socket } from "socket.io-client";
const SOCKET_URL = "http://192.168.1.198:3000";

let socket: Socket;

export const connectSocket = () => {
  socket = io(SOCKET_URL, {
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("WebSocket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("WebSocket disconnected");
  });

  return socket;
};

export const getSocket = () => socket;
