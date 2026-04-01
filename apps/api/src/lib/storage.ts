import * as Minio from "minio";
import type { Readable } from "stream";
import { config } from "../config.js";

export const storage = new Minio.Client({
  endPoint: config.STORAGE_ENDPOINT,
  ...(config.STORAGE_PORT ? { port: config.STORAGE_PORT } : {}),
  useSSL: config.STORAGE_USE_SSL,
  accessKey: config.STORAGE_ACCESS_KEY,
  secretKey: config.STORAGE_SECRET_KEY,
  region: config.STORAGE_REGION,
});

export async function ensureBucketExists(): Promise<void> {
  const exists = await storage.bucketExists(config.STORAGE_BUCKET);
  if (!exists) {
    await storage.makeBucket(config.STORAGE_BUCKET, config.STORAGE_REGION);
    console.log(`[Storage] bucket "${config.STORAGE_BUCKET}" created`);
  }
}

export async function uploadFile(
  objectName: string,
  stream: Buffer | Readable,
  size: number,
  contentType: string,
): Promise<string> {
  await storage.putObject(config.STORAGE_BUCKET, objectName, stream, size, {
    "Content-Type": contentType,
  });
  return `/${config.STORAGE_BUCKET}/${objectName}`;
}
