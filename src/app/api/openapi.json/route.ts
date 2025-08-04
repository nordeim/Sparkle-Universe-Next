// src/app/api/openapi.json/route.ts
import { NextResponse } from 'next/server'
import { generateOpenAPIDocument } from '@/lib/openapi'

export async function GET() {
  const document = generateOpenAPIDocument()
  return NextResponse.json(document)
}
