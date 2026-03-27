import Link from "next/link";
import { getPublishedPosts, readingTime } from "@/lib/posts";
import { genMetadata } from "@/lib/og";
import config from "@/site.config";

export const revalidate = 60;

export const metadata = genMetadata({
  path: "/posts",
  title: `Blog — ${config.org.name} | Bitcoin News & Updates from ${config.location.city}`,
  image: "/og/posts.png",
  description:
    `Articles, updates, and insights from ${config.org.name} in ${config.location.city}, ${config.location.stateAbbrev}. Read about Bitcoin adoption, community events, and blockchain technology in the ${config.location.areaDescription}.`,
});

function autoExcerpt(markdown: string, maxLength = 160): string {
  const plain = markdown
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/[*_`~>]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return plain.length > maxLength
    ? plain.slice(0, maxLength).trimEnd() + "..."
    : plain;
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;
  const posts = await getPublishedPosts(tag);

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6 flex items-center gap-2">
          <span className="text-t-accent">$</span>
          <span className="text-t-surface/70">
            ls ./posts{tag ? ` --tag=${tag}` : ""}
          </span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(3rem,8vw,7rem)] mb-16">
          posts<span className="text-t-accent glow">.</span>
        </h1>

        {tag && (
          <div className="mb-10 flex items-center gap-3">
            <span className="font-mono text-[0.7rem] text-t-surface/50">
              filtered by:
            </span>
            <span className="font-mono text-[0.7rem] text-t-accent border border-t-accent/30 px-2 py-0.5">
              {tag}
            </span>
            <Link
              href="/posts"
              className="font-mono text-[0.65rem] text-t-surface/40 hover:text-t-accent transition-colors"
            >
              clear
            </Link>
          </div>
        )}

        {posts.length === 0 ? (
          <p className="font-sans text-t-surface/50">
            No posts yet. Check back soon.
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="group border-t border-t-surface/10 pt-8 block"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {post.featured_image && (
                    <div className="lg:w-64 shrink-0">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-40 object-cover border border-t-surface/10"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {post.featured && (
                        <span className="font-mono text-[0.55rem] text-t-warm border border-t-warm/30 px-1.5 py-0.5">
                          ★ featured
                        </span>
                      )}
                      {post.tags.map((t) => (
                        <span
                          key={t.id}
                          className="font-mono text-[0.55rem] text-t-accent/60 border border-t-accent/20 px-1.5 py-0.5"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                    <h2 className="font-mono font-bold lowercase text-t-surface text-xl mb-2 group-hover:text-t-accent transition-colors">
                      {post.title}
                    </h2>
                    <p className="font-mono text-[0.65rem] text-t-surface/40 mb-3">
                      {post.author_name} &middot;{" "}
                      {new Date(post.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      &middot; {readingTime(post.body)} min read
                    </p>
                    <p className="font-sans text-sm text-t-surface/60 leading-relaxed max-w-[60ch]">
                      {post.excerpt || autoExcerpt(post.body)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
