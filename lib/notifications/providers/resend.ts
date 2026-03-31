import { Resend } from "resend";

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  
  console.log("[Resend] API Key exists:", !!apiKey);
  console.log("[Resend] From email:", fromEmail);
  
  if (!apiKey) {
    console.error("[Resend] API key missing!");
    return { skipped: true, provider: "resend", error: "API key not configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });
    
    console.log("[Resend] Email sent successfully:", result);
    return { skipped: false, provider: "resend", result };
  } catch (error) {
    console.error("[Resend] Failed to send email:", error);
    return { 
      skipped: false, 
      provider: "resend", 
      error: (error as Error).message,
      result: null 
    };
  }
}

// Backward compatibility alias
export const sendEmailReminder = sendEmail;
