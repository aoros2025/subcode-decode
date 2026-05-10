export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { SubcodeDecode } from '../../../../lib/subcodeDecode.js';

export async function GET(req, { params }) {
  try {
    const decoder = new SubcodeDecode();
    const entries = decoder.getEntriesByDomain(params.name);
    return NextResponse.json({ entries });
  } catch (err) {
    const status = err.message.includes('must be one of') ? 400 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
