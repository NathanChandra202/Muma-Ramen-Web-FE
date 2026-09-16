import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { settings as settingsApi } from '../../api';
import { showToast } from '../../components/utils';
import { coreLinks } from './Dashboard';
import { Store, Clock } from 'lucide-react';

export default function SettingsMgmt() {
  const [formData, setFormData] = useState({
    store_name: 'Muma Cibubur',
    store_hours: 'Buka • 10:00 - 22:00'
  });
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
        store_hours: res.store_hours || 'Buka • 10:00 - 22:00'
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
      await settingsApi.update(formData);
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

              <div className="pt-4 mt-8 border-t border-border">
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
