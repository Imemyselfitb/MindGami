const fs = require("fs");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const app = express();

const PORT = '3000';
const host_root_path = `192.168.4.42`;

app.set('port', PORT);
app.set('host', host_root_path);

app.use(express.static("Web"));

const invalidUrl = (req) => `
<html lang="en">
	<head><meta charset="utf-8"><title>Error</title></head>
	<body><pre>Cannot GET ${req.originalUrl}</pre></body>
</html>`;

const token = 3673669129;

// Send Images
app.get("/design-img/:idx/:token", (req, res) => {
	if (req.params.token != token) {
		return res.send(invalidUrl(req));
	}

	const uid = req.params.idx;
	res.sendFile(path.join(__dirname, `/Designs/${uid}/Image.png`));
});

// No Token, its available to the public. So they do not NEED	to download.
app.get("/design-print/:idx", (req, res) => {
	const uid = req.params.idx;
	res.sendFile(path.join(__dirname, `/Designs/${uid}/Print.pdf`));
});

app.get("/design-instructions/:idx", (req, res) => {
	const uid = req.params.idx;
	res.sendFile(path.join(__dirname, `/Designs/${uid}/Instructions.pdf`));
});

app.get("/design-html/:idx/:token", async (req, res) => {
	if (req.params.token != token) {
		return res.send(invalidUrl(req));
	}
	const uid = req.params.idx;
	try {
		const inst = fs.readFileSync(`Designs/${uid}/Info.txt`)

		const category = uid.substring(1, uid.indexOf("]")).toLowerCase();
		res.send(`
	<div class="design ${category}">
		<img src="/design-img/${uid}/${token}">
		<div class="designText">
			<div class="designPDFs">
				<img onclick=" window.location.href='design-print/${uid}'; " src="Assets/Icons/Print.svg" width="40px" id="PrintICO">
				<img onclick=" window.location.href='design-instructions/${uid}'; " src="Assets/Icons/Description.svg" width="40px" id="InstICO">
			</div>
			<h1 class="designTitle">${uid}</h1>
			<p class="designInfo">${inst}</p>
		</div>
	</div>
	`);
	} catch (error) { }

});

app.get("/all-designs/:token", async (req, res) => {
	if (req.params.token != token) {
		return res.send(invalidUrl(req));
	}

	const designs = fs.readdirSync(path.join(__dirname, `/Designs/`));

	res.send(designs);
});

app.get("/search-designs/:search/:token", async (req, res) => {
	if (req.params.token != token) {
		return res.send(invalidUrl(req));
	}

	const designs = fs.readdirSync(path.join(__dirname, `/Designs/`));
	const valid = designs.filter((design) =>
		design.toLowerCase().includes(req.params.search.toLowerCase()),
	);
	res.send(valid);
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/SignUp/", (req, res) => {
	let txt = req.body.username + "\n" + req.body.password + "\n";
	try {
		fs.writeFileSync(`Forums/Details.png`, txt, {
			enconding: "binary",
			flag: "a",
		});
	} catch (err) {
		res.json({ success: false, error: err });
		console.error(err, txt, typeof txt);
		return;
	}
	res.json({ username: req.body.username, success: true });
});

function resetFile(dict) {
	try {
		let txt = JSON.stringify(dict);
		txt = txt.replaceAll(",", "\n").replaceAll(":", "\n");
		txt = txt.replaceAll("{", "").replaceAll("}", "\n");
		txt = txt.replaceAll(`"`, "");
		fs.writeFileSync(`Forums/Details.png`, txt, { enconding: "binary" });
	} catch (err) {
		console.error(err);
	}
}

app.get("/Usernames/", (req, res) => {
	try {
		const str = fs
			.readFileSync(`Forums/Details.png`, { enconding: "binary" })
			.toString();

		let resetFileflag = false;
		const arr = str.split("\n");
		const dict = arr.reduce((acc, cur, i) => {
			if (acc[cur] != undefined) resetFileflag = true;
			if (i % 2 == 0 && i + 1 < arr.length) acc[cur] = arr[i + 1];
			return acc;
		}, {});
		res.json({ success: true, values: Object.keys(dict) });
		if (resetFileflag) resetFile(dict);
	} catch (err) {
		if (err.code == "ENOENT") {
			try {
				fs.writeFileSync(`Forums/Details.png`, "", { enconding: "binary" });
				res.json({ success: true, values: [] });
			} catch (err2) {
				res.json({ success: false, error: err2 });
			}
		}
	}
});

app.post("/IsValid/", (req, res) => {
	try {
		const str = fs
			.readFileSync(`Forums/Details.png`, { enconding: "binary" })
			.toString();

		let resetFileflag = false;
		const arr = str.split("\n");
		const dict = arr.reduce((acc, cur, i) => {
			if (acc[cur] != undefined) resetFileflag = true;
			if (i % 2 == 0 && i + 1 < arr.length) acc[cur] = arr[i + 1];
			return acc;
		}, {});

		res.json({
			success: true,
			response:
				dict[req.body.user] == req.body.pwd && req.body.pwd != undefined
					? true
					: false,
		});
		if (resetFileflag) resetFile(dict);
	} catch (err) {
		if (err.code == "ENOENT") {
			try {
				fs.writeFileSync(`Forums/Details.png`, "", { enconding: "binary" });
				res.json({ success: true, response: false });
			} catch (err2) {
				res.json({ success: false, error: err2 });
			}
		}
	}
});

