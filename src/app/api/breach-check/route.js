import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

let hashIndex = null;
function getHashIndex() {
  if (hashIndex) return hashIndex;
  const filePath = path.join(process.cwd(), "data", "breach_hashes.json");
  hashIndex = JSON.parse(readFileSync(filePath, "utf8"));
  return hashIndex;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const prefix = String(body.prefix || "").toUpperCase().slice(0, 5);

    if (!prefix || prefix.length !== 5) {
      return NextResponse.json({ error: "prefix must be exactly 5 characters" }, { status: 400 });
    }

    const index = getHashIndex();
    const records = index[prefix] || [];

    // Return matching hash records — client will compare full hash locally
    return NextResponse.json({ prefix, records });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
