"use strict";

let stats, username;
let sortedHoC, sortedHoF;

function updateTable(sort = {}) {
	// HoC
	let hoc = document.getElementById("hoc");
	hoc.innerHTML = "";
	let counts = 0;
	stats.hoc.map(stat => counts += stat.counts);
	let threads = 0;
	
	if (sort.hocType == undefined && sort.hofType == undefined) {
		if (sortedHoC)
			delete sortedHoC.dataset.sorted;
		stats.hoc.sort((a, b) => a.title > b.title ? 1 : -1); // alphabetical
		stats.hoc.sort((a, b) => a.rank - b.rank); // by rank
		stats.hoc.sort((a, b) => b.counts - a.counts); // by counts
	}
	else if (sort.hocType) {
		switch (sort.hocType) {
			case "title":
				stats.hoc.sort((a, b) => a.title > b.title ? 1 : -1);
				break;
			case "counts":
				stats.hoc.sort((a, b) => a.counts - b.counts);
				break;
			case "personal-percent":
				stats.hoc.sort((a, b) => a.counts/counts - b.counts/counts);
				break;
			case "thread-percent":
				stats.hoc.sort((a, b) => a.counts/a.total - b.counts/b.total);
				break;
			case "rank":
				stats.hoc.sort((a, b) => a.rank - b.rank);
				break;
		}
	}
	if (sort.hocDirection == "down")
		stats.hoc.reverse();
	
	const isRank = document.getElementById("show-rank").checked;
	const isThread = document.getElementById("show-thread-percent").checked;
	const rankStyle = `display: ${isRank ? "table-cell" : "none"}`;
	const threadStyle = `display: ${isThread ? "table-cell" : "none"}`;
	
	for (let stat of stats.hoc) {
		let row = document.createElement("tr");
		const personalPercent = stat.counts / counts * 100;
		const threadPercent = stat.counts / stat.total * 100;
		threads += 1;
		row.innerHTML = "<td>" + 
			stat.title + "</td><td>" + 
			stat.counts.toLocaleString() + "</td><td>" + 
			personalPercent.toFixed(3) + "%</td>" +
			`<td class="thread-percent" style="${threadStyle}">` + threadPercent.toFixed(3) + "%</td>" + 
			`<td class="rank" style="${rankStyle}">` + stat.rank + "</td>";
		hoc.appendChild(row);
	}
	document.getElementById("counts").textContent = "Total counts: " + counts.toLocaleString();
	document.getElementById("threads").textContent = "Total threads: " + threads.toLocaleString();
	
	// HoF
	if (sort.hocType == undefined && sort.hofType == undefined) {
		if (sortedHoF)
			delete sortedHoF.dataset.sorted;
		stats.hof.sort((a, b) => a.title > b.title ? 1 : -1); // alphabetical
		stats.hof.sort((a, b) => b.gets - a.gets); // by gets
		stats.hof.sort((a, b) => (b.gets + b.assists) - (a.gets + a.assists)); // by combined
	}
	else if (sort.hofType) {
		switch (sort.hofType) {
			case "title":
				stats.hof.sort((a, b) => a.title > b.title ? 1 : -1);
				break;
			case "gets":
				stats.hof.sort((a, b) => a.gets - b.gets);
				break;
			case "assists":
				stats.hof.sort((a, b) => a.assists - b.assists);
				break;
			case "combined":
				stats.hof.sort((a, b) => (a.gets + a.assists) - (b.gets + b.assists));
				break;
		}
	}
	if (sort.hofDirection == "down")
		stats.hof.reverse();
	
	let hof = document.getElementById("hof");
	hof.innerHTML = "";
	let gets = 0;
	let assists = 0;
	
	for (let stat of stats.hof) {
		let row = document.createElement("tr");
		gets += stat.gets;
		assists += stat.assists;
		let combined = stat.gets + stat.assists;
		row.innerHTML = "<td>" + 
			stat.title + "</td><td>" + 
			(stat.gets ? stat.gets : " ") + "</td><td>" + 
			(stat.assists ? stat.assists : " ") + "</td><td>" + 
			combined + "</td>"; // only put number in cell if it's not zero
		hof.appendChild(row);
	}
	document.getElementById("gets").textContent = "Total gets: " + gets.toLocaleString();
	document.getElementById("assists").textContent = "Total assists: " + assists.toLocaleString();
	
	if (counts) {
		document.getElementById("none").style.display = "none";
		document.getElementById("stats").style.display = "flex";
	}
	document.getElementById("hoc_title").textContent = "HoC for " + username;
	document.getElementById("hof_title").textContent = "HoF/Ho999 for " + username;
}

