import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, List, Quote,
  Highlighter, Link2, Image as ImageIcon, Minus, Undo2, Redo2,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  /** Optional slot rendered at the right end of the toolbar (e.g. SEO Highlight AI button). */
  toolbarExtras?: React.ReactNode;
  /** Expose the latest HTML setter for parent (used by AI actions). */
  onReady?: (api: { setHTML: (html: string) => void }) => void;
};

export function TipTapEditor({ value, onChange, toolbarExtras, onReady }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Highlight,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener", target: "_blank" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl my-4" } }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-slate max-w-none min-h-[400px] focus:outline-none px-4 py-3 prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-a:text-primary",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value && value !== editor.getHTML()) editor.commands.setContent(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (editor && onReady) onReady({ setHTML: (html: string) => editor.commands.setContent(html) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  const Btn = ({ active, onClick, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition ${
        active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
        <Btn title="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Btn>
        <Btn title="H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn title="Grassetto" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
        <Btn title="Corsivo" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
        <Btn title="Barrato" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Btn>
        <Btn title="Highlight" active={editor.isActive("highlight")} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn title="Lista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
        <Btn title="Citazione" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Btn>
        <Btn title="Linea" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn title="Link" active={editor.isActive("link")} onClick={() => {
          const url = window.prompt("URL del link");
          if (url === null) return;
          if (url === "") { editor.chain().focus().unsetLink().run(); return; }
          editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
        }}><Link2 className="h-4 w-4" /></Btn>
        <Btn title="Immagine (Cloudinary URL)" onClick={() => {
          const url = window.prompt("URL immagine Cloudinary");
          const alt = window.prompt("Alt text descrittivo SEO");
          if (url) editor.chain().focus().setImage({ src: url, alt: alt || "" }).run();
        }}><ImageIcon className="h-4 w-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" />
        <Btn title="Annulla" onClick={() => editor.chain().focus().undo().run()}><Undo2 className="h-4 w-4" /></Btn>
        <Btn title="Ripeti" onClick={() => editor.chain().focus().redo().run()}><Redo2 className="h-4 w-4" /></Btn>
        {toolbarExtras ? (
          <>
            <span className="mx-1 h-5 w-px bg-border" />
            <div className="ml-auto flex items-center gap-1">{toolbarExtras}</div>
          </>
        ) : null}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
