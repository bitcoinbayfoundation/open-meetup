import fs from "fs";
import path from "path";
import DocsClient from "./docs-client";

interface DocTab {
  slug: string;
  title: string;
  content: string;
}

function loadDoc(filename: string, title: string): DocTab {
  const filePath = path.join(process.cwd(), "content/docs", filename);
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "";
  return { slug: filename.replace(".md", ""), title, content };
}

export default function DocsPage() {
  const tabs: DocTab[] = [
    loadDoc("getting-started.md", "Getting Started"),
    loadDoc("vercel.md", "Vercel"),
    loadDoc("resend.md", "Resend"),
    loadDoc("zaprite.md", "Zaprite"),
    loadDoc("meetup.md", "Meetup"),
    loadDoc("telegram.md", "Telegram"),
    loadDoc("google-maps.md", "Google Maps"),
    loadDoc("content-guide.md", "Content"),
    loadDoc("customization.md", "Customization"),
    loadDoc("config-reference.md", "Config Reference"),
  ];

  return <DocsClient tabs={tabs} />;
}
