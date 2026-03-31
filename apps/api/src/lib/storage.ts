import * as Minio from "minio";
import { config } from "../config.js";

export const storage = new Minio.Client({
  endPoint: config.MINIO_ENDPOINT,
  port: config.MINIO_PORT,
  useSSL: config.NODE_ENV === "production",
  accessKey: config.MINIO_ROOT_USER,
  secretKey: config.MINIO_ROOT_PASSWORD,
});

export async function ensureBucketExists(): Promise<void> {
  const exists = await storage.bucketExists(config.MINIO_BUCKET);
  if (!exists) {
    await storage.makeBucket(config.MINIO_BUCKET, "us-east-1");
    console.log(`[MinIO] bucket "${config.MINIO_BUCKET}" created`);
  }
}

export async function uploadFile(
  objectName: string,
  stream: Buffer | NodeJS.ReadableStream,
  size: number,
  contentType: string,
): Promise<string> {
  await storage.putObject(config.MINIO_BUCKET, objectName, stream, size, {
    "Content-Type": contentType,
  });
  return `/${config.MINIO_BUCKET}/${objectName}`;
}
