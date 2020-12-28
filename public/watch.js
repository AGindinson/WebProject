let peerConnection;
let watchedStreamerId;
const socket = io.connect(window.location.origin);
const video = document.querySelector("remoteVideo");

socket.on("offer", (id, description) => {
    if (socket.id !== watchedStreamerId) return;
  peerConnection = new RTCPeerConnection();
  peerConnection
    .setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("answer", id, peerConnection.localDescription);
    });
  peerConnection.ontrack = event => {
    video.srcObject = event.streams[0];
  };
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };
});

socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("connect", () => {
    socket.emit("watcher", watchedStreamerId);
});

socket.on("broadcaster", () => {
    if (socket.id == watchedStreamerId)
	socket.emit("watcher", socket.id);
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
  peerConnection.close();
};
