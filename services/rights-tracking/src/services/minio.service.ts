import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly bucketName = 'songs';

  onModuleInit() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      useSSL: false,
      accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
      secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
    });

    this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName);
        // Set policy to download only if needed, but for now we keep it private
        console.log(`Bucket '${this.bucketName}' created.`);
      }
    } catch (err) {
      console.error('Error ensuring bucket exists:', err);
    }
  }

  async uploadFile(filename: string, buffer: Buffer): Promise<string> {
    const objectName = `${Date.now()}-${filename}`;
    await this.minioClient.putObject(this.bucketName, objectName, buffer);
    return objectName;
  }

  async getFileUrl(objectName: string): Promise<string> {
    // Generate a presigned URL valid for 1 hour
    return await this.minioClient.presignedGetObject(this.bucketName, objectName, 3600);
  }
}
