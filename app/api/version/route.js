export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { SubcodeDecode, DecodeFormatter } from '../../../lib/subcodeDecode.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const decoder = new SubcodeDecode();
    const version = await decoder.synthesizeVersion({
      weekLabel: body.week_label,
      entryIds: body.entry_ids,
    });
    return NextResponse.json(DecodeFormatter.versionToApiResponse(version));
  } catch (err) {
    const status = err.message.includes('ANTHROPIC_API_KEY') ? 500 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
