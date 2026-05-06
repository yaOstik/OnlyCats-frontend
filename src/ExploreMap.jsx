import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customPin = L.divIcon({
  className: 'custom-cat-pin',
  html: `<div style="font-size: 32px; filter: drop-shadow(0px 4px 4px rgba(217, 70, 239, 0.4)); transform: translate(-10px, -15px); cursor: pointer; transition: transform 0.2s;">🐾</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

export default function ExploreMap({ isLoggedIn, setShowAuthModal }) {
  const [adsList, setAdsList] = useState([
    { id: 1, title: 'Found a ginger cat', description: 'Sitting near the entrance, very affectionate.', location: 'Shevchenko str, 12', lat: 49.8429, lng: 24.0311 },
    { id: 2, title: 'Looking for British Shorthair', description: 'Got lost yesterday evening, answers to Tom.', location: 'Franko Park', lat: 49.8406, lng: 24.0189 }
  ]);
  const [showAdForm, setShowAdForm] = useState(false);
  const [newAdData, setNewAdData] = useState({ title: '', description: '', location: '' });

  const handleAddAd = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    if (!newAdData.title.trim() || !newAdData.description.trim()) return;

    const randomLat = 49.8397 + (Math.random() - 0.5) * 0.02;
    const randomLng = 24.0297 + (Math.random() - 0.5) * 0.02;

    setAdsList([{
        id: Date.now(),
        ...newAdData,
        lat: randomLat,
        lng: randomLng
    }, ...adsList]);

    setNewAdData({ title: '', description: '', location: '' });
    setShowAdForm(false);
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-12 mt-4 md:mt-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2 md:mb-4 px-4 md:px-0">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-black text-gray-900">Explore Map 🗺️</h2>
          <p className="text-gray-500 mt-1">Find a pet or help others</p>
        </div>
        <button
          onClick={() => {
            if (!isLoggedIn) {
              setShowAuthModal(true);
              return;
            }
            setShowAdForm(!showAdForm);
          }}
          className="w-full md:w-auto bg-[#d946ef] hover:bg-[#c026d3] text-white font-bold py-3 px-6 rounded-2xl transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {showAdForm ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      <div className="relative w-full h-[350px] md:h-[400px] rounded-[24px] border-4 border-white overflow-hidden shadow-sm z-0">
        <MapContainer
            center={[49.8397, 24.0297]}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">Carto</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {adsList.map(ad => (
                ad.lat && ad.lng && (
                    <Marker key={ad.id} position={[ad.lat, ad.lng]} icon={customPin}>
                        <Popup className="rounded-xl border-none">
                            <div className="p-1 min-w-[150px]">
                                <h4 className="font-bold text-[#d946ef] mb-1 text-[15px]">{ad.title}</h4>
                                <p className="text-sm text-gray-600 mb-2 leading-tight">{ad.description}</p>
                                <span className="text-xs font-bold bg-[#fdf4ff] text-[#d946ef] px-2 py-1 rounded-lg">
                                    📍 {ad.location}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                )
            ))}
        </MapContainer>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start px-4 md:px-0">
        {showAdForm && (
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 w-full lg:w-1/3 animate-[bounce-in_0.3s_ease-out] shrink-0">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-[#d946ef]">📝</span> New Alert
            </h3>
            <form onSubmit={handleAddAd} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Title</label>
                <input type="text" placeholder="e.g. Found a fluffy cat..." required value={newAdData.title} onChange={(e) => setNewAdData({...newAdData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#d946ef] focus:border-[#d946ef] block p-3 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Location</label>
                <input type="text" placeholder="Street, City" required value={newAdData.location} onChange={(e) => setNewAdData({...newAdData, location: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#d946ef] focus:border-[#d946ef] block p-3 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea placeholder="Describe details, special marks..." required rows="4" value={newAdData.description} onChange={(e) => setNewAdData({...newAdData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#d946ef] focus:border-[#d946ef] block p-3 outline-none resize-none" />
              </div>
              <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors mt-2">
                Post on Map
              </button>
            </form>
          </div>
        )}

        <div className="flex-1 w-full space-y-4">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Active Alerts <span className="text-gray-400 font-medium text-lg">({adsList.length})</span></h3>
          {adsList.length === 0 ? (
            <p className="text-gray-500 text-center py-8 bg-white rounded-[24px] border border-gray-100">No active alerts.</p>
          ) : (
            adsList.map(ad => (
              <div key={ad.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                  <h4 className="font-bold text-xl text-gray-900">{ad.title}</h4>
                  <span className="text-sm font-bold bg-[#fdf4ff] text-[#d946ef] px-3 py-1.5 rounded-full flex items-center gap-1 shrink-0">
                    📍 {ad.location}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed text-[15px]">{ad.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}