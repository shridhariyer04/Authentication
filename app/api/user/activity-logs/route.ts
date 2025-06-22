// app/api/user/activity-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { activityLogs } from '../../../../lib/db/schemas/activitylog';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import {count} from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per page
    const category = searchParams.get('category');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const success = searchParams.get('success');

    // Build query conditions
    const conditions = [eq(activityLogs.userId, session.user.id)];

    if (category) {
      conditions.push(eq(activityLogs.category, category));
    }

    if (action) {
      conditions.push(eq(activityLogs.action, action));
    }

    if (startDate) {
      conditions.push(gte(activityLogs.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(activityLogs.createdAt, new Date(endDate)));
    }

    if (success !== null && success !== undefined) {
      conditions.push(eq(activityLogs.success, success === 'true'));
    }

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(activityLogs)
      .where(and(...conditions));

    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get paginated results
    const logs = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        category: activityLogs.category,
        description: activityLogs.description,
        ipAddress: activityLogs.ipAddress,
        userAgent: activityLogs.userAgent,
        metadata: activityLogs.metadata,
        success: activityLogs.success,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .where(and(...conditions))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

