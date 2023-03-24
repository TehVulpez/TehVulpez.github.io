function fixURL(url) {
	if (url.search(/http/) == -1) {
		return "https://"+url;
	}
	return url;
}

function readComments(json) {
	document.getElementById("more").style.display = "inline-block";
	for (let i = 0; i < json.data.length; i++) {
		document.getElementById("comments").innerHTML += `
<div class="comment">
	<div class="head flex">
		<span class="subreddit"><a href="https://www.reddit.com/r/${json.data[i].subreddit}">/r/${json.data[i].subreddit}</a></span>
		<span class="author"><a href="https://www.reddit.com/user/${json.data[i].author}">/u/${json.data[i].author}</a></span>
		<time datetime="${json.data[i].utc_datetime_str}Z">${json.data[i].utc_datetime_str}</time>
	</div>
	<a href="https://www.reddit.com${json.data[i].permalink}?context=7"><div class="body flex">${json.data[i].body}</div></a>
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
		
		fetch("https://api.pushshift.io/reddit/comment/search?link_id="+id+"&limit="+limit+"&before="+utc)
			.then(r => r.json())
			.then(readComments);
	}
}
