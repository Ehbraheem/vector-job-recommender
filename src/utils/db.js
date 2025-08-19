import "./env.js";
import { env } from "node:process";
import { MongoClient } from "mongodb";
import { generateEmbeddings } from "./hf.js";
import { flattenJob } from "./utils.js";

const { MONGO_HOST, MONGO_USER, MONGO_PASS, MONGO_DB, MONGO_COLLECTION } = env;

const uri = `mongodb+srv://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}/?retryWrites=true&w=majority`;

let client;

export async function connectToMongoDB() {
  if (!client) {
    client = new MongoClient(uri);
    try {
      await client.connect();
      console.log("Connected to MongoDB Atlas");
    } catch (err) {
      console.error("Error connecting to MongoDB:", err);
      throw err;
    }
  }
  return client.db(MONGO_DB);
}

export async function closeMongoDBConnection() {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
    client = null;
  }
}

export async function getCollection() {
  const db = await connectToMongoDB();

  return db.collection(MONGO_COLLECTION);
}

export async function storeEmbeddings(collections, jobPostings) {
  try {
    const jobTexts = jobPostings.map(flattenJob);

    const embeddingsData = await generateEmbeddings(jobTexts);

    const jobsWithEmbedding = jobPostings.map((job, index) => ({
      ...job,
      embedding: embeddingsData[index],
    }));

    // Write job data to DB
    await collection.insertMany(jobsWithEmbedding);
    console.log("Stored embeddings in MongoDB.");
  } catch (error) {
    console.error("Error storing embeddings in MongoDB:", error);
    throw error;
  }
}

export async function performSimilaritySearch(collection, queryTerm) {
  try {
    const queryEmbedding = await generateEmbeddings([queryTerm]);

    const jobFields = [
      "jobId",
      "jobTitle",
      "company",
      "location",
      "jobType",
      "salary",
      "jobDescription",
      "jobResponsibilities",
      "preferredQualifications",
      "applicationDeadline",
    ];
    const dbProjectionHelper = jobFields.reduce(
      (accum, curr) => ({ ...accum, [curr]: 1 }),
      Object.create(null)
    );
    const pipeline = [
      //   {
      //     $search: {
      //       knnBeta: {
      //         vector: queryEmbedding[0],
      //         path: "embedding",
      //         k: 3,
      //       },
      //     },
      //   },
      {
        $vectorSearch: {
          index: "job_recommendation_index",
          path: "embedding",
          queryVector: queryEmbedding[0],
          numCandidates: 5,
          limit: 5,
        },
      },
      {
        $project: {
          _id: 0,
          ...dbProjectionHelper,
          score: {
            $meta: "vectorSearchScore",
          },
        },
      },
      {
        $sort: {
          score: 1,
        },
      },
    ];

    // console.log(JSON.stringify(pipeline, null, 2))

    const results = await collection.aggregate(pipeline).toArray();

    if (!results?.length) {
      console.log(`No job post found similar to "${queryTerm}"`);
      return [];
    }

    return results;
  } catch (error) {
    console.error("Error during similarity search:", error);
    return [];
  }
}
