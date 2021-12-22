const socket = io();
const form = document.querySelector("form#message-form");
const formInput = form.querySelector("#message");
const formBtn = form.querySelector("#form-btn");
const sendLocationBtn = document.querySelector("button#send-location");
const messagesDiv = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector("#location-msg-template").innerHTML;

socket.on("message", (payload) => {
  console.log(payload);
	let html = Mustache.render(messageTemplate, {
		message: payload.text,
		createdAt: moment(payload.createdAt).format("h:mm:ss A")
	});
	messagesDiv.insertAdjacentHTML('beforeend', html);
});

socket.on("locationMessage", (payload) => {
	let html = Mustache.render(locationMessageTemplate, {
		locationUrl: payload.locationUrl,
		createdAt: moment(payload.createdAt).format("h:mm:ss A")
	});
	messagesDiv.insertAdjacentHTML("beforeend", html);
})

// Sender: sends a acknowledgment callback function
// Receiver: calls the acknowledgment callback function

form.addEventListener("submit", (e) => {
  e.preventDefault();

	formBtn.setAttribute('disabled', 'disabled');

  let message = e.target.elements.message.value;
  socket.emit("sendMessage", message, (err) => {
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
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        () => {
          console.log("Location shared");
					sendLocationBtn.removeAttribute("disabled")
        }
      );
    });
  } else {
    return alert("Geolocation is not supported on your browser");
  }
});
