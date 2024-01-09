const urlRoom = document.getElementById("url-room");
const characters = "abcdefghijklmnopqrstuvwxyz0123456789";

let randomUrl = "";

for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomUrl += characters[randomIndex];
  }
  if (i < 2) {
    randomUrl += "-";
  }
}

urlRoom.value = randomUrl;

let form = document.getElementById("lobby__form");

let displayName = sessionStorage.getItem("display_name");
if (displayName) {
  form.name.value = displayName;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  sessionStorage.setItem("display_name", e.target.name.value);

  let inviteCode = e.target.room.value;
  if (!inviteCode) {
    inviteCode = String(Math.floor(Math.random() * 10000));
  }
  window.location = `room?room=${inviteCode}`;
});

document.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/";
  }
});
