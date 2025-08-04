// src/app/api/admin/jobs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/auth'
import { getQueueStats, jobs } from '@/lib/jobs/job-processor'
import { logger } from '@/lib/monitoring'

export async function GET(request: NextRequest) {
  try {
    // Require admin role
    await requireRole('ADMIN')

    // Get queue statistics
    const stats = await getQueueStats()

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    logger.error('Failed to get job stats', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get job statistics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin role
    await requireRole('ADMIN')

    const body = await request.json()
    const { queue, job, data } = body

    // Validate queue and job exist
    if (!jobs[queue as keyof typeof jobs]) {
      return NextResponse.json(
        { success: false, error: 'Invalid queue' },
        { status: 400 }
      )
    }

    if (!jobs[queue as keyof typeof jobs][job as any]) {
      return NextResponse.json(
        { success: false, error: 'Invalid job type' },
        { status: 400 }
      )
    }

    // Create job
    const jobInstance = await jobs[queue as keyof typeof jobs][job as any](data)

    return NextResponse.json({
      success: true,
      data: {
        jobId: jobInstance.id,
        queue,
        job,
      },
    })
  } catch (error) {
    logger.error('Failed to create job', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
