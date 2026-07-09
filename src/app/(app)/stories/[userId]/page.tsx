import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signedUrls } from "@/lib/storage";
import StoryViewer from "@/components/stories/StoryViewer";

export const dynamic = "force-dynamic";

export default async function StoryViewerPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: stories } = await supabase
    .from("stories")
    .select("id, image_url, created_at, author_id")
    .eq("author_id", userId)
    .order("created_at", { ascending: true });

  if (!stories || stories.length === 0) notFound();

  const { data: author } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();

  const urls = await signedUrls(
    supabase,
    "stories",
    stories.map((s) => s.image_url)
  );

  const isOwner = user!.id === userId;

  // vistas ("visto por") solo para el dueño
  let viewsByStory: Record<string, string[]> = {};
  if (isOwner) {
    const { data: views } = await supabase
      .from("story_views")
      .select("story_id, viewer:profiles!story_views_viewer_id_fkey (username)")
      .in(
        "story_id",
        stories.map((s) => s.id)
      );
    viewsByStory = {};
    for (const v of (views ?? []) as unknown as {
      story_id: string;
      viewer: { username: string };
    }[]) {
      (viewsByStory[v.story_id] ??= []).push(v.viewer.username);
    }
  }

  return (
    <StoryViewer
      stories={stories.map((s) => ({
        id: s.id,
        url: urls.get(s.image_url) ?? "",
        created_at: s.created_at,
        viewers: viewsByStory[s.id] ?? [],
      }))}
      authorUsername={author?.username ?? ""}
      isOwner={isOwner}
      viewerId={user!.id}
    />
  );
}
