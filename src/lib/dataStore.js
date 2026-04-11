import { readFile } from "fs/promises";
import path from "path";

const cache = new Map();

async function loadJsonFile(filename) {
  const absPath = path.join(process.cwd(), "data", filename);
  const raw = await readFile(absPath, "utf8");
  return JSON.parse(raw);
}

export async function getDataset(filename, logger) {
  if (!cache.has(filename)) {
    logger?.(`Loading dataset: data/${filename}`, {
      source: "dataset",
      dataset: filename,
      cache: "miss",
    });
    cache.set(filename, loadJsonFile(filename));
  } else {
    logger?.(`Using cached dataset: data/${filename}`, {
      source: "dataset",
      dataset: filename,
      cache: "hit",
    });
  }

  return cache.get(filename);
}
