/// <reference lib="deno.ns" />
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async () => {

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase
    .from("event_state")
    .update({ mode: "live" })
    .eq("id", 1);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }

  return new Response("Event is now LIVE.");
});
