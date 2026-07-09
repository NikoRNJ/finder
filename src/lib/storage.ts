import type { SupabaseClient } from "@supabase/supabase-js";

// Sube blob a bucket bajo carpeta del usuario; devuelve el path.
export async function uploadToBucket(
  supabase: SupabaseClient,
  bucket: string,
  userId: string,
  blob: Blob
): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: "image/jpeg",
  });
  if (error) throw error;
  return path;
}

// URL firmada (buckets privados). TTL 1h.
export async function signedUrl(
  supabase: SupabaseClient,
  bucket: string,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// Firma en lote (para feeds).
export async function signedUrls(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[]
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, 3600);
  if (error) throw error;
  return new Map(
    data
      .filter((d) => d.path && d.signedUrl)
      .map((d) => [d.path as string, d.signedUrl as string])
  );
}
