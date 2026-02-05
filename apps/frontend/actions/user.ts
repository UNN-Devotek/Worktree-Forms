"use server";

import { auth } from "@/auth";
import { db } from "@/lib/database";
import { revalidatePath } from "next/cache";
import { s3Client } from "@/lib/storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "worktree";

export async function updateTheme(theme: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!["light", "dark", "system"].includes(theme)) {
    throw new Error("Invalid theme");
  }

  await db.userPreference.upsert({
    where: {
      userId: session.user.id,
    },
    update: {
      theme,
    },
    create: {
      userId: session.user.id,
      theme,
    },
  });

  revalidatePath("/");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "No file provided" };
  }

  // Validate type
  if (!file.type.startsWith("image/")) {
    return { error: "Invalid file type. Please upload an image." };
  }

  // Validate size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: "File too large. Max 5MB." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Resize (256x256)
    const resizedBuffer = await sharp(buffer)
      .resize(256, 256)
      .jpeg({ quality: 80 })
      .toBuffer();

    const key = `user-profiles/${session.user.id}/avatar.jpg`;

    // Upload to MinIO
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: resizedBuffer,
        ContentType: "image/jpeg",
        ACL: "public-read", // Ensure it's readable if policies allow
      })
    );

    // Construct URL (Assuming Standard MinIO/S3 URL format)
    // If using alias/proxy, adjust accordingly. 
    // For local dev, generic s3 url might need fix, but MinIO usually `http://endpoint/bucket/key`
    const endpoint = process.env.MINIO_PUBLIC_URL || "http://localhost:9000";
    const imageUrl = `${endpoint}/${BUCKET_NAME}/${key}`;

    // Update User Image in DB
    await db.user.update({
      where: { id: session.user.id },
      data: { image: imageUrl },
    });

    revalidatePath("/settings"); // Assuming settings page
    revalidatePath("/"); // Update nav avatar
    
    return { success: true, imageUrl };
  } catch (error) {
    console.error("Avatar upload failed:", error);
    return { error: "Upload failed" };
  }
}