function getTables(html) {
	const dom = new DOMParser();
	return dom.parseFromString(html, "text/html").getElementsByTagName("tbody");
}

function sideHoF(hof, title, name) {
	const hofRows = Array.from(hof.rows).reverse(); // search starting from latest get
	let gets = 0;
	let assists = 0;
	
	const getRow = hofRows.findIndex(row => row.cells[1].textContent.toLowerCase() == name.toLowerCase());
	if (getRow > -1) { // gets
		const getCell = hofRows[getRow].cells[2];
		gets = getCell.textContent ? parseInt(getCell.textContent) : 1; // set to 1 if it's empty
	}
	
	const assistRow = hofRows.findIndex(row => row.cells[3].textContent.toLowerCase() == name.toLowerCase());
	if (assistRow > -1) { // assists
		const assistCell = hofRows[assistRow].cells[4];
		assists = assistCell.textContent ? parseInt(assistCell.textContent) : 1;
	}
	
	const stat = stats.hof.findIndex(stat => stat.title == title);
	if (stat > -1) {
		stats.hof[stat].gets += gets;
		stats.hof[stat].assists += assists;
	}
	else if (gets || assists)
		stats.hof.push({"title":title, "gets":gets, "assists":assists});
}

function getHoC(hoc, title, name) {
	const hocRows = Array.from(hoc.rows);
	
	const row = hocRows.findIndex(row => row.cells[1].textContent.toLowerCase() == name.toLowerCase());
	if (row > -1) { // HoC
		const rank = parseInt(hocRows[row].cells[0].textContent);
		const counts = parseInt(hocRows[row].cells[2].textContent);
		let total = 0;
		hocRows.map(r => total += parseInt(r.cells[2].textContent));
		
		if (username.toLowerCase() == name.toLowerCase()) // only for original input, not aliases
			username = hocRows[row].cells[1].textContent; // change to proper capitalization
		
		const stat = stats.hoc.findIndex(stat => stat.title == title);
		if (stat > -1) {
			stats.hoc[stat].counts += counts; // add to existing record if counts already found under another name
			for (let i = row-1; i >= 0 && parseInt(hocRows[i].cells[2].textContent) < stats.hoc[stat].counts; i--) {
				stats.hoc[stat].rank = parseInt(hocRows[i].cells[0].textContent); // adjust rank
			}
		}
		else
			stats.hoc.push({"title":title, "rank":rank, "counts":counts, "total":total});
		
		updateTable();
	}
}

function addThread(tables, title, name) {
	if (tables.length > 1) { // only for sidethreads
		const hof = tables[0];
		sideHoF(hof, title, name);
	}
	
	const hoc = tables[tables.length-1];
	getHoC(hoc, title, name);
}

function loadThread(title, html, aliases) {
	const tables = getTables(html);
	const user = username.toLowerCase();
	
	if (user in aliases) { // check every alias
		for (let name of aliases[user])
			addThread(tables, title, name);
	}
	else
		addThread(tables, title, user);
}

function loadSides(html, aliases) {
	const tables = getTables(html);
	for (let x = 0; x < tables.length; x++) { // there are several tables in the side thread stats page
		const tbody = tables[x];
		for (let y = 0; y < tbody.rows.length; y++) {
			const row = tbody.rows[y];
			const title = row.cells[0].textContent;
			const url = row.cells[0].childNodes[0].getAttribute("href");
			fetch("https://old.reddit.com"+url+".json?raw_json=1", {mode:"cors", cache:"force-cache"}) // load stats page for each thread
				.then(r => r.json())
				.then(json => loadThread(title, json.data.content_html, aliases));
		}
	}
}

