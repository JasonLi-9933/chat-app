const generateMessage = (text, username) => {
	return {
		text,
		createdAt: new Date().getTime(),
		username
	}
}

const generateLocationMessage = (url, username) => {
	return {
		locationUrl: url,
		createdAt: new Date().getTime(),
		username
	}
}

module.exports = {
	generateMessage,
	generateLocationMessage
}