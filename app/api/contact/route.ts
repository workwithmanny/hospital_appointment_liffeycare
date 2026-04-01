import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role key for this endpoint to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, category = 'general' } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Insert the contact message
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        category,
        is_read: false,
        is_resolved: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting contact message:', error);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }

    // Create notification for admins
    await supabase.from('app_notifications').insert({
      user_id: null, // Will be handled by trigger or admin query
      kind: 'contact_message',
      title: 'New Contact Message',
      body: `${name} sent a message about ${subject}`,
      metadata: {
        contact_message_id: data.id,
        sender_name: name,
        sender_email: email,
        category,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Message sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
