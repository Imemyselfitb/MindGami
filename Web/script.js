setTimeout(main, 50);

function main() {
	const host_root = "";

	let UserName;
	const AdminUserName = "MindgamiTeam";
	let isAdmin = false;

	const token = 3673669129;

	let elem = null;
	function setCurrentPageTo(path) {
		if (elem) elem.classList.remove("curpage");
		elem = document.getElementById(path);
		elem.classList.add("curpage");

		if (window.location.hash.startsWith("#forums")) {
			document.body.style.backgroundBlendMode = "multiply";
			document.body.parentNode.style.backgroundBlendMode = "multiply";
		} else {
			document.body.style.backgroundBlendMode = "multiply";
			document.body.parentNode.style.backgroundBlendMode = "multiply";
		}
	}

	let currentlySearching = false;
	function setCurrentPage() {
		if (!currentlySearching) console.log("Changing...");

		const hash = window.location.hash;
		switch (hash) {
			case "#designs":
				setCurrentPageTo("MI_D");
				removeVideo();
				removeForums();
				clearAboutUs();
				if (!currentlySearching) loadDesigns();
				break;
			case "#forums":
				setCurrentPageTo("MI_F");
				removeVideo();
				loadForums(UserName);
				clearAboutUs();
				if (!currentlySearching) removeDesigns();
				break;
			case "#about":
				setCurrentPageTo("MI_A");
				loadAboutUs();
				removeVideo();
				removeForums();
				if (!currentlySearching) removeDesigns();
				break;
			default:
				if (hash.startsWith("#forums?")) {
					removeForums();
					DisplayCurrentThread(UserName);

					setCurrentPageTo("MI_F");
					removeVideo();
					clearAboutUs();
					if (!currentlySearching) removeDesigns();
					return;
				}

				setCurrentPageTo("MI_H");
				loadVideo();
				removeForums();
				clearAboutUs();
				if (!currentlySearching) removeDesigns();
		}

		currentlySearching = false;
	}

	function loadAboutUs() {
		document.getElementById("AboutUs").style.display = `block`
	}
	function clearAboutUs() {
		document.getElementById("AboutUs").style.display = `none`
	}
	async function DisplayCurrentThread() {
		BaseForum();

		const forum = document.getElementById("forum-container");

		const urlParams = new URLSearchParams(window.location.hash.substring(7));
		const ThreadId = urlParams.get("Thread");
		const reposonse = await fetch(`Forum/`, {
			method: "POST",
			body: JSON.stringify({ id: ThreadId }),
			headers: { "Content-Type": "application/json" },
		});

		const data = await reposonse.json();
		if (!data.success) {
			forum.innerHTML += `<center><h2><i>Page Not Found!</i></h2></center>`;
		}

		const title = data.title;
		const contents = data.contents;

		let username;
		let description = contents;
		if (data.wasUserNamed) {
			username = contents.substring(0, contents.indexOf("\n"));
			description = description.substring(contents.indexOf("\n") + 1);
		}
		description = description.replaceAll("\n", "<br>");

		const mainBody = document.createElement("div");
		mainBody.id = "mainBody";
		mainBody.innerHTML = `
			<h1>${title}</h1>
			${username ? `<h2>By <i>${username}</i></h2>` : ""}
			<p>${description}</p>
		`.replaceAll("\n", "");
		forum.appendChild(mainBody);

		showReplies();
		if (UserName) addReplyOption();
	}

	async function showReplies() {
		const replies_container = document.createElement("div");
		replies_container.id = "replies_container";
		document.getElementById("forum-container").appendChild(replies_container);

		const urlParams = new URLSearchParams(window.location.hash.substring(7));
		const ThreadId = urlParams.get("Thread");

		const reponse = await fetch(`GetReplies/`, {
			method: "POST",
			body: JSON.stringify({ id: ThreadId }),
			headers: { "Content-Type": "application/json" },
		});

		const data = await reponse.json();
		if (!data || !data.success)
			return err("Failed to load replies", "replies_container");

		const replies = data.replies;
		console.log(replies);
		for (let i = 0; i < replies.length; i++) {
			const reply = document.createElement("div");
			reply.id = "reply";

			const author = document.createElement("h3");
			author.id = "replyAuthor";
			author.innerHTML = replies[i].author.replaceAll("\n", "</br>");

			const contents = document.createElement("p");
			contents.id = "replyContents";
			contents.innerHTML = replies[i].contents.replaceAll("\n", "</br>");

			if (isAdmin) {
				const deleteReply = document.createElement("img");
				deleteReply.src = "Assets/DeleteIcon.png";
				deleteReply.id = "DeleteReply";
				deleteReply.addEventListener("click", () => DeleteReply(ThreadId, i, replies[i].author));
				replies_container.appendChild(deleteReply);
			}

			reply.appendChild(author);
			reply.appendChild(contents);
			replies_container.appendChild(reply);
		}
	}

	async function DeleteReply(UUID, IDX, AUTHOR) {
		if (!isAdmin || UserName != AdminUserName) { document.location.href = "https://www.reddit.com/user/stophacking/"; return; }
		if (!window.confirm(`Are you sure you want to delete this reply by '${AUTHOR}'?`)) return;

		console.log(UUID, IDX, AUTHOR);

		const reponse = await fetch(`DeleteReply/`, {
			method: "POST",
			body: JSON.stringify({ id: UUID, index: IDX, token }),
			headers: { "Content-Type": "application/json" },
		});

		const data = await reponse.json();
		if (!data.success) { alert("Failed to Delete Thread!"); return console.error(data, data.error); }
		removeForums();
		DisplayCurrentThread();
	}

	let reply_submitting = false;
	async function submitReply() {
		const reply = document.getElementById("replyInput");

		const e = (m) =>
			err(
				"</br><strong style='font-size: 20px;'>" + m + "</strong>",
				"replyInput",
			);

		if (reply.value.length < 2) return e("Reply is too short! ");
		if (reply.value.length > max_reply_chars) return e("Reply is too long! ");

		const urlParams = new URLSearchParams(window.location.hash.substring(7));
		const ThreadId = urlParams.get("Thread");

		if (reply_submitting) return;
		reply_submitting = true;

		const response = await fetch(`AddReply/`, {
			method: "POST",
			body: JSON.stringify({
				id: ThreadId,
				contents: reply.value,
				author: UserName,
			}),
			headers: { "Content-Type": "application/json" },
		});

		const data = await response.json();
		if (!data || !data.success) {
			reply_submitting = false;
			console.error(data.error);
			return e("Failed to Reply!");
		}

		e("Succedded!"); // IT IS NOT AN ERROR!!!!

		setTimeout(() => {
			reply_submitting = false;
			removeForums();
			if (document.location.hash.startsWith("#forums?")) DisplayCurrentThread();
			else loadForums();
		}, 3000);
	}

	function addReplyOption() {
		const forum = document.getElementById("forum-container");

		const reply_section = document.createElement("div");
		reply_section.id = "reply_section";
		forum.appendChild(reply_section);

		const replyBox = document.createElement("div");
		replyBox.id = "replyBox";
		reply_section.appendChild(replyBox);

		const reply_submit = document.createElement("button");
		reply_submit.id = "ReplyBtn";
		reply_submit.innerHTML = "Submit Reply";

		replyBox.appendChild(reply_submit);
		replyBox.innerHTML += `</br></br>`;

		document.getElementById("ReplyBtn").addEventListener("click", submitReply);
		const reply_input = document.createElement("textarea");
		reply_input.id = "replyInput";
		reply_input.style.lineHeight = "20px";
		reply_input.rows = 1;

		const reply_input_info = document.createElement("i");
		reply_input_info.id = "replyInputInfo";
		reply_input_info.appendChild(reply_input);
		reply_input_info.innerHTML += `<span id="MaxReplyChars">Characters: ${0}/${max_reply_chars}</span>`;

		replyBox.appendChild(reply_input_info);

		document.getElementById("replyInput").onkeydown = () => {
			setTimeout((_e) => {
				const ri = document.getElementById("replyInput");
				ri.style.height = "auto";
				const lht = parseInt(ri.style.lineHeight, 10);
				const lines = Math.floor(ri.scrollHeight / lht);

				ri.style.height = lines * lht + "px";
				const mrc = document.getElementById("MaxReplyChars");
				mrc.innerHTML = `Characters: ${ri.value.length}/${max_reply_chars}`;
			}, 50);
		};
	}

	const max_reply_chars = 750;

	function BaseForum() {
		let forum = document.getElementById("forum-container");
		if (forum) return true;
		forum = document.createElement("div");
		forum.id = "forum-container";

		let signups = document.getElementById("signups-container");
		signups = document.createElement("div");
		signups.id = "signups-container";

		forum.appendChild(signups);
		document.getElementById("OmniContainer").appendChild(forum);

		if (!UserName) {
			signups.innerHTML = `
			<button id="signup" onclick="main.SignUp();">Sign Up</button>
			`.replaceAll("\n", "");
		} else {
			loadWelcomeMessage(UserName);
		}
	}

	function removeForums() {
		const elem = document.getElementById("forum-container");
		if (elem) elem.parentNode.removeChild(elem);
	}
	function loadForums() {
		removeForums();
		if (BaseForum()) return;
		let forum = document.getElementById("forum-container");

		const CreateThread = document.createElement("p");
		CreateThread.id = "CreateThread";
		CreateThread.innerHTML = `
		<img src="Assets/Icons/Add.svg" onclick="main.CreateNewThread();" id="E/C NewThread">
		Create Thread!
		`.replaceAll("\n", "");
		forum.appendChild(CreateThread);

		ShowAllThreads();
	}

	async function ShowAllThreadsSub(group, titles) {
		for (let uuid of titles) {
			const reposonse = await fetch(`Forum/`, {
				method: "POST",
				body: JSON.stringify({ id: uuid }),
				headers: { "Content-Type": "application/json" },
			});

			const data = await reposonse.json();
			if (!data.success) continue;

			const contents = data.contents;
			const title = data.title;

			const isUsernamed = data.wasUserNamed;
			let username;
			if (isUsernamed) username = contents.substring(0, contents.indexOf("\n"));

			let description = contents;
			if (isUsernamed)
				description = contents.substring(contents.indexOf("\n") + 1);
			description = description.replaceAll("\n", " ");
			if (description.length > 610) {
				description = description.substring(0, 600) + "...";
			}

			const thread = document.createElement("div");
			thread.id = "thread";
			thread.addEventListener(
				"click",
				() => (document.location.hash = `#forums?Thread=${data.uuid}`),
			);

			const tit = document.createElement("h1");
			tit.id = "title";
			tit.innerText = title;

			let user;
			if (isUsernamed) {
				user = document.createElement("h4");
				user.id = "user";
				user.innerText = username;
			}
			const desc = document.createElement("p");
			desc.id = "description";
			desc.innerText = description.replaceAll("\n", "</br>");

			if (isAdmin) {
				const deleteThread = document.createElement("img");
				deleteThread.src = "Assets/DeleteIcon.png";
				deleteThread.id = "DeleteThread";
				deleteThread.addEventListener("click", () => DeleteThread(uuid, title));
				group.appendChild(deleteThread);
			}

			thread.appendChild(tit);
			if (isUsernamed) thread.appendChild(user);
			thread.appendChild(desc);
			group.appendChild(thread);
		}
		return group;
	}

	const DeleteThread = async (uuid, title) => {
		if (!isAdmin || UserName != AdminUserName) { document.location.href = "https://www.reddit.com/user/stophacking/"; return; }
		if (!window.confirm(`Are you sure you want to delete '${title}'?`)) return;

		const reponse = await fetch(`DeleteThread/`, {
			method: "POST",
			body: JSON.stringify({ id: uuid, token }),
			headers: { "Content-Type": "application/json" },
		});

		const data = await reponse.json();
		if (!data.success) { alert("Failed to Delete Thread!"); return console.error(data.error); }
		removeForums();
		loadForums();
	}

	async function ShowAllThreads() {
		const prevThread = document.getElementById("threads-container");
		if (prevThread) prevThread.parentNode.removeChild(prevThread);

		const AllThreads = document.createElement("div");
		AllThreads.id = "threads-container";

		document.getElementById("forum-container").appendChild(AllThreads);

		try {
			const response = await fetch(`AllForums`);
			const allData = await response.json();
			if (!allData || !allData.success) throw new Error("No data returned");
			ShowAllThreadsSub(AllThreads, allData.threads);
		} catch (e) {
			console.error(e);
			err("Could not load Threads.", "threads-container");
		}
	}

	function reloadNewThreadInfo() {
		const description = document.getElementById("Description");
		const length = description.value.length;

		const mc = document.getElementById("MaxChars");
		mc.innerHTML = `Characters: ${length}/${MAX_CHARS}`;
		if (length > MAX_CHARS) mc.style.color = "red";
		else mc.style.color = "black";
	}

	main.CreateNewThread = () => {
		let form = document.getElementById("CreateThreadForm");

		if (form) {
			if (form.style.display == "none") {
				form.style.display = "block";
				document.getElementById("E/C NewThread").src =
					"Assets/Icons/Sub.svg";
			} else {
				form.style.display = "none";
				document.getElementById("E/C NewThread").src =
					"Assets/Icons/Add.svg";
			}
			return;
		} else {
			document.getElementById("E/C NewThread").src =
				"Assets/Icons/Sub.svg";
		}

		let parent = document.getElementById("CreateThread");
		if (!parent) {
			parent = document.createElement("p");
			parent.id = "CreateThread";
			parent.innerHTML = `
			<img src="Assets/expandSection.png" onclick="CreateNewThread();" id="E/C NewThread">
			Create Thread!
			`.replaceAll("\n", "");
			document.getElementById("forum-container").appendChild(parent);
		}

		form = document.createElement("div");
		form.id = "CreateThreadForm";

		const title = document.createElement("input");
		title.id = "Title";
		title.placeholder = "Title";
		title.type = "text";
		title.required = true;
		form.appendChild(title);
		form.appendChild(document.createElement("br"));

		const Info = document.createElement("p");
		Info.id = "MaxChars";
		Info.innerHTML = `Characters: 0/${MAX_CHARS}`.replaceAll("\n", "");

		const Description = document.createElement("textarea");
		Description.id = "Description";
		Description.placeholder = "Description";
		Description.type = "text";
		Description.style.lineHeight = "20px";
		Description.required = true;
		Description.rows = 1;
		Description.onkeydown = (_e) =>
			setTimeout(() => {
				Description.style.height = "auto";
				const lht = parseInt(Description.style.lineHeight, 10);
				const lines = Math.floor(Description.scrollHeight / lht);

				Description.style.height = lines * lht + "px";
				reloadNewThreadInfo();
			}, 50);
		form.appendChild(Description);
		form.appendChild(Info);

		const submit = document.createElement("div");
		submit.id = "SubmitThread";
		submit.innerHTML = `
		<button onclick="main.submitPost(0);">Submit anonymously</button>
		${
			UserName
				? `<button onclick="main.submitPost(1);">Submit as ${UserName}</button>`
				: ``
		}
		`.replaceAll("\n", "");

		form.appendChild(submit);
		parent.appendChild(form);
	};

	let currentlyPosting = false;
	main.submitPost = (withUsername) => {
		const title = document.getElementById("Title").value;
		const description = document.getElementById("Description").value;
		if (!IsTitleValid() || !IsDescriptionValid()) return;

		if (
			description.replaceAll("\n", "").replaceAll("\t", "").replaceAll(" ", "")
				.length < 2 ||
			title.replaceAll("\n", "").replaceAll("\t", "").replaceAll(" ", "")
				.length < 2
		)
			return err("Description or Title are too Short!", "Description");

		if (currentlyPosting) return;
		currentlyPosting = true;

		fetch(`CreateForum/`, {
			method: "POST",
			body: JSON.stringify({
				title,
				contents: description,
				user: withUsername ? UserName : undefined,
			}),
			headers: { "Content-Type": "application/json" },
		})
			.then((response) => response.json())
			.then((val) => {
				console.log(val)
				if (!val || !val.success) throw new Error(val.error);

				const img = document.createElement("img");
				img.src = "https://i.gifer.com/7efs.gif";
				img.style.opacity = "0.5";
				img.style.height = "100%";
				img.style.justifyContent = "center";
				img.id = "DONE_GIF";
				setTimeout(() => {
					img.parentNode.removeChild(
						document.getElementById("CreateThreadForm"),
					);
					img.parentNode.removeChild(img);
					currentlyPosting = false;

					removeForums();
					if (document.location.hash.startsWith("#forums?"))
						DisplayCurrentThread();
					else loadForums();
				}, 2000);
				document.getElementById("CreateThread").appendChild(img);
			})
			.catch((e) => {
				console.error(e);
				currentlyPosting = false;
			});
	};

	// For Creating a Thread.
	const MAX_CHARS = 5000;
	const MAX_TITLE_CHARS = 60;

	function IsTitleValid() {
		const title = document.getElementById("Title");
		const length = title.value.length;
		if (length <= MAX_TITLE_CHARS) return true;

		err(`Title is Too Long! Maximum Length: ${MAX_TITLE_CHARS}`, "Title");
		return false;
	}

	function IsDescriptionValid() {
		const description = document.getElementById("Description");
		const length = description.value.length;

		if (length <= MAX_CHARS) return true;

		err("Description is Too Long!", "Description");
		return false;
	}

	main.SignUp = () => {
		const elem = document.getElementById("signup");
		const SignUpForm = document.createElement("form");
		SignUpForm.id = "SignUpForm";

		const h1 = document.createElement("h1");
		h1.innerText = "Sign Up";
		SignUpForm.appendChild(h1);

		const Username = document.createElement("input");
		Username.id = "username";
		Username.placeholder = "Username";
		Username.type = "text";
		Username.required = true;
		Username.autocomplete = true;

		const UsernameInfo = document.createElement("span");
		UsernameInfo.id = "UsernameInfo";
		UsernameInfo.innerHTML = "Username: ";
		UsernameInfo.appendChild(Username);
		UsernameInfo.innerHTML += ` ${Min_Username_Length}-${Max_Username_Length}`;

		const Password = document.createElement("input");
		Password.id = "password";
		Password.placeholder = "Password";
		Password.type = "password";
		Password.required = true;
		Password.autocomplete = true;

		const PasswordInfo = document.createElement("span");
		PasswordInfo.id = "PasswordInfo";
		PasswordInfo.innerHTML = "Password: ";
		PasswordInfo.appendChild(Password);
		PasswordInfo.innerHTML += ` ${Min_Password_Length}-${Max_Password_Length}`;

		const Submit = document.createElement("input");
		Submit.value = "Submit";
		Submit.type = "submit";

		SignUpForm.appendChild(UsernameInfo);
		SignUpForm.appendChild(document.createElement("br"));
		SignUpForm.appendChild(PasswordInfo);
		SignUpForm.appendChild(document.createElement("br"));
		SignUpForm.appendChild(Submit);

		SignUpForm.addEventListener("submit", submitSignUpForm);

		elem.parentNode.appendChild(SignUpForm);

		const user = document.getElementById("username");
		user.addEventListener("keyup", (e) => {
			const usi = document.getElementById("UsernameInfo");
			if (user.value.length < Min_Username_Length) usi.style.color = "red";
			else if (user.value.length > Max_Username_Length)
				usi.style.color = "red";
			else usi.style.color = "lightgreen";
		});

		const pd = document.getElementById("password");
		pd.addEventListener("keyup", (e) => {
			const pdi = document.getElementById("PasswordInfo");
			if (pd.value.length < Min_Password_Length) pdi.style.color = "red";
			else if (pd.value.length > Max_Password_Length)
				pdi.style.color = "red";
			else pdi.style.color = "lightgreen";
		});

		elem.parentNode.removeChild(elem);
	};

	const Max_Username_Length = 20;
	const Min_Username_Length = 4;
	const Max_Password_Length = 20;
	const Min_Password_Length = 8;

	function loadWelcomeMessage() {
		const welcome = document.createElement("p");
		welcome.id = "welcome";
		welcome.innerHTML = `Welcome ${UserName}!`;
		const c = document.getElementById("signups-container");
		c.appendChild(welcome);
	}

	function err(msg, childNodeId) {
		const Error = document.createElement("i");
		Error.style.color = "red";
		Error.style.fontSize = "15px";
		Error.style.paddingLeft = "10px";
		Error.innerHTML = msg + " ";
		document.getElementById(childNodeId).parentNode.appendChild(Error);
		setTimeout(() => {
			Error.parentNode.removeChild(Error);
		}, 3000);
		return false;
	}

	async function tryLogin(username, password) {
		const response = await fetch(`IsValid/`, {
			method: "POST",
			body: JSON.stringify({ user: username, pwd: password }),
			headers: { "Content-Type": "application/json" },
		});

		const data = await response.json();

		currentlySubmitting = false;

		if (!data || data.success != true)
			return err("Sign up failed!", "username");
		if (data.response == true) {
			UserName = username;
			loadWelcomeMessage(username);
			const elem = document.getElementById("SignUpForm");
			elem.parentNode.removeChild(elem);
			currentlySubmitting = false;

			isAdmin = (username == AdminUserName);
			if (isAdmin) setCurrentPage();
			else if(document.location.hash.includes("#forums?")) addReplyOption();

			const submit = document.getElementById("SubmitThread");
			if (!submit) return;
			submit.innerHTML = `
			<button onclick="main.submitPost(0);">Submit anonymously</button>
			<button onclick="main.submitPost(1);">Submit as ${UserName}</button>
			`.replaceAll("\n", "");
		} else {
			return err(
				"Username already exists and Password does not Match!",
				"username",
			);
		}
	}

	let currentlySubmitting = false;
	function submitSignUpForm(event) {
		event.preventDefault();

		const username = document.getElementById("username").value;
		const password = document.getElementById("password").value;

		let flags = true;
		if (username.length < Min_Username_Length)
			flags = err("Username is too short!", "username");
		if (username.length > Max_Username_Length)
			flags = err("Username is too long!", "username");
		if (password.length < Min_Password_Length)
			flags = err("Password is too short!", "password");
		if (password.length > Max_Password_Length)
			flags = err("Password is too long!", "password");

		if (username.match(/^[a-zA-Z0-9]+$/) == null)
			flags = err(
				"Username can't contains Spaces or Special Characters!",
				"username",
			);

		if (!flags) return;

		if (currentlySubmitting) return;
		currentlySubmitting = true;

		fetch(`Usernames/`)
			.then((response) => response.json())
			.then((data) => {
				if (data.success)
					if (data.values.includes(username)) {
						return tryLogin(username, password);
					}

				fetch(`SignUp/`, {
					method: "POST",
					body: JSON.stringify({ username, password }),
					headers: { "Content-Type": "application/json" },
				})
					.then((response) => {
						if (!response.ok) throw new Error("Sign up failed!");
						return response.json();
					})
					.then((data) => {
						if (data.success != true) throw new Error("Sign up failed!");

						UserName = data["username"];
						loadWelcomeMessage();

						const elem = document.getElementById("SignUpForm");
						elem.parentNode.removeChild(elem);
						currentlySubmitting = false;

						isAdmin = (username == AdminUserName);
						if (isAdmin) setCurrentPage();
						else if (document.location.hash.includes("#forums?")) addReplyOption();

						const submit = document.getElementById("SubmitThread");
						if (!submit) return;
						submit.innerHTML = `
					<button onclick="main.submitPost(0);">Submit anonymously</button>
					<button onclick="main.submitPost(1);">Submit as ${UserName}</button>
					`.replaceAll("\n", "");
					})
					.catch((e) => {
						console.error(e);
						err("Sorry, Sign up Failed!", "SignUpForm");
					});
			})
			.catch((e) => console.error(e));
	}

	function loadVideo() {
		let elem = document.getElementById("MG_VID");
		if (elem) return;
		elem = document.createElement("div");
		elem.id = "MG_VID";

		elem.innerHTML = `
			<p>The Mindgami Video:</p>
			<video controls>
				<source src="Assets/MindGami.mov" type="video/mp4">
			</video>`.replaceAll("\n", "");

		document.getElementById("OmniContainer").appendChild(elem);
	}
	function removeVideo() {
		const ele = document.getElementById("MG_VID");
		if (ele) ele.parentNode.removeChild(ele);
	}

	async function loadDesigns(internal) {
		let ele = document.getElementById("designs-container");
		if (ele && !internal) return;
		if (ele) ele.parentNode.removeChild(ele);

		const elementExistedBefore = ele != null;

		if (!elementExistedBefore) {
			ele = document.createElement("div");
			ele.id = "designs-container";
			document.getElementById("OmniContainer").appendChild(ele);
		}
		const response = await fetch(`all-designs/${token}`);
		const designs = await response.json();

		for (let uid of designs) {
			const des_response = await fetch(
				`design-html/${uid}`,
			);
			ele.innerHTML += await des_response.text();
		}
		if (currentlySearching) window.location.hash = "#designs";
	}
	async function searchDesigns() {
		let search = document.getElementById("SearchBar").value;
		search = search.trim();
		let ele = document.getElementById("designs-container");
		if (!ele) currentlySearching = true;

		if (search.length < 1) return loadDesigns(true);

		const elementExistedBefore = ele != null;
		if (!elementExistedBefore) {
			currentlySearching = true;
			ele = document.createElement("div");
			ele.id = "designs-container";
		}

		const response = await fetch(
			`search-designs/${search}/${token}`,
		);
		const designs = await response.json();
		let acc_innerHTML = "";
		for (let uid in designs) {
			const des_response = await fetch(
				`design-html/${designs[uid]}/${token}`,
			);
			const htmlTxt = await des_response.text();
			acc_innerHTML += htmlTxt;
		}

		if (acc_innerHTML.length < 1)
			ele.innerHTML = `<center><h2><i syle="color: #AAAAAA;">No Results Found!</i></h2></center>`;
		else ele.innerHTML = acc_innerHTML;

		if (!elementExistedBefore) document.getElementById("OmniContainer").appendChild(ele);
		if (currentlySearching) window.location.hash = "#designs";
	}
	function removeDesigns() {
		const ele = document.getElementById("designs-container");
		if (ele) ele.parentNode.removeChild(ele);
	}

	// Run script
	window.addEventListener("hashchange", setCurrentPage);
	document.getElementById("SearchBar").addEventListener("keyup", (event) => {
		if (event.key == "Enter") return searchDesigns();
	});

	setCurrentPage();
}
