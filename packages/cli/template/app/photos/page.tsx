import Link from "next/link";
import { getPublicGallery } from "@/lib/media";
import { genMetadata } from "@/lib/og";
import PhotoGrid from "./photo-grid";
import config from "@/site.config";

export const revalidate = 60;

export const metadata = genMetadata({
  path: "/photos",
  title: `Photos — ${config.org.name} Events & Meetups in ${config.location.city}`,
  image: "/og/photos.jpg",
  description:
    `Photo gallery from ${config.org.name} events, meetups, and community gatherings across ${config.location.city}, ${config.location.state}. See our Bitcoin meetups, workshops, and community events in action.`,
});

function folderLabel(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\//g, " / ");
}

function imageAlt(img: { alt?: string | null; filename: string }, folderName?: string): string {
  if (img.alt) return img.alt;
  const context = folderName ? folderLabel(folderName) : `${config.org.name} event`;
  return `${config.org.name} — ${context}`;
}

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const { folder } = await searchParams;
  const gallery = await getPublicGallery();

  const folderNames = gallery.map((g) => g.folder);
  const activeImages = folder
    ? gallery.find((g) => g.folder === folder)?.images ?? []
    : gallery.flatMap((g) => g.images);

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6 flex items-center gap-2">
          <span className="text-t-accent">$</span>
          <span className="text-t-surface/70">
            ls /gallery/{folder ? `--filter=${folder}` : ""}
          </span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2.4rem,6vw,5rem)] mb-10">
          photos<span className="text-t-accent glow">.</span>
        </h1>

        {/* Folder filter */}
        {folderNames.length > 1 && (
          <div className="flex flex-wrap items-center gap-3 mb-10">
            <Link
              href="/photos"
              className={`font-mono text-[0.7rem] lowercase px-3 py-1 border transition-colors ${
                !folder
                  ? "border-t-accent text-t-accent"
                  : "border-t-surface/20 text-t-surface/50 hover:border-t-accent/40 hover:text-t-accent"
              }`}
            >
              all
            </Link>
            {folderNames.map((f) => {
              const count =
                gallery.find((g) => g.folder === f)?.images.length ?? 0;
              return (
                <Link
                  key={f}
                  href={`/photos?folder=${encodeURIComponent(f)}`}
                  className={`font-mono text-[0.7rem] lowercase px-3 py-1 border transition-colors ${
                    folder === f
                      ? "border-t-accent text-t-accent"
                      : "border-t-surface/20 text-t-surface/50 hover:border-t-accent/40 hover:text-t-accent"
                  }`}
                >
                  {folderLabel(f)}
                  <span className="text-t-surface/30 ml-1.5 text-[0.6rem]">
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Active folder heading */}
        {folder && (
          <div className="mb-8">
            <h2 className="font-mono font-bold lowercase text-t-surface text-xl">
              {folderLabel(folder)}
            </h2>
          </div>
        )}

        {/* Gallery */}
        {activeImages.length === 0 ? (
          <p className="font-sans text-t-surface/50">
            No photos yet. Check back soon.
          </p>
        ) : folder ? (
          /* Single folder — flat grid with lightbox */
          <PhotoGrid
            images={activeImages.map((img) => ({
              id: img.id,
              url: img.url,
              alt: imageAlt(img, folder),
            }))}
          />
        ) : (
          /* All folders — grouped sections */
          <div className="space-y-16">
            {gallery.map((group) => {
              const groupImages = group.images.slice(0, 10).map((img) => ({
                id: img.id,
                url: img.url,
                alt: imageAlt(img, group.folder),
              }));
              return (
                <section key={group.folder}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="font-mono text-[0.6rem] text-t-surface/40 mb-2">
                        <span className="text-t-accent">$</span> ls /
                        {group.folder}
                      </p>
                      <h2 className="font-mono font-bold lowercase text-t-surface text-lg">
                        {folderLabel(group.folder)}
                        <span className="text-t-accent">.</span>
                      </h2>
                    </div>
                    <Link
                      href={`/photos?folder=${encodeURIComponent(group.folder)}`}
                      className="font-mono text-[0.68rem] lowercase text-t-surface/50 hover:text-t-accent transition-colors"
                    >
                      view all ({group.images.length})
                    </Link>
                  </div>
                  <PhotoGrid
                    images={groupImages}
                    columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
