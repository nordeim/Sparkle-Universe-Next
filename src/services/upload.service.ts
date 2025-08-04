// src/services/upload.service.ts
import { db } from '@/lib/db'
import { redis, redisHelpers } from '@/lib/redis'
import { logger } from '@/lib/monitoring'
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import sharp from 'sharp'
import { createHash } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { eventEmitter } from '@/lib/events/event-emitter'

// Configuration
const S3_BUCKET = process.env.AWS_S3_BUCKET!
const S3_REGION = process.env.AWS_S3_REGION!
const CDN_URL = process.env.CDN_URL!
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

// Image optimization presets
const IMAGE_PRESETS = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 320, height: 320, quality: 85 },
  medium: { width: 640, height: 640, quality: 85 },
  large: { width: 1280, height: 1280, quality: 90 },
  original: { quality: 95 },
}

// Initialize S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export interface UploadOptions {
  userId: string
  file: Buffer | Uint8Array
  filename: string
  mimeType: string
  category?: 'avatar' | 'post' | 'message' | 'document' | 'video'
  isPublic?: boolean
  metadata?: Record<string, any>
}

export interface UploadResult {
  id: string
  url: string
  cdnUrl: string
  thumbnailUrl?: string
  fileSize: number
  mimeType: string
  dimensions?: { width: number; height: number }
  duration?: number
  blurhash?: string
  variants?: Record<string, string>
}

export interface UploadProgress {
  uploadId: string
  progress: number
  status: 'preparing' | 'uploading' | 'processing' | 'completed' | 'failed'
  error?: string
}

export class UploadService {
  // Track upload progress
  private static uploadProgress = new Map<string, UploadProgress>()

  // Main upload method
  static async uploadFile(options: UploadOptions): Promise<UploadResult> {
    const uploadId = uuidv4()
    logger.info('Starting file upload', { uploadId, userId: options.userId, filename: options.filename })

    try {
      // Update progress
      this.updateProgress(uploadId, { 
        uploadId, 
        progress: 0, 
        status: 'preparing' 
      })

      // Validate file
      await this.validateFile(options)

      // Generate file hash for deduplication
      const fileHash = this.generateFileHash(options.file)
      
      // Check if file already exists
      const existingFile = await this.checkExistingFile(fileHash, options.userId)
      if (existingFile) {
        logger.info('File already exists, returning existing', { fileHash })
        return this.formatUploadResult(existingFile)
      }

      // Process file based on type
      let result: UploadResult
      
      if (ALLOWED_IMAGE_TYPES.includes(options.mimeType)) {
        result = await this.processImageUpload(options, uploadId)
      } else if (ALLOWED_VIDEO_TYPES.includes(options.mimeType)) {
        result = await this.processVideoUpload(options, uploadId)
      } else {
        result = await this.processDocumentUpload(options, uploadId)
      }

      // Save to database
      await this.saveFileRecord(result, options, fileHash)

      // Update progress
      this.updateProgress(uploadId, { 
        uploadId, 
        progress: 100, 
        status: 'completed' 
      })

      // Emit upload complete event
      eventEmitter.emit('file:uploaded', { 
        userId: options.userId, 
        fileId: result.id,
        fileType: options.category,
      })

      logger.info('File upload completed', { uploadId, fileId: result.id })
      return result

    } catch (error) {
      logger.error('File upload failed', error, { uploadId })
      
      this.updateProgress(uploadId, { 
        uploadId, 
        progress: 0, 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Upload failed',
      })

      throw error
    } finally {
      // Clean up progress after delay
      setTimeout(() => {
        this.uploadProgress.delete(uploadId)
      }, 60000) // Keep for 1 minute
    }
  }

  // Process image upload with optimization
  private static async processImageUpload(
    options: UploadOptions,
    uploadId: string
  ): Promise<UploadResult> {
    const image = sharp(options.file)
    const metadata = await image.metadata()
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image file')
    }

    const fileId = uuidv4()
    const baseKey = `${options.category || 'general'}/${options.userId}/${fileId}`
    const variants: Record<string, string> = {}

    // Generate blurhash for placeholder
    const blurhash = await this.generateBlurhash(options.file)

    // Upload original
    const originalKey = `${baseKey}/original.${metadata.format}`
    await this.uploadToS3(originalKey, options.file, options.mimeType)
    
    this.updateProgress(uploadId, { 
      uploadId, 
      progress: 30, 
      status: 'uploading' 
    })

