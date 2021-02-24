const manager = require("./pastPaperManager.js");

(async() => {
	// let res = await manager.getAnswers("Biology", "GCSE", "The table below gives the names and descriptions of processes that take place");
	// let res = await manager.getAnswers("Biology", "GCSE", "A group of students used a weight potometer to investigate the water loss");
	let res = await manager.getAnswers("Biology", "GCSE", "Name the producer in this food web.");
	// let res = await manager.getPastPaper("History", "GCSE", "he element sulfur is found on the Earth’s surface particularly in volcanic region");
	console.log(res);
})();