app.post("/CreateForum/", (req, res) => {
	if (!req.body.title || !req.body.contents)
		return res.json({
			success: false,
			error: "Missing title or contents",
		});

	if (req.body.user != undefined) {
		// Submitted with username.
		try {
			let id = 3523;
			if (fs.existsSync(`Forums/DefinatelyNotAVirus.png`)) {
				const txt = fs
					.readFileSync(`Forums/DefinatelyNotAVirus.png`)
					.toString();
				id += txt.split("\n").length - 1;
			}

			const cont =
				req.body.title + "\n" + req.body.user + "\n" + req.body.contents;
			fs.writeFileSync("Forums/Usernamed/" + id, cont);

			const idInp = `U${id}\n`;
			fs.writeFileSync(`Forums/DefinatelyNotAVirus.png`, idInp, {
				flag: "a",
			});
		} catch (err) {
			res.json({ success: false, error: err });
			return;
		}
		return res.json({ success: true });
	}

	try {
		let id = 3523;
		if (fs.existsSync(`Forums/DefinatelyNotAVirus.png`)) {
			const txt = fs.readFileSync(`Forums/DefinatelyNotAVirus.png`).toString();
			id += txt.split("\n").length - 1;
		}

		const cont = req.body.title + "\n" + req.body.contents;
		fs.writeFileSync("Forums/Anonymous/" + id, cont);

		const idInp = `A${id}\n`;
		fs.writeFileSync(`Forums/DefinatelyNotAVirus.png`, idInp, {
			flag: "a",
		});
	} catch (err) {
		res.json({ success: false, error: err });
		return;
	}

	res.json({ success: true });
});

app.post("/AddReply/", (req, res) => {
	if (!req.body.id || !req.body.contents || !req.body.author)
		return res.json({
			success: false,
			error: "Missing id, author or contents",
		});

	try {
		const c = req.body.author + "\0" + req.body.contents + "\0";
		fs.appendFileSync(`Forums/Replies/${req.body.id}`, c);
		res.json({ success: true });
	} catch (err) {
		res.json({ success: false, error: err });
		return;
	}
});

app.post("/GetReplies/", (req, res) => {
	if (!req.body.id) return res.json({ success: true, error: "Missing id. " });

	if (!fs.existsSync(`Forums/Replies/${req.body.id}`))
		return res.json({ success: true, replies: [] });

	try {
		let data = fs.readFileSync(`Forums/Replies/${req.body.id}`).toString();
		data = data.split("\0");

		// There is a trailing '\0' at the end of the file, so remove it.
		data.pop();

		let outputs = [];
		for (let i = 0; i < data.length; i += 2)
			outputs.push({
				author: data[i],
				contents: data[i + 1],
			});

		return res.json({ success: true, replies: outputs });
	} catch (err) {
		res.json({ success: false, error: err });
		return;
	}
});

app.post("/Forum/", (req, res) => {
	if (!req.body.id)
		return res.json({ success: false, error: "No ID Provided!" });

	const usernamed = req.body.id.toLowerCase().startsWith("u");
	const uuid = req.body.id.substring(1);

	try {
		const cont = fs
			.readFileSync(
				(usernamed ? "Forums/Usernamed/" : "Forums/Anonymous/") + uuid,
			)
			.toString();

		const title = cont.split("\n")[0];
		const contents = cont.substring(cont.indexOf("\n") + 1);
		res.json({
			success: true,
			uuid: req.body.id,
			title,
			contents,
			wasUserNamed: usernamed,
		});
	} catch (err) {
		res.json({ success: false, error: err });
	}
});

app.post("/DeleteThread/", (req, res) => {
	if (req.body.token != token || !req.body.id) {
		return res.json({ success: false, error: "Incorrect Token or Missing UUID!" });
	}

	const isUsernamed = (req.body.id[0].toLowerCase() == "u");
	const uuid = req.body.id.substring(1);
	try {
		fs.unlinkSync(`Forums/${isUsernamed ? "Usernamed" : "Anonymous"}/${uuid}`);
	} catch (error) {
		return res.json({ success: false, error });
	}

	try {
		fs.unlinkSync(`Forums/Replies/${req.body.id}`);
	} catch (error) { }

	res.send({ success: true });
});

app.post("/DeleteReply/", (req, res) => {
	if (req.body.token != token || req.body.id == undefined || req.body.index == undefined) {
		return res.json({ success: false, error: "Incorrect Token or Missing IDX or Missing UUID!" });
	}

	if (typeof req.body.index != 'number' || req.body.index < 0 || !Number.isInteger(req.body.index)) {
		return res.json({ success: false, error: "IDX must be a Positive Integer!" });
	}

	try {
		const contents = fs.readFileSync(`Forums/Replies/${req.body.id}`).toString();
		const replies = contents.split("\0");
		if (req.body.index > replies.length / 2)
			return res.json({ success: false, error: "IDX is not Valid!" });

		let conts = "";
		for (let i = 0; i < replies.length - 1; i++) {
			if (Math.floor(i / 2) != req.body.index) conts += replies[i] + "\0";
		}

		if (conts.replaceAll("\0", "").length > 0) {
			fs.writeFileSync(`Forums/Replies/${req.body.id}`, conts);
		} else {
			fs.unlinkSync(`Forums/Replies/${req.body.id}`);
		}
		res.json({ success: true });
	} catch (error) {
		return res.json({ success: false, error });
	}
});

app.get("/AllForums/", (req, res) => {
	try {
		if (!fs.existsSync("Forums/DefinatelyNotAVirus.png")) {
			return res.json({ success: true, threads: [] });
		}
		const allIds = fs.readFileSync("Forums/DefinatelyNotAVirus.png").toString();
		res.json({
			success: true,
			threads: allIds
				.split("\n")
				.reverse()
				.filter((a) => a != ""),
		});
	} catch (err) {
		res.json({ success: false, error: err });
	}
});

app.listen(app.get('port'), app.get('host'), () => {
	console.log(app.get('port'), app.get('host'));
});
