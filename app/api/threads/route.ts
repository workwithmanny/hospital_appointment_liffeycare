import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log('Threads API called for user:', user.id, 'role:', user.role);

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || 50, 1),
    100,
  );

  const supabase = getSupabaseServerClient();

  let query;
  if (user.role === "patient") {
    query = supabase
      .from("conversation_threads")
      .select(`
        *,
        doctor:profiles!conversation_threads_doctor_id_fkey(
          id,
          full_name,
          avatar_url,
          specialty,
          hospital,
          is_online,
          last_seen_at
        ),
        messages:messages(
          id,
          thread_id,
          appointment_context_id,
          body,
          created_at,
          read_at,
          sender_id,
          recipient_id,
          attachments:message_attachments(file_name, file_path, file_size)
        )
      `)
      .eq("patient_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit);
  } else if (user.role === "doctor") {
    query = supabase
      .from("conversation_threads")
      .select(`
        *,
        patient:profiles!conversation_threads_patient_id_fkey(
          id,
          full_name,
          avatar_url,
          age,
          allergies,
          is_online,
          last_seen_at
        ),
        messages:messages(
          id,
          thread_id,
          body,
          created_at,
          read_at,
          sender_id,
          recipient_id,
          appointment_context_id,
          attachments:message_attachments(file_name, file_path, file_size)
        )
      `)
      .eq("doctor_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit);
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: threads, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Sort messages within each thread and calculate unread counts
  const enrichedThreads = (threads ?? []).map(thread => {
    const sortedMessages = (thread.messages || [])
      .sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .map((msg: any) => ({
        ...msg,
        senderId: msg.sender_id,
        recipientId: msg.recipient_id,
        createdAt: msg.created_at,
        readAt: msg.read_at,
        attachments: msg.attachments.map((att: any) => ({
          fileName: att.file_name,
          publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/message-files/${att.file_path}`,
        }))
      }));
    
    const unreadCount = sortedMessages.filter((msg: any) => 
      msg.recipient_id === user.id && !msg.read_at
    ).length;

    return {
      ...thread,
      messages: sortedMessages,
      unreadCount,
      latestMessage: sortedMessages[0] || null
    };
  });

  return NextResponse.json({ 
    threads: enrichedThreads,
    debug: {
      userRole: user.role,
      userId: user.id,
      threadCount: enrichedThreads.length,
      sampleThread: enrichedThreads[0] ? {
        id: enrichedThreads[0].id,
        messageCount: enrichedThreads[0].messages?.length || 0,
        firstMessageSenderId: enrichedThreads[0].messages?.[0]?.senderId,
        firstMessageSenderType: typeof enrichedThreads[0].messages?.[0]?.senderId
      } : null
    }
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { recipientId } = body;

  if (!recipientId) {
    return NextResponse.json(
      { error: "Recipient ID is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServerClient();

  // Determine if this is patient-to-doctor or doctor-to-patient
  let patientId, doctorId;
  if (user.role === "patient") {
    // Verify recipient is a doctor
    const { data: doctor, error: doctorError } = await supabase
      .from("profiles")
      .select("id, role, doctor_approved")
      .eq("id", recipientId)
      .eq("role", "doctor")
      .eq("doctor_approved", true)
      .single();

    if (doctorError || !doctor) {
      return NextResponse.json(
        { error: "Doctor not found or not approved" },
        { status: 404 }
      );
    }
    patientId = user.id;
    doctorId = recipientId;
  } else if (user.role === "doctor") {
    // Verify recipient is a patient
    const { data: patient, error: patientError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", recipientId)
      .eq("role", "patient")
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }
    patientId = recipientId;
    doctorId = user.id;
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check if thread already exists
  const { data: existingThread, error: threadError } = await supabase
    .from("conversation_threads")
    .select("*")
    .eq("patient_id", patientId)
    .eq("doctor_id", doctorId)
    .single();

  if (threadError && threadError.code !== "PGRST116") {
    return NextResponse.json(
      { error: threadError.message },
      { status: 500 }
    );
  }

  if (existingThread) {
    return NextResponse.json({ thread: existingThread });
  }

  // Create new thread
  const { data: newThread, error: createError } = await supabase
    .from("conversation_threads")
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
    })
    .select()
    .single();

  if (createError || !newThread) {
    return NextResponse.json(
      { error: createError?.message || "Failed to create thread" },
      { status: 500 }
    );
  }

  return NextResponse.json({ thread: newThread });
}
