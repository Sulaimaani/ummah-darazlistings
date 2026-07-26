import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs/promises";
import path from "path";

const spacesKey = process.env.SPACES_KEY || "";
const spacesSecret = process.env.SPACES_SECRET || "";
const spacesBucket = process.env.SPACES_BUCKET || "ummah-daraz-assets";
const spacesEndpoint = process.env.SPACES_ENDPOINT || "https://sgp1.digitaloceanspaces.com";

const isConfigured = Boolean(spacesKey && spacesSecret);

let s3Client: S3Client | null = null;

if (isConfigured) {
  s3Client = new S3Client({
    endpoint: spacesEndpoint,
    region: "us-east-1", // Standard required region placeholder for DigitalOcean Spaces
    credentials: {
      accessKeyId: spacesKey,
      secretAccessKey: spacesSecret,
    },
  });
}

export async function uploadImageBuffer(
  buffer: Buffer,
  filename: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  const fileKey = `gallery/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  if (!buffer || buffer.length === 0) {
    throw new Error(`[Storage Error] Cannot upload 0-byte buffer for filename: ${filename}`);
  }

  if (s3Client && isConfigured) {
    try {
      const putResponse = await s3Client.send(
        new PutObjectCommand({
          Bucket: spacesBucket,
          Key: fileKey,
          Body: buffer,
          ContentType: contentType,
          ACL: "public-read",
        })
      );

      console.log(
        `[Storage Success] PutObject S3 response for ${fileKey}: ETag ${putResponse.ETag}, buffer byte length: ${buffer.length}`
      );

      // Generate presigned GET URL valid for 7 days (604800 seconds)
      // This fixes 403 Forbidden / blank preview issues when Spaces buckets are private
      const presignedUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: spacesBucket,
          Key: fileKey,
        }),
        { expiresIn: 604800 }
      );

      return presignedUrl;
    } catch (err) {
      console.error("[Storage Error] DigitalOcean Spaces PutObject upload error:", err);
    }
  }

  // Local storage fallback for dev/testing when Spaces credentials aren't configured
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const localPath = path.join(uploadDir, path.basename(fileKey));
    await fs.writeFile(localPath, buffer);
    console.log(`[Storage Fallback] Saved ${fileKey} locally (${buffer.length} bytes)`);
    return `/uploads/${path.basename(fileKey)}`;
  } catch (localErr) {
    console.error("[Storage Error] Local storage write error:", localErr);
    // Ultimate fallback: data URL
    const base64 = buffer.toString("base64");
    return `data:${contentType};base64,${base64}`;
  }
}

export async function getPresignedUrlIfNeeded(keyOrUrl: string): Promise<string> {
  if (!keyOrUrl) return "";
  if (!s3Client || !isConfigured) return keyOrUrl;

  // Extract key if a raw URL was passed
  try {
    let key = keyOrUrl;
    if (keyOrUrl.includes("digitaloceanspaces.com/")) {
      key = keyOrUrl.split("digitaloceanspaces.com/")[1]?.split("?")[0] || keyOrUrl;
    }

    if (key.startsWith("gallery/")) {
      const presignedUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: spacesBucket,
          Key: key,
        }),
        { expiresIn: 604800 }
      );
      return presignedUrl;
    }
  } catch (e) {
    console.error("Presigned URL generation error:", e);
  }

  return keyOrUrl;
}
