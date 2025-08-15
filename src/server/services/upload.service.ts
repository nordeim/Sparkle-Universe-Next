// src/server/services/upload.service.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { db } from '@/lib/db'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

export class UploadService {
  private s3Client: S3Client

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  }

  async getPresignedUploadUrl(params: {
    fileName: string
    fileType: string
    fileSize: number
    uploadType: string
    userId: string
  }) {
    // Validate file type
    const allowedTypes = {
      avatar: ['image/jpeg', 'image/png', 'image/webp'],
      cover: ['image/jpeg', 'image/png', 'image/webp'],
      post: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      comment: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    }

    if (!allowedTypes[params.uploadType]?.includes(params.fileType)) {
      throw new Error('Invalid file type')
    }

    // Generate unique key
    const fileExtension = params.fileName.split('.').pop()
    const key = `${params.uploadType}/${params.userId}/${uuidv4()}.${fileExtension}`

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: params.fileType,
      ContentLength: params.fileSize,
    })

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
    })

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

    // Store file record
    await db.mediaFile.create({
      data: {
        userId: params.userId,
        fileType: params.uploadType,
        fileSize: params.fileSize,
        mimeType: params.fileType,
        originalName: params.fileName,
        storagePath: key,
        cdnUrl: fileUrl,
      },
    })

    return {
      uploadUrl,
      fileUrl,
      key,
    }
  }

  async deleteFile(params: {
    fileUrl: string
    userId: string
  }) {
    // Extract key from URL
    const url = new URL(params.fileUrl)
    const key = url.pathname.substring(1) // Remove leading slash

    // Verify ownership
    const file = await db.mediaFile.findFirst({
      where: {
        storagePath: key,
        userId: params.userId,
      },
    })

    if (!file) {
      throw new Error('File not found or unauthorized')
    }

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    })

    await this.s3Client.send(command)

    // Delete database record
    await db.mediaFile.delete({
      where: { id: file.id },
    })

    return { success: true }
  }

  async optimizeImage(buffer: Buffer, options: {
    width?: number
    height?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  }) {
    return sharp(buffer)
      .resize(options.width, options.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat(options.format || 'webp', {
        quality: options.quality || 80,
      })
      .toBuffer()
  }
}
