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
	
	if (counts > 0) {
		document.getElementById("none").style.display = "none";
		document.getElementById("stats").style.display = "flex";
	}
}

function getTables(html) {
	const dom = new DOMParser();
	return dom.parseFromString(html, "text/html").getElementsByTagName("tbody");
}

function addThread(username, title, html, stats) {
	const tables = getTables(html);
	
	if (tables.length > 1) { // only for sidethreads
		const hof = tables[0];
		const hofRows = Array.from(hof.rows).reverse(); // search starting from latest get
		let gets = 0;
		let assists = 0;
		let getRow, assistRow;
		
		if ((getRow = hofRows.findIndex(row => row.cells[1].textContent.toLowerCase() == username)) > -1) { // gets
			const getCell = hofRows[getRow].cells[2];
			gets = getCell.textContent ? parseInt(getCell.textContent) : 1; // set to 1 if it's empty
		}
		if ((assistRow = hofRows.findIndex(row => row.cells[3].textContent.toLowerCase() == username)) > -1) { // assists
			const assistCell = hofRows[assistRow].cells[4];
			assists = assistCell.textContent ? parseInt(assistCell.textContent) : 1;
		}
		if (gets || assists)
			stats.hof.push({"title":title, "gets":gets, "assists":assists});
	}
	
	const hoc = tables[tables.length-1]; // get last table on the page
	const hocRows = Array.from(hoc.rows);
	let row;
	
	if ((row = hocRows.findIndex(row => row.cells[1].textContent.toLowerCase() == username)) > -1) { // HoC
		const rank = parseInt(hocRows[row].cells[0].textContent);
		const counts = parseInt(hocRows[row].cells[2].textContent);
		
		stats.hoc.push({"title":title, "rank":rank, "counts":counts});
		updateTable(stats);
	}
}

function loadSides(username, html, stats) {
	const tables = getTables(html);
	for (let x = 0; x < tables.length; x++) { // there are several tables in the side thread stats page
		const tbody = tables[x];
		for (let y = 0; y < tbody.rows.length; y++) {
			const row = tbody.rows[y];
			const title = row.cells[0].textContent;
			const url = row.cells[0].childNodes[0].getAttribute('href');
			fetch("https://old.reddit.com"+url+".json?raw_json=1", {mode:"cors", cache:"force-cache"}) // load stats page for each thread
				.then(r => r.json())
				.then(json => addThread(username, title, json.data.content_html, stats));
		}
	}
}

function mainHoF(username, html, stats) {
	const hof = getTables(html)[0];
	const rows = Array.from(hof.rows);
	let row;
	
	if ((row = rows.findIndex(row => row.cells[1].textContent.toLowerCase() == username)) > -1) {
		const gets = parseInt(rows[row].cells[2].textContent);
		const assists = parseInt(rows[row].cells[3].textContent);
		
		stats.hof.push({title:"Decimal", "gets": gets, "assists":assists});
		updateTable(stats);
	}
}

function notFound(stats) {
	if (!document.getElementById("hoc").rows.length)
		document.getElementById("none").style.display = "block";
}

function getStats() {
	const username = document.getElementById("username").value.replace(/\s/g, ""); // remove whitespace
	if (username) {
		let stats = {hoc:[], hof:[]};
		updateTable(stats);
		document.getElementById("hoc_title").textContent = "HoC for "+username;
		document.getElementById("hof_title").textContent = "HoF/Ho999 for "+username;
		document.getElementById("stats").style.display = "none";
		document.getElementById("none").style.display = "none";
		
		// Main thread HoC
		fetch("https://old.reddit.com/r/counting/wiki/hoc.json?raw_json=1", {mode:"cors", cache:"force-cache"})
			.then(r => r.json())
			.then(json => addThread(username.toLowerCase(), "Decimal", json.data.content_html, stats));
		// Main thread HoF
		fetch("https://old.reddit.com/r/counting/wiki/participation.json?raw_json=1", {mode:"cors", cache:"force-cache"})
			.then(r => r.json())
			.then(json => mainHoF(username.toLowerCase(), json.data.content_html, stats));
		
		// Sidethreads
		fetch("https://old.reddit.com/r/counting/wiki/side_stats.json?raw_json=1", {mode:"cors", cache:"force-cache"})
			.then(r => r.json())
			.then(json => loadSides(username.toLowerCase(), json.data.content_html, stats));
		
		window.setTimeout(notFound, 5000);
	}
}

function clearText() {
	document.getElementById("input").reset();
}
