import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote,
  Link as LinkIcon, Image as ImageIcon, Undo, Redo, Minus,
} from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
        active ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-sand-100'
      }`}
    >
      {children}
    </button>
  );
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ HTMLAttributes: { class: 'rounded-xl' } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-teal-700 underline' } }),
      Placeholder.configure({ placeholder: 'Start writing your story…' }),
    ],
    content: content || '',
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none font-serif focus:outline-none min-h-[320px] px-4 py-3',
      },
    },
  });

  // Keep editor content in sync if the parent form resets it (e.g. closing/reopening modal)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current && content !== undefined) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  async function handleImageUpload(file: File, editorInstance: Editor) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image must be under 8MB.');
      return;
    }
    setUploadError('');
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `journal-content/${fileName}`;

      const { error: uploadErr } = await supabase.storage.from('public-bucket').upload(filePath, file);
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('public-bucket').getPublicUrl(filePath);
      editorInstance.chain().focus().setImage({ src: publicUrl, alt: file.name.split('.')[0] }).run();
    } catch (err: any) {
      console.error('Content image upload error:', err);
      setUploadError(err?.message || 'Failed to upload image. Check your storage bucket permissions.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', previousUrl || 'https://');
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  if (!editor) {
    return <div className="text-sm text-slate-400 p-4 border border-sand-200 rounded-xl bg-sand-50">Loading editor…</div>;
  }

  return (
    <div className="border border-sand-200 rounded-xl overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-sand-200 bg-sand-50">
        <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={16} />
        </ToolbarButton>

        <div className="w-px h-5 bg-sand-300 mx-1" />

        <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 size={16} />
        </ToolbarButton>

        <div className="w-px h-5 bg-sand-300 mx-1" />

        <ToolbarButton title="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton title="Numbered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={16} />
        </ToolbarButton>

        <div className="w-px h-5 bg-sand-300 mx-1" />

        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon size={16} />
        </ToolbarButton>
        <ToolbarButton title="Insert Image" onClick={() => fileInputRef.current?.click()} disabled={uploadingImage}>
          <ImageIcon size={16} />
        </ToolbarButton>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={e => e.target.files && editor && handleImageUpload(e.target.files[0], editor)}
        />

        <div className="w-px h-5 bg-sand-300 mx-1" />

        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo size={16} />
        </ToolbarButton>

        {uploadingImage && <span className="text-xs text-teal-700 ml-2">Uploading image…</span>}
      </div>

      <EditorContent editor={editor} />

      {uploadError && (
        <div className="px-4 py-2 text-xs text-rose-600 bg-rose-50 border-t border-rose-100">{uploadError}</div>
      )}
    </div>
  );
}
