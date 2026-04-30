import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Кастомний маркер-лапка
const customPin = L.divIcon({
  className: 'custom-cat-pin',
  html: `<div style="font-size: 32px; filter: drop-shadow(0px 4px 4px rgba(191, 4, 255, 0.4)); transform: translate(-10px, -15px); cursor: pointer; transition: transform 0.2s;">🐾</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

export default function ExploreMap({ isLoggedIn, setShowAuthModal }) {
  // Стейти для оголошень
  const [adsList, setAdsList] = useState([
    { id: 1, title: 'Знайдено рудого кота', description: 'Сидить біля під\'їзду, дуже ласкавий.', location: 'вул. Шевченка, 12', lat: 49.8429, lng: 24.0311 },
    { id: 2, title: 'Шукаю британця', description: 'Загубився вчора ввечері, відгукується на Том.', location: 'Парк Франка', lat: 49.8406, lng: 24.0189 }
  ]);
  const [showAdForm, setShowAdForm] = useState(false);
  const [newAdData, setNewAdData] = useState({ title: '', description: '', location: '' });

  // Додавання оголошення
  const handleAddAd = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setShowAuthModal(true);
      return;
    }
    if (!newAdData.title.trim() || !newAdData.description.trim()) return;

    // Створюємо рандомні координати поруч із центром Львова, щоб пін з'явився на карті
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
    <div className="w-full max-w-4xl flex flex-col gap-6 pb-12 mt-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Карта оголошень 🗺️</h2>
          <p className="text-gray-500 mt-1">Знайдіть улюбленця або допоможіть іншим</p>
        </div>
        <button
          onClick={() => {
            if (!isLoggedIn) {
              setShowAuthModal(true);
              return;
            }
            setShowAdForm(!showAdForm);
          }}
          className="w-full md:w-auto bg-[#bf04ff] hover:bg-[#a103d8] text-white font-bold py-3 px-6 rounded-2xl transition-colors shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
        >
          {showAdForm ? 'Скасувати створення' : '+ Створити оголошення'}
        </button>
      </div>

      {/* КАРТА */}
      <div className="relative w-full h-[400px] rounded-[32px] border-4 border-white overflow-hidden shadow-lg mb-2 z-0">
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
                        <Popup className="rounded-xl">
                            <div className="p-1 min-w-[150px]">
                                <h4 className="font-bold text-[#bf04ff] mb-1">{ad.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">{ad.description}</p>
                                <span className="text-xs font-bold bg-purple-50 text-[#bf04ff] px-2 py-1 rounded-lg">
                                    📍 {ad.location}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                )
            ))}
        </MapContainer>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ФОРМА */}
        {showAdForm && (
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 w-full lg:w-1/3 animate-[bounce-in_0.3s_ease-out] shrink-0">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-[#bf04ff]">📝</span> Нове оголошення
            </h3>
            <form onSubmit={handleAddAd} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Заголовок</label>
                <input type="text" placeholder="Знайдено рудого кота..." required value={newAdData.title} onChange={(e) => setNewAdData({...newAdData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block p-3.5 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Локація</label>
                <input type="text" placeholder="Вул. Степана Бандери, 12" required value={newAdData.location} onChange={(e) => setNewAdData({...newAdData, location: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block p-3.5 outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Опис ситуації</label>
                <textarea placeholder="Опишіть деталі, особливі прикмети..." required rows="4" value={newAdData.description} onChange={(e) => setNewAdData({...newAdData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block p-3.5 outline-none resize-none" />
              </div>
              <button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-colors shadow-lg mt-2">
                Опублікувати на карті
              </button>
            </form>
          </div>
        )}

        {/* СПИСОК ОГОЛОШЕНЬ */}
        <div className="flex-1 w-full space-y-4">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Актуальні оголошення <span className="text-gray-400 font-medium text-lg">({adsList.length})</span></h3>
          {adsList.length === 0 ? (
            <p className="text-gray-500 text-center py-8 bg-white rounded-[32px] border border-gray-100">Немає активних оголошень.</p>
          ) : (
            adsList.map(ad => (
              <div key={ad.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                  <h4 className="font-bold text-xl text-gray-900">{ad.title}</h4>
                  <span className="text-sm font-bold bg-[#fdf4ff] text-[#bf04ff] px-3 py-1.5 rounded-full flex items-center gap-1 border border-purple-100 shrink-0">
                    📍 {ad.location}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">{ad.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}