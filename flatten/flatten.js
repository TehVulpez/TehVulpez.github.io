function fixURL(url) {
	if (url.search(/http/) == -1) {
		return "https://"+url;
	}
	return url;
}

function readComments(json) {
	document.getElementById("more").style.display = "inline-block";
	for (comment of json.data) {
		document.getElementById("comments").innerHTML += `
<div class="comment">
	<div class="head flex">
		<span class="subreddit"><a href="https://www.reddit.com/r/${comment.subreddit}">/r/${comment.subreddit}</a></span>
		<span class="author"><a href="https://www.reddit.com/user/${comment.author}">/u/${comment.author}</a></span>
		<time datetime="${comment.utc_datetime_str}Z">${comment.utc_datetime_str}</time>
	</div>
	<a href="https://www.reddit.com/r/${comment.subreddit}/comments/${comment.link_id.slice(3)}/_/${comment.id}?context=7"><div class="body flex">${comment.body}</div></a>
</div>`;
	}
}

function loadMore() {
	const datetime = document.getElementById("comments").lastElementChild.querySelector("time").dateTime;
	const utc = Date.parse(datetime)/1000;
	loadPushshift(utc);
}

function loadNew() {
	document.getElementById("comments").innerHTML = "";
	const utc = Math.floor(Date.now()/1000);
	loadPushshift(utc);
}

function loadPushshift(utc) {
	const link = document.getElementById("link").value.replace(/\s/g, "");
	const limit = document.getElementById("limit").value;
	const author = document.getElementById("author").value.replace(/\/?u\/|\s/g, "");
	const search = document.getElementById("search").value;
	
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
		
		fetch("https://api.pushshift.io/reddit/comment/search?link_id="+id+"&limit="+limit+"&before="+utc+"&author="+author+"&q="+search)
			.then(r => r.json())
			.then(readComments);
	}
}
