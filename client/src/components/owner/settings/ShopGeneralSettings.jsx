import React from 'react';
import { Store, Clock, MapPin, Navigation, ExternalLink, Save } from 'lucide-react';

export const ShopGeneralSettings = ({
  formData,
  setFormData,
  handleSave,
  saving,
  isDeactivatedByAdmin,
  handleDetectLocation,
  gettingLocation,
  shop
}) => {
  const googleMapsSearchUrl =
    formData.latitude && formData.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${formData.latitude},${formData.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          (formData.name || shop?.name || '') + ' ' + (formData.address || '') + ' ' + (formData.city || '')
        )}`;

  return (
    <form
      onSubmit={handleSave}
      className="bg-white p-5 sm:p-7 rounded-3xl shadow-card border border-zinc-200/80 space-y-6 animate-fade-in"
    >
      <div className="border-b border-zinc-100 pb-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Store className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-black text-zinc-900 tracking-tight">
            Shop Basic Information & Timings
          </h3>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Shop address, contact details, operating hours & GPS coordinates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
            Shop Name
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            disabled={isDeactivatedByAdmin}
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
            Shop Public Phone
          </label>
          <input
            type="tel"
            maxLength={10}
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
            }
            disabled={isDeactivatedByAdmin}
            placeholder="10-digit shop phone"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
          Description / Tagline
        </label>
        <textarea
          rows="3"
          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={isDeactivatedByAdmin}
          placeholder="Tell customers about your services, atmosphere and grooming expertise..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
            Full Street Address
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            disabled={isDeactivatedByAdmin}
            required
          />
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
            City
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
            value={formData.city}
            onChange={(e) =>
              setFormData({ ...formData, city: e.target.value })
            }
            disabled={isDeactivatedByAdmin}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
            Landmark / Area
          </label>
          <input
            type="text"
            placeholder="e.g. Opposite City Mall, 2nd Floor"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
            value={formData.landmark}
            onChange={(e) =>
              setFormData({ ...formData, landmark: e.target.value })
            }
            disabled={isDeactivatedByAdmin}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
            Pincode
          </label>
          <input
            type="text"
            placeholder="e.g. 452001"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
            value={formData.pincode}
            onChange={(e) =>
              setFormData({ ...formData, pincode: e.target.value })
            }
            disabled={isDeactivatedByAdmin}
          />
        </div>
      </div>

      {/* Operating Hours */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            Opening Time
          </label>
          <input
            type="text"
            placeholder="e.g. 09:00 AM"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
            value={formData.openingTime}
            onChange={(e) =>
              setFormData({ ...formData, openingTime: e.target.value })
            }
            disabled={isDeactivatedByAdmin}
            required
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            Closing Time
          </label>
          <input
            type="text"
            placeholder="e.g. 09:00 PM"
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
            value={formData.closingTime}
            onChange={(e) =>
              setFormData({ ...formData, closingTime: e.target.value })
            }
            disabled={isDeactivatedByAdmin}
            required
          />
        </div>
      </div>

      {/* Store Location & Google Maps Section */}
      <div className="pt-5 border-t border-zinc-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-600" />
              Store Location & GPS Coordinates
            </h4>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Coordinates provide turn-by-turn navigation for customers directly in Google Maps
            </p>
          </div>
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={gettingLocation || isDeactivatedByAdmin}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
          >
            <Navigation
              className={`w-3.5 h-3.5 text-indigo-600 ${gettingLocation ? 'animate-spin' : ''}`}
            />
            {gettingLocation ? 'Capturing GPS...' : '📍 Use My Current Location'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
              Latitude (GPS)
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 22.719568"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
              value={formData.latitude}
              onChange={(e) =>
                setFormData({ ...formData, latitude: e.target.value })
              }
              disabled={isDeactivatedByAdmin}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
              Longitude (GPS)
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 75.857727"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
              value={formData.longitude}
              onChange={(e) =>
                setFormData({ ...formData, longitude: e.target.value })
              }
              disabled={isDeactivatedByAdmin}
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 block mb-1">
            Custom Google Maps Share Link (Optional)
          </label>
          <input
            type="url"
            placeholder="e.g. https://maps.app.goo.gl/..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/70 text-xs sm:text-sm font-medium focus:outline-none focus:border-zinc-400 focus:bg-white transition-all disabled:opacity-50"
            value={formData.googleMapsUrl}
            onChange={(e) =>
              setFormData({ ...formData, googleMapsUrl: e.target.value })
            }
            disabled={isDeactivatedByAdmin}
          />
        </div>

        <div className="flex items-center justify-between bg-zinc-50/80 p-3.5 rounded-2xl border border-zinc-200/70 text-xs">
          <span className="text-zinc-500 font-medium">
            Verify Google Maps navigation link:
          </span>
          <a
            href={formData.googleMapsUrl || googleMapsSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-100 flex justify-end">
        <button
          type="submit"
          disabled={saving || isDeactivatedByAdmin}
          className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Changes...' : 'Save General Info'}
        </button>
      </div>
    </form>
  );
};
