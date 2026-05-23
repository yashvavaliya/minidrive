import { NextRequest, NextResponse } from "next/server";
import { getBunnyEmbedUrl, verifyWebhookSignature } from "@/lib/bunny";
import { isVideoStatus } from "@/lib/data-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type BunnyWebhookPayload = {
  VideoGuid?: string;
  videoGuid?: string;
  Guid?: string;
  guid?: string;
  Status?: number | string;
  status?: number | string;
};

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature =
    request.headers.get("bunny-webhook-signature") ??
    request.headers.get("x-bunny-signature") ??
    request.headers.get("x-signature");

  if (!verifyWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const event = JSON.parse(payload) as BunnyWebhookPayload;
  const bunnyVideoId = event.VideoGuid ?? event.videoGuid ?? event.Guid ?? event.guid;
  const rawStatus = event.Status ?? event.status;
  const status = normalizeWebhookStatus(rawStatus);

  if (!bunnyVideoId || !status) {
    return NextResponse.json({ error: "Webhook payload is missing video status" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("videos")
    .update({
      status,
      bunny_embed_url: getBunnyEmbedUrl(bunnyVideoId),
    })
    .eq("bunny_video_id", bunnyVideoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function normalizeWebhookStatus(value: number | string | undefined) {
  if (value === undefined) {
    return null;
  }

  const textValue = String(value).toLowerCase();

  if (isVideoStatus(textValue)) {
    return textValue;
  }

  if (textValue === "4") {
    return "success";
  }

  if (textValue === "5" || textValue === "6") {
    return "failed";
  }

  return "processing";
}
