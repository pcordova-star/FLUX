import { NextRequest, NextResponse } from 'next/server';
import 'dotenv/config';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({ status: 'ok' });
  } catch (e: any) {
    console.error('Error in health check:', e);
    return new NextResponse(JSON.stringify({ message: e.message || 'Error interno del servidor' }), { status: 500 });
  }
}
