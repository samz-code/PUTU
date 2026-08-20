import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import {
  Plus, X, Pencil, Trash2, Image as ImageIcon, ChevronLeft,
  ChevronRight, Users, AlertCircle, CheckCircle2, Search,
  UploadCloud, Loader2, Link as LinkIcon, GripVertical, ImageOff,
} from 'lucide-react';

interface Room {
  id: string;
  hotel_id: string;
  name: string;
  capacity: number;
  price_per_night: number;
  description?: string;
  amenities: string[];
  images: string[];
}

const IMAGE_BUCKET = 'room-images';
const MAX_IMAGES = 10;
const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export default function HotelRooms() {
  const { user } = useAuth();
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Feedback banners — surfaced from real Supabase errors, not swallowed
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState('');
  const [images, setImages] = useState<string[]>([]);

  // --- Image dropzone state (inline, no separate component) ---
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carousel/Lightbox Modal State
  const [selectedRoomImages, setSelectedRoomImages] = useState<string[] | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('hotels')
      .select('id')
      .eq('partner_user_id', user.id)
      .maybeSingle()
      .then(({ data, error: hotelErr }) => {
        if (hotelErr) {
          setError(hotelErr.message);
          setLoading(false);
          return;
        }
        if (data) setHotelId(data.id);
        else setLoading(false);
      });
  }, [user]);

  const loadRooms = async () => {
    if (!hotelId) return;
    setLoading(true);
    const { data, error: loadErr } = await supabase
      .from('hotel_rooms')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });

    if (loadErr) {
      setError(loadErr.message);
    } else {
      setRooms((data as Room[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  // Auto-dismiss the success banner; errors stay until the user acts again
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(null), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const openForm = (room?: Room) => {
    setError(null);
    setShowUrlInput(false);
    setUrlInput('');
    if (room) {
      setEditId(room.id);
      setName(room.name);
      setCapacity(String(room.capacity));
      setPrice(String(room.price_per_night ?? ''));
      setDescription(room.description || '');
      setAmenities(room.amenities ? room.amenities.join(', ') : '');
      setImages(room.images ?? []);
    } else {
      setEditId(null);
      setName('');
      setCapacity('2');
      setPrice('');
      setDescription('');
      setAmenities('');
      setImages([]);
    }
    setShowForm(true);
  };

  // --- Image upload / reorder / remove (inline dropzone logic) ---

  const uploadFiles = async (fileList: FileList | File[]) => {
    if (!hotelId) return;
    const files = Array.from(fileList);
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setError(`You can add up to ${MAX_IMAGES} images per room.`);
      return;
    }

    const toUpload = files.slice(0, room);
    if (files.length > toUpload.length) {
      setError(`Only added ${toUpload.length} of ${files.length} images — ${MAX_IMAGES} image limit per room.`);
    }

    const valid: File[] = [];
    for (const file of toUpload) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`"${file.name}" isn't a supported image type (use JPG, PNG, WEBP, or AVIF).`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`"${file.name}" is over ${MAX_FILE_SIZE_MB}MB — pick a smaller file.`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;

    setUploadingCount((c) => c + valid.length);

    const uploaded: string[] = [];
    for (const file of valid) {
      const ext = file.name.split('.').pop() || 'jpg';
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const path = `${hotelId}/${safeName}`;

      const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        setError(`Upload failed for "${file.name}": ${uploadError.message}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
      if (publicUrlData?.publicUrl) uploaded.push(publicUrlData.publicUrl);
    }

    setUploadingCount((c) => Math.max(0, c - valid.length));
    if (uploaded.length > 0) setImages((prev) => [...prev, ...uploaded]);
  };

  const handleDropFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const removeImageAt = async (index: number) => {
    const url = images[index];
    setImages((prev) => prev.filter((_, i) => i !== index));

    // Best-effort cleanup — only for images actually hosted in our bucket;
    // silently skip external/legacy URLs (nothing to delete server-side).
    const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
    const markerIdx = url.indexOf(marker);
    if (markerIdx === -1) return;
    const path = url.slice(markerIdx + marker.length);
    const { error: removeErr } = await supabase.storage.from(IMAGE_BUCKET).remove([path]);
    if (removeErr) setError(`Removed from room, but couldn't delete the stored file: ${removeErr.message}`);
  };

  // Reordering via native HTML5 drag & drop on the thumbnails
  const handleThumbDragStart = (index: number) => {
    dragIndexRef.current = index;
  };
  const handleThumbDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (overIndex !== index) setOverIndex(index);
  };
  const handleThumbDrop = (index: number) => {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    setOverIndex(null);
    if (from === null || from === index) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next;
    });
  };

  const addImageUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (images.length >= MAX_IMAGES) {
      setError(`You can add up to ${MAX_IMAGES} images per room.`);
      return;
    }
    setImages((prev) => [...prev, trimmed]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  // --- Room save / delete ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    setError(null);

    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum < 0) {
      setError('Enter a valid price per night.');
      return;
    }
    const capacityNum = Number(capacity);
    if (!capacity || Number.isNaN(capacityNum) || capacityNum < 1) {
      setError('Max guests must be at least 1.');
      return;
    }

    setSaving(true);

    const payload = {
      hotel_id: hotelId,
      name: name.trim(),
      capacity: capacityNum,
      price_per_night: priceNum,
      description: description.trim(),
      amenities: amenities.split(',').map((s) => s.trim()).filter(Boolean),
      images,
    };

    const { error: writeErr } = editId
      ? await supabase.from('hotel_rooms').update(payload).eq('id', editId)
      : await supabase.from('hotel_rooms').insert(payload);

    setSaving(false);

    if (writeErr) {
      setError(writeErr.message);
      return;
    }

    setSuccessMsg(editId ? 'Room updated.' : 'Room added.');
    setShowForm(false);
    loadRooms();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    const { error: deleteErr } = await supabase.from('hotel_rooms').delete().eq('id', id);
    setDeletingId(null);
    setConfirmDeleteId(null);

    if (deleteErr) {
      setError(deleteErr.message);
      return;
    }
    setSuccessMsg('Room removed.');
    loadRooms();
  };

  const filteredRooms = rooms.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms & Suites"
        subtitle="Detailed room configurations & media options"
        action={
          <button onClick={() => openForm()} className="btn-primary text-xs sm:text-sm flex items-center gap-1.5">
            <Plus size={16} /> Add New Room
          </button>
        }
      />

      {/* GLOBAL FEEDBACK BANNERS */}
      {error && (
        <div className="p-3 sm:p-4 rounded-xl bg-rose-50 border border-rose-200/60 text-xs font-semibold text-rose-700 flex items-start gap-2">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200/60 text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FORM MODAL / CARD */}
      {showForm && hotelId && (
        <form onSubmit={handleSubmit} className="card-md p-4 sm:p-6 bg-white space-y-4 shadow-sm border border-slate-200 rounded-2xl">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-serif font-bold text-slate-800 text-lg">
              {editId ? 'Edit Room Details' : 'Add New Room'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label text-xs font-semibold">Room Name / Title</label>
              <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Executive Ocean Suite" />
            </div>
            <div>
              <label className="label text-xs font-semibold">Max Guests Capacity</label>
              <input type="number" min={1} className="input" required value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div>
              <label className="label text-xs font-semibold">Price per Night ($)</label>
              <input type="number" min={0} step="0.01" className="input" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="250" />
            </div>
          </div>

          <div>
            <label className="label text-xs font-semibold">Description</label>
            <textarea
              className="input text-xs"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide key highlights of this room..."
            />
          </div>

          <div>
            <label className="label text-xs font-semibold">Amenities (Comma separated)</label>
            <input
              className="input text-xs"
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              placeholder="WiFi, Mini Bar, King Bed, Ocean View, AC"
            />
          </div>

          {/* DRAG & DROP IMAGE GALLERY (inline) */}
          <div className="space-y-3">
            <label className="label text-xs font-semibold block">Room Photo Gallery</label>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleDropFiles}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
                isDraggingFile
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) uploadFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              {uploadingCount > 0 ? (
                <>
                  <Loader2 size={22} className="text-teal-600 animate-spin" />
                  <p className="text-xs font-semibold text-slate-600">
                    Uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}...
                  </p>
                </>
              ) : (
                <>
                  <UploadCloud size={22} className={isDraggingFile ? 'text-teal-600' : 'text-slate-400'} />
                  <p className="text-xs font-semibold text-slate-600">
                    Drag photos here, or <span className="text-teal-600 underline">browse</span>
                  </p>
                  <p className="text-2xs text-slate-400">
                    JPG, PNG, WEBP, or AVIF — up to {MAX_FILE_SIZE_MB}MB each, {MAX_IMAGES} max
                  </p>
                </>
              )}
            </div>

            {/* Add via URL fallback */}
            <div>
              {showUrlInput ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    className="input text-xs flex-1"
                    placeholder="https://images.example.com/room.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addImageUrl();
                      }
                      if (e.key === 'Escape') setShowUrlInput(false);
                    }}
                  />
                  <button type="button" onClick={addImageUrl} className="btn-secondary text-xs px-3">Add</button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUrlInput(false);
                      setUrlInput('');
                    }}
                    className="text-slate-400 hover:text-slate-600 px-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="text-2xs font-semibold text-slate-500 hover:text-teal-600 flex items-center gap-1"
                >
                  <LinkIcon size={12} /> Or add an image by URL
                </button>
              )}
            </div>

            {/* Thumbnails — drag to reorder, first = cover photo */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    draggable
                    onDragStart={() => handleThumbDragStart(index)}
                    onDragOver={(e) => handleThumbDragOver(e, index)}
                    onDrop={() => handleThumbDrop(index)}
                    onDragEnd={() => setOverIndex(null)}
                    className={`relative group aspect-square rounded-xl overflow-hidden border-2 bg-slate-100 cursor-grab active:cursor-grabbing transition-all ${
                      overIndex === index ? 'border-teal-500 scale-[0.97]' : 'border-slate-200'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Room photo ${index + 1}`}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                    {index === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md">
                        Cover
                      </span>
                    )}
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImageAt(index);
                        }}
                        className="bg-slate-900/80 hover:bg-rose-600 text-white p-1 rounded-md"
                        title="Remove image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="absolute bottom-1.5 left-1.5 bg-slate-900/60 text-white p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical size={12} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {images.length === 0 && uploadingCount === 0 && (
              <div className="flex items-center gap-2 text-2xs text-slate-400 pt-1">
                <ImageOff size={14} /> No photos yet — the first one you add becomes the cover photo.
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-xs disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Room Details'}
            </button>
          </div>
        </form>
      )}

      {!hotelId && !loading && (
        <div className="card p-10 text-center text-slate-500 text-sm border border-slate-200 rounded-2xl bg-white">
          No hotel profile is linked to your account yet. Contact Putu Travels to finish partner setup before adding rooms.
        </div>
      )}

      {/* SEARCH */}
      {hotelId && rooms.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            className="input text-xs pl-10 pr-4 py-2.5 w-full bg-white border-slate-200 rounded-xl"
            placeholder="Search rooms by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* ROOM LIST GRID */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading rooms...</div>
      ) : hotelId && filteredRooms.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 text-sm border border-slate-200 rounded-2xl bg-white">
          {searchQuery ? 'No rooms match your search.' : 'No rooms added yet. Click "Add New Room" to populate your catalog.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((r) => {
            const hasImages = r.images && r.images.length > 0;
            const mainImg = hasImages ? r.images[0] : 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80';

            return (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="relative h-48 bg-slate-100 group">
                    <img src={mainImg} alt={r.name} className="w-full h-full object-cover" />
                    {hasImages && (
                      <button
                        onClick={() => {
                          setSelectedRoomImages(r.images);
                          setActiveImageIndex(0);
                        }}
                        className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-900 transition-colors"
                      >
                        <ImageIcon size={14} />
                        <span>{r.images.length} Photos</span>
                      </button>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <h3 className="font-serif font-bold text-slate-900 text-lg">{r.name}</h3>
                      <span className="text-teal-600 font-bold text-base whitespace-nowrap">${r.price_per_night}<span className="text-2xs text-slate-400 font-normal">/night</span></span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1"><Users size={14} /> Max {r.capacity} Guests</span>
                    </div>

                    {r.description && <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">{r.description}</p>}

                    {r.amenities && r.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {r.amenities.map((a, i) => (
                          <span key={i} className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-md">
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 flex gap-2 justify-end border-t border-slate-100 mt-4">
                  {confirmDeleteId === r.id ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Delete this room?</span>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="text-rose-600 font-bold hover:underline disabled:opacity-60"
                      >
                        {deletingId === r.id ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-slate-400 hover:text-slate-600">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => openForm(r)} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setConfirmDeleteId(r.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIGHTBOX / CAROUSEL MODAL */}
      {selectedRoomImages && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setSelectedRoomImages(null)}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 p-2 rounded-full z-10"
            >
              <X size={20} />
            </button>

            <div className="relative w-full h-[60vh] flex items-center justify-center bg-black">
              <img
                src={selectedRoomImages[activeImageIndex]}
                alt="Room detail"
                className="max-h-full max-w-full object-contain"
              />

              {selectedRoomImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? selectedRoomImages.length - 1 : prev - 1))}
                    className="absolute left-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === selectedRoomImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            <div className="p-4 bg-slate-900 w-full flex justify-center gap-2 overflow-x-auto">
              {selectedRoomImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx ? 'border-teal-500 opacity-100 scale-105' : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}