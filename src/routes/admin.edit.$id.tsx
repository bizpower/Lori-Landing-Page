import { createFileRoute, notFound } from "@tanstack/react-router";
import { adminCheck, adminGetPost, listCategories } from "@/lib/blog.functions";
import { PostEditorForm } from "@/components/post-editor-form";

export const Route = createFileRoute("/admin/edit/$id")({
  loader: async ({ params }) => {
    const { authed } = await adminCheck();
    if (!authed) return { post: null as any, categories: [] };
    const id = Number(params.id);
    const [{ post }, { categories }] = await Promise.all([
      adminGetPost({ data: { id } }),
      listCategories(),
    ]);
    if (!post) throw notFound();
    return { post, categories };
  },
  component: EditPost,
});

function EditPost() {
  const { post, categories } = Route.useLoaderData();
  if (!post) return null;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Modifica articolo</h1>
      <PostEditorForm initial={post as any} categories={categories as any} />
    </div>
  );
}
