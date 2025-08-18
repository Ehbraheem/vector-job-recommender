import { flattenJob, localRequire } from "./utils/utils.js";
import {
  closeMongoDBConnection,
  getCollection,
  performSimilaritySearch,
} from "./utils/db.js";
import { extractFilterCriteria, generateEmbeddings } from "./utils/hf.js";

const require = localRequire(import.meta.url);

const jobPostings = require("../data/jobPostings.cjs");

async function main() {
  const query = "reative Studio";
  try {
    const collection = await getCollection();
    const jobTexts = jobPostings.map(flattenJob);

    // const embeddingsData = await generateEmbeddings(jobTexts);

    // const jobsWithEmbedding = jobPostings.map((job, index) => ({
    //   ...job,
    //   embedding: embeddingsData[index],
    // }));

    // Write job data to DB
    // await collection.insertMany(jobsWithEmbedding);

    const filterCriteria = await extractFilterCriteria(query);

    const initialResults = await performSimilaritySearch(collection, query);

    initialResults.slice(0, 3).forEach((item, index) => {
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
