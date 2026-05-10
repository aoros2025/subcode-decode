export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { SubcodeDecode, DecodeFormatter } from '../../../lib/subcodeDecode.js';

export async function GET() {
  try {
    const decoder = new SubcodeDecode();
    const patterns = await decoder.getPatterns();
    return NextResponse.json(DecodeFormatter.patternsToApiResponse(patterns));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
