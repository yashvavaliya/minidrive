import crypto from "node:crypto";
import { getEnv } from "@/lib/env";
import type { VideoStatus } from "@/types";

type BunnyVideoResponse = {
  guid?: string;
  status?: number;
};

export async function createVideo(title: string) {
  const libraryId = getEnv("BUNNY_LIBRARY_ID");
  const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    method: "POST",
    headers: {
      AccessKey: getEnv("BUNNY_API_KEY"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error(`Bunny video creation failed: ${await response.text()}`);
  }

  const data = (await response.json()) as BunnyVideoResponse;

  if (!data.guid) {
    throw new Error("Bunny did not return a video id");
  }

  return {
    videoId: data.guid,
    uploadUrl: `https://video.bunnycdn.com/library/${libraryId}/videos/${data.guid}`,
    embedUrl: getBunnyEmbedUrl(data.guid),
  };
}

export async function uploadVideoToBunny(videoId: string, fileBuffer: Buffer) {
  const response = await fetch(
    `https://video.bunnycdn.com/library/${getEnv("BUNNY_LIBRARY_ID")}/videos/${videoId}`,
    {
      method: "PUT",
      headers: {
        AccessKey: getEnv("BUNNY_API_KEY"),
        "Content-Type": "application/octet-stream",
      },
      body: fileBuffer,
    }
  );

  if (!response.ok) {
    throw new Error(`Bunny upload failed: ${await response.text()}`);
  }
}

export async function getVideoStatus(videoId: string): Promise<VideoStatus> {
  const response = await fetch(
    `https://video.bunnycdn.com/library/${getEnv("BUNNY_LIBRARY_ID")}/videos/${videoId}`,
    {
      method: "GET",
      headers: {
        AccessKey: getEnv("BUNNY_API_KEY"),
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Bunny status lookup failed: ${await response.text()}`);
  }

  const data = (await response.json()) as BunnyVideoResponse;
  return mapBunnyStatus(data.status);
}

export function getBunnyEmbedUrl(videoId: string) {
  return `https://iframe.mediadelivery.net/embed/${getEnv("BUNNY_LIBRARY_ID")}/${videoId}`;
}

export function mapBunnyStatus(status: number | undefined): VideoStatus {
  if (status === 4) {
    return "success";
  }

  if (status === 5 || status === 6) {
    return "failed";
  }

  return "processing";
}

export function verifyWebhookSignature(payload: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", getEnv("BUNNY_WEBHOOK_SECRET"))
    .update(payload)
    .digest("hex");

  return timingSafeEqual(signature, expected);
}

function timingSafeEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}
