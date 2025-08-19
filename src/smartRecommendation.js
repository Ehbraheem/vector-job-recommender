import { readFile } from "node:fs/promises";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { flattenJob, localRequire, nativeRequire } from "./utils/utils.js";
import {
  closeMongoDBConnection,
  getCollection,
  performSimilaritySearch,
  storeEmbeddings,
} from "./utils/db.js";
import { extractFilterCriteria } from "./utils/hf.js";

// pdf-parse doesn't work well with ESM modules
const pdf = nativeRequire(import.meta.url)("pdf-parse");

const require = localRequire(import.meta.url);

const jobPostings = require("../data/jobPostings.cjs");

// Extract text from PDF
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await readFile(filePath);
    const data = await pdf(dataBuffer);
    const text = data.text.replace(/\n/g, " ").replace(/ +/g, " ");
    return text;
  } catch (err) {
    console.error("Error extracting text from PDF:", err);
    throw err;
  }
};

// Request PDF path from the CLI
export async function promptUserInput(query) {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question(query);
  rl.close();
  return answer;
}

// Extract Skills from the provided resume PDF
const extractSkills = (text) => {
  const skillsPattern =
    /Skills\b[\s•:–-]*([\s\S]*?)(?=\b(?:Experience|Work Experience|Professional Experience|Projects?|Project Experience|Education|Certifications?|Awards?|Additional Information|Interests?)\b|$)/i;
  const skillsMatch = skillsPattern.exec(text);
  if (skillsMatch) {
    return skillsMatch[1]
      .split(/[^a-zA-Z0-9]+/)
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);
  }
  return [];
};

async function main() {
  const query = "reative Studio";
  try {
    const collection = await getCollection();

    // Store job embedding in the DB
    // await storeEmbeddings(collection, jobPostings);

    // Extract and process the resume PDF
    const filePath = await promptUserInput(
      "Enter the path to the resume PDF: "
    );
    const text = await extractTextFromPDF(filePath);
    const skills = extractSkills(text);
    console.log(skills, text);

    // const filterCriteria = await extractFilterCriteria(skills.join(','));

    const results = await performSimilaritySearch(collection, text);

    results.slice(0, 3).forEach((item, index) => {
      console.log(
        `Top ${index + 1} Recommended Job Title ==> ${
          item.jobTitle
        }, Type ==> ${item.jobType}, Description ==> ${
          item.jobDescription
        }, and Company ==> ${item.company}.`
      );
    });

    return;
  } catch (error) {
    console.error("An error occured: ", error);
  } finally {
    await closeMongoDBConnection();
  }
}

main();
