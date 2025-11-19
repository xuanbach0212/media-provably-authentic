import * as crypto from "crypto";

export function computeSHA256(data: Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function computePerceptualHash(imageBuffer: Buffer): string {
  // Simplified pHash - in production, use a proper image hashing library
  const hash = crypto.createHash("md5").update(imageBuffer).digest("hex");
  return `phash_${hash.substring(0, 16)}`;
}

export function generateJobId(): string {
  return `job_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
}