    // Process and upload variants
    let processedCount = 0
    const totalVariants = Object.keys(IMAGE_PRESETS).length - 1 // Exclude original

    for (const [preset, config] of Object.entries(IMAGE_PRESETS)) {
      if (preset === 'original') continue

      try {
        const processedBuffer = await sharp(options.file)
          .resize(config.width, config.height, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality: config.quality, progressive: true })
          .toBuffer()

        const variantKey = `${baseKey}/${preset}.jpg`
        await this.uploadToS3(variantKey, processedBuffer, 'image/jpeg')
        variants[preset] = `${CDN_URL}/${variantKey}`

        processedCount++
        const progress = 30 + (processedCount / totalVariants * 60)
        this.updateProgress(uploadId, { 
          uploadId, 
          progress, 
          status: 'processing' 
        })

      } catch (error) {
        logger.error(`Failed to process ${preset} variant`, error)
      }
    }

    return {
      id: fileId,
      url: `${CDN_URL}/${originalKey}`,
      cdnUrl: `${CDN_URL}/${originalKey}`,
      thumbnailUrl: variants.thumbnail,
      fileSize: options.file.length,
      mimeType: options.mimeType,
      dimensions: { width: metadata.width, height: metadata.height },
      blurhash,
      variants,
    }
  }

  // Process video upload
  private static async processVideoUpload(
    options: UploadOptions,
    uploadId: string
  ): Promise<UploadResult> {
    const fileId = uuidv4()
    const key = `${options.category || 'video'}/${options.userId}/${fileId}/original.mp4`

    // Upload video
    await this.uploadToS3(key, options.file, options.mimeType)

    this.updateProgress(uploadId, { 
      uploadId, 
      progress: 80, 
      status: 'processing' 
    })

    // Generate thumbnail (would use ffmpeg in production)
    // For now, we'll use a placeholder
    const thumbnailUrl = `${CDN_URL}/video-thumbnail-placeholder.jpg`

    return {
      id: fileId,
      url: `${CDN_URL}/${key}`,
      cdnUrl: `${CDN_URL}/${key}`,
      thumbnailUrl,
      fileSize: options.file.length,
      mimeType: options.mimeType,
      duration: 0, // Would extract from video metadata
    }
  }

  // Process document upload
  private static async processDocumentUpload(
    options: UploadOptions,
    uploadId: string
  ): Promise<UploadResult> {
    const fileId = uuidv4()
    const extension = this.getFileExtension(options.filename)
    const key = `${options.category || 'document'}/${options.userId}/${fileId}/original.${extension}`

    // Upload document
    await this.uploadToS3(key, options.file, options.mimeType)

    this.updateProgress(uploadId, { 
      uploadId, 
      progress: 90, 
      status: 'processing' 
    })

    return {
      id: fileId,
      url: `${CDN_URL}/${key}`,
      cdnUrl: `${CDN_URL}/${key}`,
      fileSize: options.file.length,
      mimeType: options.mimeType,
    }
  }

  // Upload to S3
  private static async uploadToS3(
    key: string,
    buffer: Buffer | Uint8Array,
    contentType: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 year
    })

    await s3Client.send(command)
  }

  // Generate presigned upload URL for direct client uploads
  static async generatePresignedUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
    fileSize: number
  ): Promise<{ uploadUrl: string; fileId: string; key: string }> {
    // Validate
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    if (!this.isAllowedFileType(contentType)) {
      throw new Error('File type not allowed')
    }

    const fileId = uuidv4()
    const extension = this.getFileExtension(filename)
    const key = `uploads/${userId}/${fileId}/original.${extension}`

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour

    return { uploadUrl, fileId, key }
  }

  // Delete file
  static async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await db.mediaFile.findFirst({
      where: { id: fileId, userId },
    })

    if (!file) {
      throw new Error('File not found')
    }

    // Delete from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: file.storagePath,
    })

    await s3Client.send(deleteCommand)

    // Delete from database
    await db.mediaFile.delete({ where: { id: fileId } })

    // Clear cache
    await redis.del(`file:${fileId}`)

    logger.info('File deleted', { fileId, userId })
  }

  // Validate file
  private static async validateFile(options: UploadOptions): Promise<void> {
    // Check file size
    if (options.file.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
    }

    // Check file type
    if (!this.isAllowedFileType(options.mimeType)) {
      throw new Error('File type not allowed')
    }

    // Virus scan placeholder
    // In production, integrate with ClamAV or similar
    await this.scanForViruses(options.file)
  }

  // Check if file type is allowed
  private static isAllowedFileType(mimeType: string): boolean {
    return [
      ...ALLOWED_IMAGE_TYPES,
      ...ALLOWED_VIDEO_TYPES,
      ...ALLOWED_DOCUMENT_TYPES,
    ].includes(mimeType)
  }

  // Generate file hash
  private static generateFileHash(buffer: Buffer | Uint8Array): string {
    return createHash('sha256').update(buffer).digest('hex')
  }

  // Check for existing file
  private static async checkExistingFile(hash: string, userId: string) {
    // Check cache first
    const cached = await redisHelpers.getJSON(`file:hash:${hash}`)
    if (cached) return cached

    // Check database
    return db.mediaFile.findFirst({
      where: { 
        metadata: { 
          path: ['hash'], 
          equals: hash 
        },
      },
    })
  }

  // Generate blurhash
  private static async generateBlurhash(buffer: Buffer): Promise<string> {
    // In production, use blurhash library
    // For now, return placeholder
    return 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'
  }

  // Get file extension
  private static getFileExtension(filename: string): string {
    const parts = filename.split('.')
    return parts[parts.length - 1].toLowerCase()
  }

  // Save file record to database
  private static async saveFileRecord(
    result: UploadResult,
    options: UploadOptions,
    hash: string
  ): Promise<void> {
    await db.mediaFile.create({
      data: {
        id: result.id,
        userId: options.userId,
        fileType: this.getFileType(options.mimeType),
        fileSize: BigInt(result.fileSize),
        mimeType: options.mimeType,
        originalName: options.filename,
        storagePath: result.url.replace(CDN_URL + '/', ''),
        cdnUrl: result.cdnUrl,
        thumbnailUrl: result.thumbnailUrl,
        blurhash: result.blurhash,
        dimensions: result.dimensions,
        duration: result.duration,
        metadata: {
          hash,
          variants: result.variants,
          ...options.metadata,
        },
        isPublic: options.isPublic ?? true,
        processedAt: new Date(),
      },
    })

    // Cache file info
    await redisHelpers.setJSON(`file:${result.id}`, result, 3600)
    await redisHelpers.setJSON(`file:hash:${hash}`, result, 3600)
  }

  // Get file type category
  private static getFileType(mimeType: string): string {
    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return 'image'
    if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return 'video'
    if (ALLOWED_DOCUMENT_TYPES.includes(mimeType)) return 'document'
    return 'other'
  }

  // Scan for viruses (placeholder)
  private static async scanForViruses(buffer: Buffer | Uint8Array): Promise<void> {
    // In production, integrate with ClamAV or similar
    // For now, just log
    logger.debug('Virus scan placeholder - would scan file in production')
  }

  // Update upload progress
  private static updateProgress(uploadId: string, progress: UploadProgress): void {
    this.uploadProgress.set(uploadId, progress)
    
    // Emit progress event
    eventEmitter.emit('upload:progress', progress)
  }

  // Get upload progress
  static getUploadProgress(uploadId: string): UploadProgress | null {
    return this.uploadProgress.get(uploadId) || null
  }

  // Format upload result from database record
  private static formatUploadResult(file: any): UploadResult {
    return {
      id: file.id,
      url: file.cdnUrl || `${CDN_URL}/${file.storagePath}`,
      cdnUrl: file.cdnUrl || `${CDN_URL}/${file.storagePath}`,
      thumbnailUrl: file.thumbnailUrl,
      fileSize: Number(file.fileSize),
      mimeType: file.mimeType,
      dimensions: file.dimensions as any,
      duration: file.duration,
      blurhash: file.blurhash,
      variants: file.metadata?.variants,
    }
  }

  // Get file by ID
  static async getFile(fileId: string): Promise<UploadResult | null> {
    // Check cache
    const cached = await redisHelpers.getJSON<UploadResult>(`file:${fileId}`)
    if (cached) return cached

    // Get from database
    const file = await db.mediaFile.findUnique({
      where: { id: fileId },
    })

    if (!file) return null

    const result = this.formatUploadResult(file)
    
    // Cache for future requests
    await redisHelpers.setJSON(`file:${fileId}`, result, 3600)
    
    return result
  }
}
