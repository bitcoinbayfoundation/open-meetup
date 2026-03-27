import { genMetadata } from "@/lib/og";
import { getPublishedResources, RESOURCE_CATEGORIES } from "@/lib/resources";
import type { Resource, ResourceCategory } from "@/lib/resources";
import config from "@/site.config";
import { faqs as allFaqs } from "@/lib/content";
import EducationTabs from "./tabs";

export const revalidate = 60;

export const metadata = genMetadata({
  path: "/education",
  title: `Bitcoin Education & Resources in ${config.location.city}, ${config.location.stateAbbrev} — ${config.org.name}`,
  image: "/og/education.jpg",
  description:
    "Learn Bitcoin and blockchain technology in Tampa Bay. Curated documentaries, books, articles, podcasts, and tools — plus free hands-on workshops. Open to all skill levels.",
});

const faqs = allFaqs.education;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const categoryLabels: Record<ResourceCategory, string> = {
  documentaries: "Documentaries",
  books: "Books",
  articles: "Articles",
  websites: "Websites",
  podcasts: "Podcasts",
};

function buildResourcesJsonLd(resources: Resource[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Bitcoin Education Resources",
    description:
      "Curated Bitcoin education resources including documentaries, books, articles, websites, and podcasts.",
    url: `${config.url}/education`,
    publisher: {
      "@type": "Organization",
      name: config.org.name,
      url: config.url,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: resources.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "CreativeWork",
          name: r.title,
          url: r.url,
          description: r.description || undefined,
          author: r.author ? { "@type": "Person", name: r.author } : undefined,
          image: r.image || undefined,
        },
      })),
    },
  };
}

export default async function EducationPage() {
  const allResources = await getPublishedResources();

  const resourcesByCategory = new Map<ResourceCategory, Resource[]>();
  for (const cat of RESOURCE_CATEGORIES) {
    resourcesByCategory.set(
      cat,
      allResources.filter((r) => r.category === cat),
    );
  }

  const activeTabs = RESOURCE_CATEGORIES.filter(
    (cat) => (resourcesByCategory.get(cat)?.length ?? 0) > 0,
  );

  const resourcesJsonLd = buildResourcesJsonLd(allResources);

  const tabData = Object.fromEntries(
    activeTabs.map((cat) => [cat, resourcesByCategory.get(cat) ?? []]),
  );

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      {allResources.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(resourcesJsonLd),
          }}
        />
      )}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        {/* Terminal prompt */}
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6 flex items-center gap-2">
          <span className="text-t-accent">$</span>
          <span className="text-t-surface/70">ls /education/</span>
        </div>

        {/* Heading */}
        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(3rem,8vw,7rem)] mb-16">
          education<span className="text-t-accent glow">.</span>
        </h1>

        {/* Intro */}
        <div className="max-w-[72ch] mb-20">
          <div className="border-l-2 border-t-accent/40 pl-6">
            <p className="font-sans text-[clamp(0.95rem,1.2vw,1.1rem)] leading-[1.8] text-t-surface/70">
              We believe sound money education should be free and accessible to
              everyone. These are the tools and platforms we recommend to get
              started on your Bitcoin journey.
            </p>
          </div>
        </div>

        {/* Curated resources with tabs */}
        {activeTabs.length > 0 && (
          <EducationTabs
            tabs={activeTabs}
            tabLabels={categoryLabels}
            resources={tabData}
          />
        )}

        {/* FAQ */}
        {faqs.length > 0 && (
          <div className="mt-20 border-t border-t-surface/10 pt-12">
            <p className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
              <span className="text-t-accent">$</span> cat /education/faq.json
            </p>
            <h2 className="font-mono font-bold lowercase leading-[0.9] tracking-[-0.02em] text-t-surface text-[clamp(1.8rem,4vw,3rem)] mb-10">
              frequently asked<span className="text-t-accent">.</span>
            </h2>
            <div className="space-y-4 max-w-[72ch]">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="border border-t-surface/10 bg-t-surface/5 group"
                >
                  <summary className="cursor-pointer p-5 font-mono text-[0.85rem] text-t-surface/80 hover:text-t-accent transition-colors list-none flex items-center justify-between">
                    <span>{faq.question}</span>
                    <span className="text-t-accent ml-4 group-open:rotate-45 transition-transform text-lg shrink-0">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-t-surface/60 text-[0.85rem] leading-[1.8] border-t border-t-surface/10 pt-4">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
