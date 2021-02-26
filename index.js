const manager = require("./pastPaperManager.js");

(async() => {
	// let res = await manager.getAnswers("Biology", "GCSE", "The table below gives the names and descriptions of processes that take place");
	// let res1 = await manager.getAnswers("Biology", "GCSE", "A group of students used a weight potometer to investigate the water loss");
	// let res2 = await manager.getAnswers("Biology", "GCSE", "Name the producer in this food web.");
	// let res3 = await manager.getAnswers("History", "GCSE", "he element sulfur is found on the Earth’s surface particularly in volcanic region");

	// let chemTest = await manager.getAnswers("Chemistry", "GCSE", "What is observed when magnesium reacts with ethanoic acid?");

	// let res1 = await manager.getAnswers("Biology", "GCSE", "Students used a potometer to investigate how different treatments");
	// let res2 = await manager.getAnswers("Biology", "GCSE", "A group of students used a weight potometer to investigate the water loss");
	let res3 = await manager.getAnswers("Biology", "GCSE", "A student observed that the plants in her bathroom did not");
})();
