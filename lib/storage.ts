export type PhotoBucket = "avatars" | "business-photos";

// Tables store only "<user id>/<file>"; build the public URL here.
export function photoUrl(bucket: PhotoBucket, path: string | null | undefined) {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export const PHOTO_PATH = /^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,80}$/;
