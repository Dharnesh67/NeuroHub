import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { PullCommits, processAndSaveCommits } from '@/lib/github';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get unprocessed commits
    const unprocessedCommits = await PullCommits(projectId);
    
    // Get saved commits from database
    const savedCommits = await db.commit.findMany({
      where: {
        projectId: projectId,
      },
      orderBy: {
        commitDate: 'desc',
      },
    });

    return NextResponse.json({
      unprocessedCommits,
      savedCommits,
    });
  } catch (error) {
    console.error('Error fetching commits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch commits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const processedCommits = await processAndSaveCommits(projectId);

    return NextResponse.json({
      success: true,
      processedCommits,
    });
  } catch (error) {
    console.error('Error processing commits:', error);
    return NextResponse.json(
      { error: 'Failed to process commits' },
      { status: 500 }
    );
  }
} 