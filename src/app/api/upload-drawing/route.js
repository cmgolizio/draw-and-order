import { createClient } from "@supabase/supabase-js";

export async function POST(req) {
  try {
    const body = await req.formData();
    const file = body.get("file");
    const userId = body.get("userId");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const filePath = `${userId}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("drawings")
      .upload(filePath, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("drawings").getPublicUrl(filePath);

    return Response.json({ success: true, publicUrl });
  } catch (err) {
    console.error(err);
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
