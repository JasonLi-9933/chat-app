const socket = io();
const form = document.querySelector("form#message-form");
const formInput = form.querySelector("#message");
const formBtn = form.querySelector("#form-btn");
const sendLocationBtn = document.querySelector("button#send-location");
const messagesDiv = document.querySelector("#messages");
const sidebarDiv = document.querySelector("#sidebar");
// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-msg-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
	let newMsg = messagesDiv.lastElementChild;
	let newMsgStyles = getComputedStyle(newMsg);
	let newMsgMargin = parseInt(newMsgStyles.marginBottom);
	let newMsgHeight = newMsg.offsetHeight + newMsgMargin;
	let visibleHeight = messagesDiv.offsetHeight;
	let messagesContainerHeight = messagesDiv.scrollHeight;
	let scrollOffset = messagesDiv.scrollTop + visibleHeight;

	if (messagesContainerHeight - newMsgHeight <= scrollOffset) {
		messagesDiv.scrollTop = messagesDiv.scrollHeight;
	}
}

socket.on("message", (payload) => {
  console.log(payload);
  let html = Mustache.render(messageTemplate, {
    message: payload.text,
    createdAt: moment(payload.createdAt).format("h:mm:ss A"),
    username: payload.username,
  });
  messagesDiv.insertAdjacentHTML("beforeend", html);
	autoscroll();
});

socket.on("locationMessage", (payload) => {
  let html = Mustache.render(locationMessageTemplate, {
    locationUrl: payload.locationUrl,
    createdAt: moment(payload.createdAt).format("h:mm:ss A"),
		username: payload.username
  });
  messagesDiv.insertAdjacentHTML("beforeend", html);
	autoscroll();
});

// Sender: sends a acknowledgment callback function
// Receiver: calls the acknowledgment callback function

form.addEventListener("submit", (e) => {
  e.preventDefault();

  formBtn.setAttribute("disabled", "disabled");

  let message = e.target.elements.message.value;
  socket.emit("sendMessage", { message, username }, (err) => {
    if (err) console.log(err);
    else {
      console.log("Message Delivered");
    }
    formBtn.removeAttribute("disabled");
    formInput.value = "";
    formInput.focus();
  });
});

sendLocationBtn.addEventListener("click", () => {
  sendLocationBtn.setAttribute("disabled", "disabled");
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      socket.emit(
        "sendLocation",
        {
          position: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
					username
        },
        () => {
          console.log("Location shared");
          sendLocationBtn.removeAttribute("disabled");
        }
      );
    });
  } else {
    return alert("Geolocation is not supported on your browser");
  }
});

socket.emit("join", { username, room }, (error) => {
	if (error) {
		alert(error);
		location.href = "/";
	}
});

socket.on("roomData", ({room, users}) => {
	const html = Mustache.render(sidebarTemplate, {
		room, 
		users
	});
	sidebarDiv.innerHTML = html;
})