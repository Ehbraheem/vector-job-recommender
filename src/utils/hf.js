import "./env.js";
import { env } from "node:process";
import { InferenceClient } from "@huggingface/inference";

const { HF_TOKEN } = env;

const hf = new InferenceClient(HF_TOKEN);

// generate embeddings
export async function generateEmbeddings(texts) {
  const results = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L12-v2",
    inputs: texts,
  });

  return results;
}

export async function classifyText(text, labels) {
  const response = await hf.zeroShotClassification({
    model: "facebook/bart-large-mnli",
    inputs: text,
    parameters: {
      candidate_labels: labels,
    },
  });

  console.log("Classification response: ", response);

  return response;
}

export async function extractFilterCriteria(query) {
  const criteria = {
    location: null,
    jobTitle: null,
    jobType: null,
    company: null,
  };

  const labels = ["location", "job title", "company", "job type"];
  const words = query.split(" ");

  for (const word of words) {
    const result = await classifyText(word, labels);
    console.log("result", result);
    const highestScoreLabel = result[0].label;
    const score = result[0].score;

    if (score > 0.5) {
      switch (highestScoreLabel) {
        case "location":
          criteria.location = word;
          break;
        case "job title":
          criteria.jobTitle = word;
          break;
        case "company":
          criteria.company = word;
          break;
        case "job type":
          criteria.jobType = word;
          break;
        default:
          break;
      }
    }
  }

  console.log("Extracted Filter Criteria:", criteria);
  return criteria;
}
