export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { SubcodeDecode } from '../../../lib/subcodeDecode.js';

export async function GET() {
  try {
    const decoder = new SubcodeDecode();
    return NextResponse.json({ entries: decoder.getTimeline() });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
