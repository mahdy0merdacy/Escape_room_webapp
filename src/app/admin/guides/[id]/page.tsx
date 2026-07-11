import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import GuideForm from "@/components/GuideForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditGuidePage({ params }: Props) {
  const { id } = await params;
  const guide = await prisma.guide.findUnique({ where: { id } });
  if (!guide) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Edit Guide</h1>
      <p className="text-white/50 text-sm mb-8">{guide.title}</p>
      <GuideForm
        guideId={guide.id}
        initial={{
          slug: guide.slug,
          title: guide.title,
          excerpt: guide.excerpt,
          content: guide.content,
          titleFr: guide.titleFr,
          excerptFr: guide.excerptFr,
          contentFr: guide.contentFr,
          titleAr: guide.titleAr,
          excerptAr: guide.excerptAr,
          contentAr: guide.contentAr,
          heroImageUrl: guide.heroImageUrl,
          pillar: guide.pillar,
          active: guide.active,
          order: guide.order,
          seoTitle: guide.seoTitle,
          seoDescription: guide.seoDescription,
        }}
      />
    </div>
  );
}
