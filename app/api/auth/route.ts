import { cookies } from 'next/headers';
import { db } from '../../../lib/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('site_auth_user')?.value;
  if (!session) return Response.json({ user: null });
  try {
    return Response.json({ user: JSON.parse(decodeURIComponent(session)) });
  } catch {
    return Response.json({ user: null });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as any;
    const cookieStore = await cookies();

    if (body.action === 'logout') {
      cookieStore.delete('site_auth_user');
      return Response.json({ ok: true });
    }

    if (body.action === 'login') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }

      const ownerEmail = (process.env.WORKSPACE_OWNER_EMAIL || process.env.NEXT_PUBLIC_OWNER_EMAIL || 'owner@example.com').trim().toLowerCase();
      let role = 'client';
      if (email === ownerEmail) {
        role = 'contractor';
      } else {
        const member: any = await db().prepare('SELECT * FROM members WHERE email = ?').bind(email).first();
        if (member) {
          role = member.role;
        } else {
          const workspace: any = await db().prepare('SELECT * FROM workspace WHERE id = ?').bind('main').first();
          if (!workspace) {
            role = 'contractor';
          }
        }
      }

      const user = {
        userId: `usr-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email,
        displayName: body.name || email.split('@')[0],
        role,
      };

      cookieStore.set('site_auth_user', encodeURIComponent(JSON.stringify(user)), {
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: 'lax',
      });

      return Response.json({ ok: true, user });
    }

    return Response.json({ error: 'Invalid auth action.' }, { status: 400 });
  } catch (e: any) {
    return Response.json({ error: e.message || 'Authentication failed' }, { status: 500 });
  }
}
