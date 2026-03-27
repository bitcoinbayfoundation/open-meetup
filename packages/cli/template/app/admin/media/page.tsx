import { requireAdmin } from "@/lib/require-admin";
import { getAllMedia, getFoldersWithCounts } from "@/lib/media";
import MediaExplorer from "./media-explorer";

export default async function AdminMediaPage() {
  await requireAdmin();

  const [media, folders] = await Promise.all([
    getAllMedia(),
    getFoldersWithCounts(),
  ]);

  return <MediaExplorer initialMedia={media} initialFolders={folders} />;
}
