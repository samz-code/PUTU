import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/PageHeader';
import { 
  Plus, X, Pencil, Trash2, Image as ImageIcon, ChevronLeft, 
  ChevronRight, Users, DollarSign, Wifi, Tv, Coffee, Maximize2 
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

export default function HotelRooms() {
  const { user } = useAuth();
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('2');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);

  // Carousel/Lightbox Modal State
  const [selectedRoomImages, setSelectedRoomImages] = useState<string[] | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('hotels')
      .select('id')
      .eq('partner_user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setHotelId(data.id);
      });
  }, [user]);

  const loadRooms = async () => {
    if (!hotelId) return;
    setLoading(true);
    const { data } = await supabase
      .from('hotel_rooms')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });

    setRooms((data as Room[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadRooms();
  }, [hotelId]);

  const handleAddImageUrl = () => setImageUrls([...imageUrls, '']);
  const handleRemoveImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };
  const handleImageUrlChange = (index: number, val: string) => {
    const updated = [...imageUrls];
    updated[index] = val;
    setImageUrls(updated);
  };

  const openForm = (room?: Room) => {
    if (room) {
      setEditId(room.id);
      setName(room.name);
      setCapacity(String(room.capacity));
      setPrice(String(room.price_per_night || ''));
      setDescription(room.description || '');
      setAmenities(room.amenities ? room.amenities.join(', ') : '');
      setImageUrls(room.images && room.images.length > 0 ? room.images : ['']);
    } else {
      setEditId(null);
      setName('');
      setCapacity('2');
      setPrice('');
      setDescription('');
      setAmenities('');
      setImageUrls(['']);
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;

    const payload = {
      hotel_id: hotelId,
      name,
      capacity: Number(capacity),
      price_per_night: price ? Number(price) : 0,
      description,
      amenities: amenities.split(',').map((s) => s.trim()).filter(Boolean),
      images: imageUrls.map((url) => url.trim()).filter(Boolean),
    };

    if (editId) {
      await supabase.from('hotel_rooms').update(payload).eq('id', editId);
    } else {
      await supabase.from('hotel_rooms').insert(payload);
    }

    setShowForm(false);
    loadRooms();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this room?')) {
      await supabase.from('hotel_rooms').delete().eq('id', id);
      loadRooms();
    }
  };

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

      {/* FORM MODAL / CARD */}
      {showForm && (
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
              <input type="number" className="input" required value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div>
              <label className="label text-xs font-semibold">Price per Night ($)</label>
              <input type="number" className="input" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="250" />
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

          {/* DYNAMIC IMAGE URL LIST */}
          <div className="space-y-2">
            <label className="label text-xs font-semibold">Room Image Gallery URLs</label>
            {imageUrls.map((url, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  className="input text-xs flex-1"
                  value={url}
                  onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                />
                {imageUrls.length > 1 && (
                  <button type="button" onClick={() => handleRemoveImageUrl(idx)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddImageUrl} className="text-xs text-teal-600 font-semibold hover:underline flex items-center gap-1 mt-1">
              <Plus size={14} /> Add another image URL
            </button>
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs">Cancel</button>
            <button type="submit" className="btn-primary text-xs">Save Room Details</button>
          </div>
        </form>
      )}

      {/* ROOM LIST GRID */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading rooms...</div>
      ) : rooms.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 text-sm">No rooms added yet. Click "Add New Room" to populate your catalog.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((r) => {
            const hasImages = r.images && r.images.length > 0;
            const mainImg = hasImages ? r.images[0] : 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80';

            return (
              <div key={r.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  {/* MAIN PREVIEW IMAGE */}
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
                      <span className="text-teal-600 font-bold text-base">${r.price_per_night}<span className="text-2xs text-slate-400 font-normal">/night</span></span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1"><Users size={14} /> Max {r.capacity} Guests</span>
                    </div>

                    {r.description && <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">{r.description}</p>}

                    {/* AMENITIES BADGES */}
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
                  <button onClick={() => openForm(r)} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
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

            {/* THUMBNAILS BAR */}
            <div className="p-4 bg-slate-900 w-full flex justify-center gap-2 overflow-x-auto">
              {selectedRoomImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
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