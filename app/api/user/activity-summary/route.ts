import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { activityLogs } from '../../././../../lib/db/schemas/activitylog';
import { eq, desc, and, gte,isNotNull } from 'drizzle-orm';
import { count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get activity summary
    const summary = await db
      .select({
        category: activityLogs.category,
        action: activityLogs.action,
        success: activityLogs.success,
        count: count(),
      })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.userId, session.user.id),
          gte(activityLogs.createdAt, startDate)
        )
      )
      .groupBy(activityLogs.category, activityLogs.action, activityLogs.success);

    // Get recent failed attempts
    const recentFailures = await db
      .select({
        action: activityLogs.action,
        description: activityLogs.description,
        ipAddress: activityLogs.ipAddress,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.userId, session.user.id),
          eq(activityLogs.success, false),
          gte(activityLogs.createdAt, startDate)
        )
      )
      .orderBy(desc(activityLogs.createdAt))
      .limit(10);

    // Get unique IP addresses
    const uniqueIPs = await db
      .selectDistinct({ ipAddress: activityLogs.ipAddress })
      .from(activityLogs)
      .where(
        and(
          eq(activityLogs.userId, session.user.id),
          gte(activityLogs.createdAt, startDate),
          isNotNull(activityLogs.ipAddress)
        )
      );

    return NextResponse.json({
      summary,
      recentFailures,
      uniqueIPCount: uniqueIPs.length,
      period: `${days} days`,
    });

  } catch (error) {
    console.error('Error fetching activity summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}