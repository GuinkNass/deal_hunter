import { NextRequest, NextResponse } from 'next/server';
import { extractMetadataFromUrl } from '@/lib/ml-radar/scraper';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json({ success: false, error: 'URL inválida' }, { status: 400 });
    }

    const data = await extractMetadataFromUrl(url);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
