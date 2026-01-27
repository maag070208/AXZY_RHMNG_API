import AWS from "aws-sdk";
import "multer";

import https from "https";

export class StorageService {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      endpoint: process.env.SUPABASE_S3_ENDPOINT,
      region: process.env.SUPABASE_S3_REGION,
      credentials: {
        accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY || "",
      },
      s3ForcePathStyle: true,
      signatureVersion: "v4",
      httpOptions: {
        agent: new https.Agent({ keepAlive: true }),
      },
    });
  }

  // ---------------------------
  // LIST BUCKETS (debug / admin)
  // ---------------------------
  async listBuckets(): Promise<AWS.S3.Bucket[]> {
    const data = await this.s3.listBuckets().promise();
    return data.Buckets || [];
  }

  // ---------------------------
  // UPLOAD FILE (PRIVATE)
  // ---------------------------
  async uploadFile(
    file: Express.Multer.File,
    bucketName: string,
    customKey?: string
  ): Promise<{ bucket: string; key: string }> {
    const key = customKey || `${Date.now()}_${file.originalname}`;

    await this.s3
      .putObject({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      })
      .promise();

    return {
      bucket: bucketName,
      key,
    };
  }

  // ---------------------------
  // SIGNED URL (READ)
  // ---------------------------
  async getSignedReadUrl(
    bucketName: string,
    key: string,
    expiresInSeconds = 900 // 15 min
  ): Promise<string> {
    return this.s3.getSignedUrlPromise("getObject", {
      Bucket: bucketName,
      Key: key,
      Expires: expiresInSeconds,
    });
  }

  // ---------------------------
  // SIGNED URL (UPLOAD DIRECT)
  // ---------------------------
  async getSignedUploadUrl(
    bucketName: string,
    key: string,
    expiresInSeconds = 300 // 5 min
  ): Promise<string> {
    return this.s3.getSignedUrlPromise("putObject", {
      Bucket: bucketName,
      Key: key,
      Expires: expiresInSeconds,
    });
  }

  // ---------------------------
  // DELETE FILE
  // ---------------------------
  async deleteFile(bucketName: string, key: string): Promise<void> {
    await this.s3
      .deleteObject({
        Bucket: bucketName,
        Key: key,
      })
      .promise();
  }
}
