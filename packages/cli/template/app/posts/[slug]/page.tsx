import type { Metadata } from "next";
import Link from "next/link";
import { getPostBySlug, readingTime } from "@/lib/posts";
import { notFound } from "next/navigation";
import MarkdownRenderer from "./markdown-renderer";
import config from "@/site.config";

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  const title = post.meta_title || `${post.title} • ${config.org.name}`;
  const description =
    post.meta_description ||
    post.excerpt ||
    post.body.slice(0, 160).replace(/[#*_`\n]/g, "");
  const ogImage = post.og_image || post.featured_image;

  return {
    title,
    description,
    alternates: {
      canonical: `${config.url}/posts/${slug}`,
    },
    openGraph: {
      title,
      description,
      images: [{ url: ogImage || "/og/posts.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage || "/og/posts.png"],
    },
  };
}

function postJsonLd(post: {
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  author_name: string;
  featured_image: string | null;
  created_at: string;
  updated_at: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description:
      post.excerpt || post.body.slice(0, 160).replace(/[#*_`\n]/g, ""),
    author: {
      "@type": "Person",
      name: post.author_name,
    },
    publisher: {
      "@type": "Organization",
      name: config.org.name,
      url: config.url,
      logo: {
        "@type": "ImageObject",
        url: `${config.url}/brand/logo.svg`,
      },
    },
    url: `${config.url}/posts/${post.slug}`,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    ...(post.featured_image ? { image: post.featured_image } : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${config.url}/posts/${post.slug}`,
    },
    isPartOf: {
      "@type": "Blog",
      name: `${config.org.name} Blog`,
      url: `${config.url}/posts`,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd(post)) }}
      />
      <div className="mx-auto max-w-[800px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">cat {slug}.md</span>
        </div>

        {post.tags.length > 0 && (
          <div className="flex gap-2 mb-4">
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/posts?tag=${tag.slug}`}
                className="font-mono text-[0.6rem] text-t-accent/60 border border-t-accent/20 px-2 py-0.5 hover:border-t-accent hover:text-t-accent transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        <h1 className="font-mono font-bold lowercase leading-[0.95] tracking-[-0.02em] text-t-surface text-[clamp(1.8rem,4vw,3rem)] mb-4">
          {post.title}
        </h1>

        <p className="font-mono text-[0.7rem] text-t-surface/40 mb-10">
          {post.author_name} &middot;{" "}
          {new Date(post.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}{" "}
          &middot; {readingTime(post.body)} min read
        </p>

        {post.featured_image && (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full border border-t-surface/10 mb-10"
          />
        )}

        <div className="prose-dark">
          <MarkdownRenderer content={post.body} />
        </div>
      </div>
    </main>
  );
}
