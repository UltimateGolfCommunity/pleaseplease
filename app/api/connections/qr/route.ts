import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, qrData } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    // Validate QR data if provided
    if (qrData) {
      try {
        const parsedData = JSON.parse(qrData);
        if (parsedData.type !== 'golf_connection' || parsedData.userId !== targetUserId) {
          return NextResponse.json({ error: 'Invalid QR code data' }, { status: 400 });
        }
      } catch (err) {
        return NextResponse.json({ error: 'Invalid QR code format' }, { status: 400 });
      }
    }

    // Check if users are the same
    if (user.id === targetUserId) {
      return NextResponse.json({ error: 'Cannot connect to yourself' }, { status: 400 });
    }

    // Check if connection already exists
    const { data: existingConnection, error: checkError } = await supabase
      .from('user_connections')
      .select('*')
      .or(`requester_id.eq.${user.id},requester_id.eq.${targetUserId}`)
      .or(`receiver_id.eq.${user.id},receiver_id.eq.${targetUserId}`)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing connection:', checkError);
      return NextResponse.json({ error: 'Failed to check existing connection' }, { status: 500 });
    }

    if (existingConnection) {
      if (existingConnection.status === 'accepted') {
        return NextResponse.json({ error: 'Users are already connected' }, { status: 409 });
      } else if (existingConnection.status === 'pending') {
        return NextResponse.json({ error: 'Connection request already pending' }, { status: 409 });
      }
    }

    // Create connection request
    const { data: connection, error: createError } = await supabase
      .from('user_connections')
      .insert({
        requester_id: user.id,
        receiver_id: targetUserId,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating connection:', createError);
      return NextResponse.json({ error: 'Failed to create connection request' }, { status: 500 });
    }

    // Create notification for the receiver
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: targetUserId,
        type: 'connection_request',
        title: 'New Connection Request',
        message: 'Someone wants to connect with you',
        data: {
          connection_id: connection.id,
          requester_id: user.id
        },
        created_at: new Date().toISOString()
      });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({ 
      success: true, 
      connection,
      message: 'Connection request sent successfully' 
    });

  } catch (error) {
    console.error('QR connection request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
