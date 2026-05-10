export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { SubcodeDecode } from '../../../lib/subcodeDecode.js';

export async function GET() {
  try {
    const decoder = new SubcodeDecode();
    return NextResponse.json(decoder.getMeta());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
