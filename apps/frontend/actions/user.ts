"use server";

import { auth } from "@/auth";
import { db } from "@/lib/database";
import { revalidatePath } from "next/cache";
import { s3, S3_BUCKET } from "@/lib/storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getPresignedDownloadUrl } from "@/lib/storage";
import sharp from "sharp";

export async function updateTheme(theme: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!["light", "dark", "system"].includes(theme)) {
    throw new Error("Invalid theme");
  }

  const existing = await db.userPreference.findFirst({
    where: { userId: session.user.id, key: "theme", projectId: null },
  });

  if (existing) {
    await db.userPreference.update({
      where: { id: existing.id },
      data: { value: theme },
    });
  } else {
    await db.userPreference.create({
      data: { userId: session.user.id, key: "theme", value: theme },
    });
  }

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

    // Upload to S3 / LocalStack
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: resizedBuffer,
        ContentType: "image/jpeg",
      })
    );

    // Generate a presigned download URL for the avatar
    const imageUrl = await getPresignedDownloadUrl(key);

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
