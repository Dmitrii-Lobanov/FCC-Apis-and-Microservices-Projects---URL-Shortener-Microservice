const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const shortUrl = require("./models/shortUrl");

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname + "/public"));

//Connect to our database
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/shortUrls", {
	useNewUrlParser: true
});

// Create a database entry
app.get("/new/:urlToShorten(*)", (req, res, next) => {
	let { urlToShorten } = req.params;
	let expression = /[-a-zA-Z0-9@:%\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%\+.~#?&//=]*)?/gi;
	let regex = expression;

	if (regex.test(urlToShorten) === true) {
		let short = Math.floor(Math.random() * 100000).toString();

		let data = new shortUrl({
			originalUrl: urlToShorten,
			shorterUrl: short
		});

		data.save(err => {
			if (err) return res.send("Error saving to database");
			return res.json(data);
		});
		data = new shortUrl({
			originalUrl: `${urlToShorten} doesn't match the format`,
			shorterUrl: "Invalid URL"
		});
		return res.json({ urlToShorten });
	} else {
		return res.json({ urlToShorten: "Failed" });
	}
});

// Query database and forward to original URL
app.get("/:urlToForward", (req, res, next) => {
	let shorterUrl = req.params.urlToForward;
	shortUrl.findOne({ shorterUrl: shorterUrl }, (err, data) => {
		if (err) return res.send("Error reading database");
		let re = new RegExp("^(http|https)://", "i");
		let strToCheck = data.originalUrl;
		if (re.test(strToCheck)) {
			res.redirect(301, data.originalUrl);
		} else {
			res.redirect(301, "http://" + data.originalUrl);
		}
	});
});

app.listen(process.env.PORT || 3000, () => console.log("It works"));
