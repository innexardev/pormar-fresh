import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;
  private bucket = 'pomar-fresh';
  private publicBaseUrl = '';

  constructor(private config: ConfigService) {}

  isEnabled(): boolean {
    return Boolean(this.config.get('S3_ENDPOINT'));
  }

  async onModuleInit() {
    if (!this.isEnabled()) {
      this.logger.warn('S3/MinIO desabilitado — configure S3_ENDPOINT para uploads');
      return;
    }

    const endpoint = this.config.get<string>('S3_ENDPOINT')!;
    this.bucket = this.config.get<string>('S3_BUCKET', 'pomar-fresh');
    this.publicBaseUrl = this.config.get<string>('S3_PUBLIC_URL', `${endpoint}/${this.bucket}`);

    this.client = new S3Client({
      endpoint,
      region: this.config.get('S3_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY', 'minioadmin'),
        secretAccessKey: this.config.get<string>('S3_SECRET_KEY', 'minioadmin'),
      },
      forcePathStyle: true,
    });

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (err) {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket ${this.bucket} criado`);
      } catch (createErr) {
        this.logger.warn(`MinIO indisponivel no startup: ${createErr instanceof Error ? createErr.message : createErr}`);
        this.client = null;
        return;
      }
    }

    // Leitura pública é configurada pelo minio-init (mc anonymous set public).
    // PutBucketPolicy aqui alterava o bucket para "custom/download" e quebrava <img> no admin.
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<{ url: string; key: string }> {
    if (!this.client) {
      throw new Error('Storage nao configurado');
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new Error('Tipo de arquivo nao permitido');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Arquivo maximo 5MB');
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `${folder}/${randomUUID()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    const url = `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    return { url, key };
  }
}
