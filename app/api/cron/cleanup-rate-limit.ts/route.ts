// api/cron/cleanup-rate-limits.ts
import { NextRequest, NextResponse } from 'next/server';
import { ipRateLimiter, emailRateLimiter } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Verify cron job authorization (use a secret token)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Clean up old rate limit records
    await Promise.all([
      ipRateLimiter.cleanup(),
      emailRateLimiter.cleanup()
    ]);

    console.log('Rate limit cleanup completed');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rate limit cleanup completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' }, 
      { status: 500 }
    );
  }
}
