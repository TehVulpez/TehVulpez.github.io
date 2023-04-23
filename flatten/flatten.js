function fixURL(url) {
	if (url.search(/http/) == -1) {
		return "https://"+url;
	}
	return url;
}

function readComments(json) {
	document.getElementById("more").style.display = "inline-block";
<<<<<<< HEAD
	const comments = document.getElementById("comments");
	for (const comment of json.data) {
		comments.innerHTML += `
=======
	for (comment of json.data) {
		document.getElementById("comments").innerHTML += `
>>>>>>> 66864b477aadd6d12f6462c75fb03c9ff0d02068
<div class="comment">
	<div class="head flex">
		<span class="subreddit"><a href="https://www.reddit.com/r/${comment.subreddit}">/r/${comment.subreddit}</a></span>
		<span class="author"><a href="https://www.reddit.com/user/${comment.author}">/u/${comment.author}</a></span>
		<time datetime="${comment.utc_datetime_str}Z">${comment.utc_datetime_str}</time>
	</div>
<<<<<<< HEAD
	<a href="https://www.reddit.com${comment.permalink}?context=7"><div class="body flex">${comment.body}</div></a>
=======
	<a href="https://www.reddit.com/r/${comment.subreddit}/comments/${comment.link_id.slice(3)}/_/${comment.id}?context=7"><div class="body flex">${comment.body}</div></a>
>>>>>>> 66864b477aadd6d12f6462c75fb03c9ff0d02068
</div>`;
	}
	document.getElementById("results").textContent = comments.childElementCount + " results";
	document.getElementById("load").textContent = "Load thread";
}

function loadMore() {
	const datetime = document.getElementById("comments").lastElementChild.querySelector("time").dateTime;
	const utc = Date.parse(datetime)/1000;
	loadPushshift(utc);
}

function loadNew() {
	document.getElementById("comments").innerHTML = "";
	document.getElementById("results").textContent = "0 results";
	const utc = Math.floor(Date.now()/1000);
	loadPushshift(utc);
}

function loadPushshift(utc) {
	const link = document.getElementById("link").value.replace(/\s/g, "");
	const limit = document.getElementById("limit").value;
	const author = document.getElementById("author").value.replace(/\/?u\/|\s/g, "");
	const search = document.getElementById("search").value;
	document.getElementById("error").style.display = "none";
	
	if (link) {
		const url = new URL(fixURL(link));
		let id;
		
		if (link.search(/redd\.it/) != -1)
			id = parseInt(url.pathname.split("/")[1], 36);
		else if (link.search(/reddit\.com/) != -1) {
			if (link.search(/\/r\//) != -1)
				id = parseInt(url.pathname.split("/")[4], 36);
			else if (link.search(/comments/) != -1)
				id = parseInt(url.pathname.split("/")[2], 36);
			else
				id = parseInt(url.pathname.split("/")[1], 36);
		}
		else
			id = parseInt(link, 36);
		
		const apiURI = "https://api.pushshift.io/reddit/comment/search?link_id="+id+"&limit="+limit+"&before="+utc+"&author="+author+"&q="+search;
		fetch(apiURI)
			.then(r => r.json(), showError)
			.then(readComments, showError);
		
		let json = {};
		json.link = id.toString(36);
		json.limit = limit;
		if (author)
			json.author = author;
		if (search)
			json.search = search;
		location.hash = "#"+encodeURI(JSON.stringify(json));
		
		const a = document.getElementById("api");
		a.style.display = "inline-block";
		a.href = apiURI;
		
		document.getElementById("load").textContent = "Loading...";
	}
}

function parseFragment() {
	try {
		const fragment = decodeURI(location.hash.slice(1));
		const json = JSON.parse(fragment);
		const input = document.getElementById("input");
		
		if ("link" in json)
			input[0].value = json.link;
		if ("limit" in json)
			input[1].value = json.limit;
		if ("author" in json)
			input[2].value = json.author;
		if ("search" in json)
			input[3].value = json.search;
		
		loadNew();
	}
	catch {
		// nothing
	}
}

function showError(error) {
	const el = document.getElementById("error");
	el.style.display = "inline";
	el.textContent = error.toString();
}