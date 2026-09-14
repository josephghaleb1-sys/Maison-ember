import type { Metadata } from "next";
import { Images } from "lucide-react";
import { requireBusinessContext } from "@/lib/dal";
import { getMediaLibrary } from "@/lib/queries/admin";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { MediaCard } from "@/components/admin/media-card";

export const metadata: Metadata = { title: "Media" };

export default async function MediaPage() {
  const { business } = await requireBusinessContext();
  const media = await getMediaLibrary(business.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-50">Media library</h1>
        <p className="text-sm text-ink-400">
          Upload photos for your gallery, logo, and hero banner. Product photos are managed from each product.
        </p>
      </div>

      <Card>
        <CardBody>
          <MediaUploadForm />
        </CardBody>
      </Card>

      {media.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No files yet"
          description="Upload your first photo above to start building your gallery."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      )}
    </div>
  );
}
