import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("suspects").select("*").limit(1);

  if (error) {
    console.error("Supabase test failed:", error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return Response.json({ success: true, data });
}
