let peerConnection;
let watchedStreamerId;
const socket = io.connect(window.location.origin);
let hasStarted = false;
const startButton = document.querySelector('watching');
const video = document.getElementsByClassName("remoteVideo")[0];

socket.on("offer", (id, description) => {
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

function changeReadiness() {
    hasStarted = true;
    watchedStreamerId = document.querySelector('input').value;
    socket.emit("watcher", socket.id, watchedStreamerId);
}

socket.on("candidate", (id, candidate) => {
  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));
});

socket.on("connect", () => {
    socket.emit("info", socket.id, "Has started");
});

socket.on("broadcaster", () => {
    if (socket.id == watchedStreamerId)
	socket.emit("watcher", socket.id);
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
  peerConnection.close();
};
