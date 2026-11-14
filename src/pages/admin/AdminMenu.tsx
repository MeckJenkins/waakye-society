import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  fetchAllMenuItems,
  toggleMenuItemAvailability,
  updateMenuItemImage,
} from '@/services/adminService';
import { uploadMenuImage } from '@/services/menuService';
import type { DatabaseMenuItem } from '@/types/database';

const AdminMenu = () => {
  const [menuItems, setMenuItems] = useState<DatabaseMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const uploadTargetId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadMenu = async () => {
      try {
        const data = await fetchAllMenuItems();
        if (isMounted) {
          setMenuItems(data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load menu:', err);
        if (isMounted) {
          setError('Could not load menu items. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadMenu();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    setUpdatingItemId(itemId);
    setError(null);
    try {
      await toggleMenuItemAvailability(itemId, !currentStatus);
      setMenuItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, is_available: !currentStatus } : item,
        ),
      );
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      setError('Could not update availability. Please try again.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleImageUpload = async (itemId: string, file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Choose a JPG or PNG image.');
      uploadTargetId.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Choose an image smaller than 5 MB.');
      uploadTargetId.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploadingItemId(itemId);
    setError(null);
    try {
      const imageUrl = await uploadMenuImage(file, itemId);
      await updateMenuItemImage(itemId, imageUrl);
      setMenuItems((items) =>
        items.map((item) =>
          item.id === itemId ? { ...item, image_url: imageUrl } : item,
        ),
      );
    } catch (err) {
      console.error('Failed to upload menu image:', err);
      setError(err instanceof Error ? err.message : 'Could not upload image. Please try again.');
    } finally {
      setUploadingItemId(null);
      uploadTargetId.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const refreshMenu = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((key) => key + 1);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pepper"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-waakye-dark">
              Menu Management
            </h1>
            <p className="text-gray-600 mt-2">Manage your menu items and availability</p>
          </div>
          <button
            type="button"
            onClick={refreshMenu}
            disabled={loading}
            className="px-4 py-2 bg-waakye hover:bg-waakye-dark text-white font-semibold rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-pepper/10 p-4 text-pepper" role="alert">
            {error}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          className="sr-only"
          aria-label="Choose a menu image"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            const itemId = uploadTargetId.current;
            if (file && itemId) {
              void handleImageUpload(itemId, file);
            }
          }}
        />

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Image */}
              <div className="group relative h-48 bg-gray-200">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-6xl">🍽️</span>
                  </div>
                )}
                {!item.is_available && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                    <span className="bg-pepper text-white px-4 py-2 rounded-lg font-bold">
                      UNAVAILABLE
                    </span>
                  </div>
                )}
                <div
                  className={`absolute inset-0 z-20 flex items-center justify-center bg-black/40 transition-opacity ${
                    uploadingItemId === item.id
                      ? 'opacity-100'
                      : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                        uploadTargetId.current = item.id;
                        fileInputRef.current.click();
                      }
                    }}
                    disabled={uploadingItemId === item.id || updatingItemId === item.id}
                    aria-label={`Change image for ${item.name}`}
                    aria-busy={uploadingItemId === item.id}
                    className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-waakye-dark shadow-lg transition-colors hover:bg-gray-100 disabled:cursor-wait disabled:opacity-70"
                  >
                    {uploadingItemId === item.id ? (
                      <>
                        <span
                          className="h-4 w-4 animate-spin rounded-full border-2 border-waakye-dark border-t-transparent"
                          aria-hidden="true"
                        />
                        Uploading...
                      </>
                    ) : (
                      '📷 Change Image'
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-waakye-dark">{item.name}</h3>
                  <span className="text-xl font-bold text-pepper">GH₵ {item.price.toFixed(2)}</span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Includes:</p>
                  <div className="flex flex-wrap gap-1">
                    {item.included_items.map((included, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-cream px-2 py-1 rounded text-waakye-dark"
                      >
                        {included}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleAvailability(item.id, item.is_available)}
                  disabled={updatingItemId === item.id || uploadingItemId === item.id}
                  aria-pressed={!item.is_available}
                  aria-busy={updatingItemId === item.id}
                  className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                    item.is_available
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-leaf text-white hover:bg-leaf/90'
                  } disabled:cursor-wait disabled:opacity-60`}
                >
                  {item.is_available ? 'Mark as Unavailable' : 'Mark as Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMenu;