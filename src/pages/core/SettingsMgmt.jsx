import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { API_BASE, settings as settingsApi } from '../../api';
import { getImageUrl, showToast } from '../../components/utils';
import { coreLinks } from './Dashboard';
import { Store, Clock } from 'lucide-react';

export default function SettingsMgmt() {
  const [formData, setFormData] = useState({
    store_name: 'Muma Cibubur',
    store_hours: 'Buka • 10:00 - 22:00',
    hero_title_1: 'Makan Malam',
    hero_title_2: 'Lebih Nikmat',
    hero_subtitle: 'Pesan ramen autentik Jepang favoritmu dengan mudah. Cepat, hangat, dan memuaskan.',
    promo_badge: 'PROMO',
    promo_text: 'Diskon 20% Dine-In',
    promo_image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=600',
    promo_image_file: null
  });
  const [promoImagePreview, setPromoImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsApi.get();
      setFormData({
        store_name: res.store_name || 'Muma Cibubur',
        store_hours: res.store_hours || 'Buka • 10:00 - 22:00',
        hero_title_1: res.hero_title_1 || 'Makan Malam',
        hero_title_2: res.hero_title_2 || 'Lebih Nikmat',
        hero_subtitle: res.hero_subtitle || 'Pesan ramen autentik Jepang favoritmu dengan mudah. Cepat, hangat, dan memuaskan.',
        promo_badge: res.promo_badge || 'PROMO',
        promo_text: res.promo_text || 'Diskon 20% Dine-In',
        promo_image: res.promo_image || 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&q=80&w=600'
      });
    } catch (err) {
      showToast('Gagal memuat pengaturan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Create a payload without the file object
      const payload = { ...formData };
      delete payload.promo_image_file;
      await settingsApi.update(payload);

      // Upload image if selected
      if (formData.promo_image_file) {
        const fileData = new FormData();
        fileData.append('key', 'promo_image');
        fileData.append('image', formData.promo_image_file);
        const res = await settingsApi.uploadImage(fileData);
        // Update form state with new image URL
        setFormData(prev => ({ ...prev, promo_image: res.url, promo_image_file: null }));
        if (promoImagePreview) URL.revokeObjectURL(promoImagePreview);
        setPromoImagePreview(null);
      }

      showToast('Pengaturan toko berhasil disimpan!', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan pengaturan', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Pengaturan Toko" links={coreLinks}>
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="max-w-2xl">
          <div className="glass p-8 rounded-2xl border border-border shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-text flex items-center gap-2">
              <Store className="text-primary" size={24} />
              Informasi Cabang
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2 uppercase tracking-wide">
                  Nama Cabang / Toko
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Store size={18} className="text-text-muted/50" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                    placeholder="Contoh: Muma Cibubur"
                  />
                </div>
                <p className="mt-2 text-xs text-text-muted">Nama ini akan ditampilkan pada kartu lokasi di halaman pemesanan utama.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-muted mb-2 uppercase tracking-wide">
                  Jam Operasional
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Clock size={18} className="text-text-muted/50" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.store_hours}
                    onChange={(e) => setFormData({ ...formData, store_hours: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                    placeholder="Contoh: Buka • 10:00 - 22:00"
                  />
                </div>
                <p className="mt-2 text-xs text-text-muted">Informasi jam buka/tutup yang akan terlihat oleh pelanggan.</p>
              </div>

              <div className="pt-6 mt-8 border-t border-border">
                <h2 className="text-xl font-bold mb-6 text-text flex items-center gap-2">
                  <span className="text-primary">#</span> Teks Utama (Hero)
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-text-muted mb-2 uppercase tracking-wide">Teks Utama Baris 1</label>
                      <input
                        type="text" required
                        value={formData.hero_title_1}
                        onChange={(e) => setFormData({ ...formData, hero_title_1: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-muted mb-2 uppercase tracking-wide">Teks Utama Baris 2 (Warna Primary)</label>
                      <input
                        type="text" required
                        value={formData.hero_title_2}
                        onChange={(e) => setFormData({ ...formData, hero_title_2: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2 uppercase tracking-wide">Sub-teks (Deskripsi)</label>
                    <textarea
                      required rows={2}
                      value={formData.hero_subtitle}
                      onChange={(e) => setFormData({ ...formData, hero_subtitle: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-8 border-t border-border">
                <h2 className="text-xl font-bold mb-6 text-text flex items-center gap-2">
                  <span className="text-primary">%</span> Spanduk Promo
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-text-muted mb-2 uppercase tracking-wide">Teks Badge / Label</label>
                      <input
                        type="text" required
                        value={formData.promo_badge}
                        onChange={(e) => setFormData({ ...formData, promo_badge: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                        placeholder="Contoh: PROMO"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-text-muted mb-2 uppercase tracking-wide">Teks Promo (Besar)</label>
                      <input
                        type="text" required
                        value={formData.promo_text}
                        onChange={(e) => setFormData({ ...formData, promo_text: e.target.value })}
                        className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
                        placeholder="Contoh: Diskon 20% Dine-In"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-text-muted mb-2 uppercase tracking-wide">Gambar Background Promo</label>
                    <div className="relative group rounded-xl overflow-hidden bg-surface-hover border border-border/50 hover:border-primary/50 transition mb-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          setFormData({ ...formData, promo_image_file: file });
                          if (promoImagePreview) URL.revokeObjectURL(promoImagePreview);
                          setPromoImagePreview(file ? URL.createObjectURL(file) : null);
                        }}
                        className="w-full text-sm text-text-muted file:mr-4 file:py-3.5 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                      />
                    </div>
                    
                    {/* Image Preview */}
                    {(promoImagePreview || formData.promo_image) && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border mt-2">
                        <img 
                          src={promoImagePreview || getImageUrl(formData.promo_image)} 
                          alt="Promo Preview" 
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="absolute inset-0 p-4 flex flex-col justify-end">
                          <span className="text-[10px] font-bold bg-primary text-background px-2 py-0.5 rounded w-fit mb-1">{formData.promo_badge}</span>
                          <h3 className="font-bold text-sm text-white drop-shadow-md">{formData.promo_text}</h3>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-8 border-t border-border">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(231,123,38,0.39)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Pengaturan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
