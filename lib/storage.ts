import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
    region: "us-east-1", // Standard required placeholder for Spaces
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

  if (s3Client && isConfigured) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: spacesBucket,
          Key: fileKey,
          Body: buffer,
          ContentType: contentType,
          ACL: "public-read",
        })
      );

      // DigitalOcean Spaces URL format
      const cleanEndpoint = spacesEndpoint.replace(/^https?:\/\//, "");
      return `https://${spacesBucket}.${cleanEndpoint}/${fileKey}`;
    } catch (err) {
      console.error("DigitalOcean Spaces upload error, falling back to local/data URL:", err);
    }
  }

  // Local storage fallback for dev/testing when Spaces credentials aren't configured
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const localPath = path.join(uploadDir, path.basename(fileKey));
    await fs.writeFile(localPath, buffer);
    return `/uploads/${path.basename(fileKey)}`;
  } catch (localErr) {
    console.error("Local storage error:", localErr);
    // Ultimate fallback: data URL
    const base64 = buffer.toString("base64");
    return `data:${contentType};base64,${base64}`;
  }
}
