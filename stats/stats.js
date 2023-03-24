"use strict";

function updateTable(stats) {
	stats.hoc.sort((a, b) => a.title > b.title ? 1 : -1); // alphabetical
	stats.hoc.sort((a, b) => a.rank - b.rank); // by rank
	stats.hoc.sort((a, b) => b.counts - a.counts); // by counts
	let hoc = document.getElementById("hoc");
	hoc.innerHTML = "";
	let counts = 0;
	let threads = 0;
	for (let i in stats.hoc) {
		let row = document.createElement("tr");
		counts += stats.hoc[i].counts;
		threads += 1;
		row.innerHTML = "<td>" + 
			stats.hoc[i].title + "</td><td>" + 
			stats.hoc[i].counts.toLocaleString() + "</td><td>" + 
			stats.hoc[i].rank + "</td>";
		hoc.appendChild(row);
	}
	document.getElementById("counts").textContent = "Total counts: " + counts.toLocaleString();
	document.getElementById("threads").textContent = "Total threads: " + threads;
	
	stats.hof.sort((a, b) => a.title > b.title ? 1 : -1); // alphabetical
	stats.hof.sort((a, b) => b.gets - a.gets); // by gets
	stats.hof.sort((a, b) => (b.gets + b.assists) - (a.gets + a.assists)); // by combined
	let hof = document.getElementById("hof");
	hof.innerHTML = "";
	let gets = 0;
	let assists = 0;
	for (let i in stats.hof) {
		let row = document.createElement("tr");
		gets += stats.hof[i].gets;
		assists += stats.hof[i].assists;
		let combined = stats.hof[i].gets + stats.hof[i].assists;
		row.innerHTML = "<td>" + 
			stats.hof[i].title + "</td><td>" + 
			(stats.hof[i].gets ? stats.hof[i].gets : " ") + "</td><td>" + 
			(stats.hof[i].assists ? stats.hof[i].assists : " ") + "</td><td>" + 
			combined + "</td>"; // only put number in cell if it's not zero
		hof.appendChild(row);
	}
	document.getElementById("gets").textContent = "Total gets: " + gets.toLocaleString();
	document.getElementById("assists").textContent = "Total assists: " + assists.toLocaleString();
	
	if (counts) {
		document.getElementById("none").style.display = "none";
		document.getElementById("stats").style.display = "flex";
	}
	document.getElementById("hoc_title").textContent = "HoC for " + stats.username;
	document.getElementById("hof_title").textContent = "HoF/Ho999 for " + stats.username;
}

function getTables(html) {
	const dom = new DOMParser();
	return dom.parseFromString(html, "text/html").getElementsByTagName("tbody");
}

function sideHoF(hof, title, name, stats) {
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

function getHoC(hoc, title, name, stats) {
	const hocRows = Array.from(hoc.rows);
	
	const row = hocRows.findIndex(row => row.cells[1].textContent.toLowerCase() == name.toLowerCase());
	if (row > -1) { // HoC
		const rank = parseInt(hocRows[row].cells[0].textContent);
		const counts = parseInt(hocRows[row].cells[2].textContent);
		
		if (stats.username.toLowerCase() == name.toLowerCase()) // only for original input, not aliases
			stats.username = hocRows[row].cells[1].textContent; // change to proper capitalization
		
		const stat = stats.hoc.findIndex(stat => stat.title == title);
		if (stat > -1) {
			stats.hoc[stat].counts += counts; // add to existing record if counts already found under another name
			for (let i = row-1; i >= 0 && parseInt(hocRows[i].cells[2].textContent) < stats.hoc[stat].counts; i--) {
				stats.hoc[stat].rank = parseInt(hocRows[i].cells[0].textContent); // adjust rank
			}
		}
		else
			stats.hoc.push({"title":title, "rank":rank, "counts":counts});
		
		updateTable(stats);
	}
}

function addThread(tables, title, name, stats) {
	if (tables.length > 1) { // only for sidethreads
		const hof = tables[0];
		sideHoF(hof, title, name, stats);
	}
	
	const hoc = tables[tables.length-1];
	getHoC(hoc, title, name, stats);
}

function loadThread(title, html, stats, aliases) {
	const tables = getTables(html);
	const user = stats.username.toLowerCase();
	
	if (user in aliases) { // check every alias
		for (let i in aliases[user]) {
			const name = aliases[user][i];
			addThread(tables, title, name, stats);
		}
	}
	else
		addThread(tables, title, user, stats);
}

function loadSides(html, stats, aliases) {
	const tables = getTables(html);
	for (let x = 0; x < tables.length; x++) { // there are several tables in the side thread stats page
		const tbody = tables[x];
		for (let y = 0; y < tbody.rows.length; y++) {
			const row = tbody.rows[y];
			const title = row.cells[0].textContent;
			const url = row.cells[0].childNodes[0].getAttribute("href");
			fetch("https://old.reddit.com"+url+".json?raw_json=1", {mode:"cors", cache:"force-cache"}) // load stats page for each thread
				.then(r => r.json())
				.then(json => loadThread(title, json.data.content_html, stats, aliases));
		}
	}
}

function mainHoF(rows, name, stats) {
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
		
		updateTable(stats);
	}
}

function hallOfParticipation(html, stats, aliases) {
	const hof = getTables(html)[0];
	const rows = Array.from(hof.rows);
	const user = stats.username.toLowerCase();
	
	if (user in aliases) {
		for (let i in aliases[user]) {
			const name = aliases[user][i];
			mainHoF(rows, name, stats);
		}
	}
	else
		mainHoF(rows, user, stats);
}

function notFound(stats) {
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
	const username = document.getElementById("username").value.replace(/\/?u\/|\s/g, ""); // remove whitespace, /u/
	if (username) {
		let stats = {hoc:[], hof:[], "username":username};
		updateTable(stats);
		document.getElementById("stats").style.display = "none";
		document.getElementById("none").style.display = "none";
		
		const aliases = await fetch("aliases.csv")
			.then(r => r.text())
			.then(getAliases);
		
		// Main thread HoC
		fetch("https://old.reddit.com/r/counting/wiki/hoc.json?raw_json=1", {mode:"cors", cache:"force-cache"})
			.then(r => r.json())
			.then(json => loadThread("Decimal", json.data.content_html, stats, aliases));
		// Main thread HoF
		fetch("https://old.reddit.com/r/counting/wiki/participation.json?raw_json=1", {mode:"cors", cache:"force-cache"})
			.then(r => r.json())
			.then(json => hallOfParticipation(json.data.content_html, stats, aliases));
		
		// Sidethreads
		fetch("https://old.reddit.com/r/counting/wiki/side_stats.json?raw_json=1", {mode:"cors", cache:"force-cache"})
			.then(r => r.json())
			.then(json => loadSides(json.data.content_html, stats, aliases));
		
		window.setTimeout(notFound, 3000);
	}
}

function clearText() {
	document.getElementById("input").reset();
}
