import { createFileRoute } from "@tanstack/react-router";
import { adminCheck, listCategories } from "@/lib/blog.functions";
import { PostEditorForm } from "@/components/post-editor-form";

export const Route = createFileRoute("/admin/new")({
  loader: async () => {
    const { authed } = await adminCheck();
    if (!authed) return { categories: [] };
    return listCategories();
  },
  component: NewPost,
});

function NewPost() {
  const { categories } = Route.useLoaderData();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Nuovo articolo</h1>
      <PostEditorForm categories={categories as any} />
    </div>
  );
}
