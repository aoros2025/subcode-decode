export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { SubcodeDecode, DecodeFormatter } from '../../../lib/subcodeDecode.js';

export async function POST() {
  try {
    const decoder = new SubcodeDecode();
    const portrait = await decoder.generateIdealSelf();
    return NextResponse.json(DecodeFormatter.portraitToApiResponse(portrait));
  } catch (err) {
    const status = err.message.includes('ANTHROPIC_API_KEY') ? 500 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
