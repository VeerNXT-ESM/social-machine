import { NextResponse } from 'next/server';
import { deleteMedia } from '@/lib/db/media';
import { notFound, serverError } from '@/lib/db/http';

/** Delete an image unless a post still uses it. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await deleteMedia(id);
    if (result.deleted) return NextResponse.json({ success: true });
    if (result.usedBy > 0) {
      return NextResponse.json(
        { error: `This image is used by ${result.usedBy} post${result.usedBy === 1 ? '' : 's'}. Change those posts first, then delete it.` },
        { status: 409 }
      );
    }
    return notFound('Image');
  } catch (err) {
    return serverError('DELETE /api/media/[id]', err);
  }
}