function mainHoF(rows, name) {
	const row = rows.findIndex(row => row.cells[1].textContent.toLowerCase() == name.toLowerCase());
	if (row > -1) {
		const gets = parseInt(rows[row].cells[2].textContent);
		const assists = parseInt(rows[row].cells[3].textContent);
		
		const stat = stats.hof.findIndex(stat => stat.title == "Decimal");
		if (stat > -1) {
			stats.hof[stat].gets += gets;
			stats.hof[stat].assists += assists;
		}
		else if (gets || assists)
			stats.hof.push({title:"Decimal", "gets": gets, "assists":assists});
		
		updateTable();
	}
}

function hallOfParticipation(html, aliases) {
	const hof = getTables(html)[0];
	const rows = Array.from(hof.rows);
	const user = username.toLowerCase();
	
	if (user in aliases) {
		for (let name of aliases[user])
			mainHoF(rows, name, stats);
	}
	else
		mainHoF(rows, user, stats);
}

function notFound() {
	if (!document.getElementById("hoc").rows.length)
		document.getElementById("none").style.display = "block";
}

function getAliases(csv) {
	let aliases = {};
	const rows = csv.split("\n");
	for (let y = 0; y < rows.length-1; y++) {
		const names = rows[y].split(",");
		for (let x = 0; x < names.length; x++) {
			const name = names[x].toLowerCase();
			aliases[name] = names;
		}
	}
	return aliases;
}

async function getStats() {
	username = document.getElementById("username").value.replace(/\/?u\/|\s/g, ""); // remove whitespace, /u/
	if (username) {
		stats = {hoc:[], hof:[]};
		updateTable();
		document.getElementById("stats").style.display = "none";
		document.getElementById("none").style.display = "none";
		
		const aliases = await fetch("aliases.csv")
			.then(r => r.text())
			.then(getAliases);
		
		// Main thread HoC
		fetch("https://old.reddit.com/r/counting/wiki/hoc.json?raw_json=1", {mode:"cors", cache:"force-cache"})
			.then(r => r.json())
			.then(json => loadThread("Decimal", json.data.content_html, aliases));
		// Main thread HoF
		fetch("https://old.reddit.com/r/counting/wiki/participation.json?raw_json=1", {mode:"cors", cache:"force-cache"})
			.then(r => r.json())
			.then(json => hallOfParticipation(json.data.content_html, aliases));
		
		// Sidethreads
		fetch("https://old.reddit.com/r/counting/wiki/side_stats.json?raw_json=1", {mode:"cors", cache:"force-cache"})
			.then(r => r.json())
			.then(json => loadSides(json.data.content_html, aliases));
		
		window.setTimeout(notFound, 3000);
	}
}

function clearText() {
	document.getElementById("input").reset();
}

function switchType() {
	if (document.getElementById("show-thread-percent").checked) {
		for (let el of document.getElementsByClassName("thread-percent"))
			el.style.display = "table-cell";
		for (let el of document.getElementsByClassName("rank"))
			el.style.display = "none";
	}
	else {
		for (let el of document.getElementsByClassName("rank"))
			el.style.display = "table-cell";
		for (let el of document.getElementsByClassName("thread-percent"))
			el.style.display = "none";
	}
}

function sortHoC(el) {
	if (sortedHoC != undefined && sortedHoC === el) {
		if (el.dataset.sortDirection == "up")
			el.dataset.sortDirection = "down";
		else
			el.dataset.sortDirection = "up";
	}
	else if (sortedHoC != undefined && sortedHoC !== el)
		delete sortedHoC.dataset.sorted;
	if (el.dataset.sortDirection == undefined)
		el.dataset.sortDirection = "up";
	sortedHoC = el;
	el.dataset.sorted = true;
	
	updateTable({hocType: el.dataset.col, hocDirection: el.dataset.sortDirection});
}

function sortHoF(el) {
	if (sortedHoF)
		delete sortedHoF.dataset.sorted;
	sortedHoF = el;
	el.dataset.sorted = true;
	
	if (el.dataset.sortDirection == "up")
		el.dataset.sortDirection = "down";
	else
		el.dataset.sortDirection = "up";
	updateTable({hofType: el.dataset.col, hofDirection: el.dataset.sortDirection});
}