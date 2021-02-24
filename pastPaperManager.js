const { get, post } = require("chainfetch");
const cheerio = require("cheerio");
const parsePDF = require("pdf-parse");

const subjects = {
	biology: {
		current: {
			view_args: 7,
			view_path: "%2Fnode%2F1820",
		},
		legacy: {
			view_args: 44,
			view_path: "%2Fnode%2F13178",
		},
	},
	history: {
		current: {
			view_args: 528,
			view_path: "%2Fnode%2F2108",
		},
	},
	"science-double-award": {
		current: {
			view_args: 584,
			view_path: "%2Fnode%2F4333",
		},
		legacy: {
			view_args: 585,
			view_path: "%2Fnode%2F10349",
		},
	},
	"science-single-award": {
		current: {

		},
		legacy: {

		},
	},
};


const searchWebsiteForQuestion = async(site, question, current) => {
	let $ = cheerio.load(site);

	let validPapers = $("a.pdf").find("span.file-title").toArray()
		.filter(d => !d.children[0].data.includes("(MV18pt)") && !d.children[0].data.includes("MS"));

	for (let i of validPapers) {
		let paperName = i.children[0].data;
		let pdfURL = i.parent.attribs.href;
		let series = String(i.next.next.next.next.children[0].children[0].data);

		let pdf;
		try {
			pdf = await get(decodeURI(pdfURL));
			console.log(`Searching ${current ? "Current" : "Legacy"} ${series}${paperName}`);
		} catch {
			console.log(`Cannot search ${current ? "Current" : "Legacy"} ${series}${paperName}`);
			continue;
		}

		let parsedPDF = await parsePDF(pdf.raw);

		if (parsedPDF.text.replace(/\n/gm, "").includes(question)) {
			return {
				pdf: pdfURL,
				parsedPDF,
				series,
				paperName,
				current,
			};
		}
		continue;
	}
};

const getMarkScheme = async(paperName, site) => {
	let $ = cheerio.load(site);

	const allMarkSchemes = $("span.MS");
	const thisMarkScheme = allMarkSchemes.find(ms => ms.parent.prev.prev.prev.prev.prev.next.children[0].data === paperName);
	console.log(allMarkSchemes);

	const thisMarkSchemeLink = thisMarkScheme.parent.parent.attribs.href;
	console.log("Mark Scheme identified.");

	let pdf;
	try {
		pdf = await get(thisMarkSchemeLink);
	} catch (e) {
		return "Failed to get mark scheme";
	}

	require("fs").writeFileSync("./ms.pdf", pdf.raw);
	let parsedPDF = await parsePDF(pdf.raw);

	return {
		parsedPDF,
		link: thisMarkSchemeLink,
	};
};

module.exports.getAnswers = async(subject, level, question, pass = 1) => {
	switch (level.toLowerCase()) {
		case "gcse": {
			if (subject === "das") subject = "science-double-award";
			if (subject === "sas") subject = "science-single-award";

			// At first, we search the current spec
			let markSchemesPage = await post(`https://ccea.org.uk/views/ajax?_wrapper_format=drupal_ajax`)
				.setTimeout(10000)
				.attach({
					field_year_target_id_selective: "All",
					field_series_target_id_selective: "All",
					field_past_paper_type_target_id_selective: "19",
					view_name: "past_papers",
					view_display_id: "embed_show_past_papers_on_qual",
					view_args: subjects[subject.toLowerCase()].current.view_args,
					view_path: subjects[subject.toLowerCase()].current.view_path,
					view_base_path: "",
					view_dom_id: "",
					pager_element: 0,
					_drupal_ajax: 1,
				})
				.set({
					Accept: "application/json, text/javascript, */*; q=0.01",
					Origin: "https://ccea.org.uk",
					Referer: `https://ccea.org.uk/key-stage-4/gcse/subjects/gcse-${subject.toLowerCase()}-2017/past-papers-mark-schemes`,
					Cookie: "gdpr_compliance=agreed",
					TE: "Trailers",
				});

			let theOne = await searchWebsiteForQuestion(markSchemesPage.body[4].data, question, true);

			// If it's current spec return what paper it is
			if (!theOne) {
				// Otherwise, time to start over again
				markSchemesPage = await post(`https://ccea.org.uk/views/ajax?_wrapper_format=drupal_ajax`)
					.setTimeout(10000)
					.attach({
						field_year_target_id_selective: "All",
						field_series_target_id_selective: "All",
						field_past_paper_type_target_id_selective: "19",
						view_name: "past_papers",
						view_display_id: "embed_show_past_papers_on_qual",
						view_args: subjects[subject.toLowerCase()].legacy.view_args,
						view_path: subjects[subject.toLowerCase()].legacy.view_path,
						view_base_path: "",
						view_dom_id: "",
						pager_element: 0,
						_drupal_ajax: 1,
					})
					.set({
						Accept: "application/json, text/javascript, */*; q=0.01",
						Origin: "https://ccea.org.uk",
						Referer: `https://ccea.org.uk/key-stage-4/gcse/subjects/gcse-${subject.toLowerCase()}-2017/past-papers-mark-schemes`,
						Cookie: "gdpr_compliance=agreed",
						TE: "Trailers",
					});

				theOne = await searchWebsiteForQuestion(markSchemesPage.body[4].data, question, false);
				if (!theOne && ["biology", "chemistry", "physics"].includes(subject.toLowerCase())) {
					switch (pass) {
						case 1: return this.getAnswers("das", level, question, 2);
						case 2: return this.getAnswers("sas", level, question, 3);
					}
				}
			}

			if (!theOne) return null;
			console.log(theOne.pdf);

			// We know what paper it is, time to get the mark scheme answer.

			const markScheme = await getMarkScheme(theOne.paperName, markSchemesPage.body[4].data);
			console.log(markScheme.link);

			// // We need to find the question number
			// const nearEnoughToPages = theOne.parsedPDF.text.split("Turn over");
			// const thisQuestionPage = nearEnoughToPages.find(p => p.toLowerCase().replace(/\n/gm, "").includes(question.toLowerCase()));
			// const questionsOnPage = thisQuestionPage.split(/\[\d\]/);
			// const thisQuestion = questionsOnPage.find(q => q.toLowerCase().replace(/\n/gm, "").includes(question.toLowerCase()))
			// 	.replace(/ {7}/gm, " ")
			// 	.replace(/_/gm, "");

			// let questionNumber, questionLetter;

			// questionNumber = thisQuestion.match(/\d /g);
			// if (questionNumber) {
			// 	questionNumber = questionNumber[0];
			// } else {
			// 	questionLetter = thisQuestion.match(/\(\w\)/g);
			// 	if (questionLetter) {
			// 		questionLetter = questionLetter[0].replace("(");
			// 	}
			// }

			// console.log(questionNumber);
			// console.log(questionLetter);
			break;
		}
	}
};

