import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ==========================================
// 1. КАСТОМНІ МАРКЕРИ ТА КОНТРОЛЕРИ КАРТИ
// ==========================================

// Маркер-лапка для знайдених/загублених котиків
const customPin = L.divIcon({
  className: 'custom-cat-pin',
  html: `<div style="font-size: 32px; filter: drop-shadow(0px 4px 4px rgba(217, 70, 239, 0.4)); transform: translate(-10px, -15px); cursor: pointer; transition: transform 0.2s;">🐾</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Червоний маркер для вибору місця при створенні
const pickerPin = L.divIcon({
  className: 'picker-pin',
  html: `<div style="font-size: 32px; filter: drop-shadow(0px 4px 4px rgba(239, 68, 68, 0.6)); transform: translate(-10px, -15px);">📍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Допоміжний компонент для кліків по карті (вибір координат)
function MapClickHandler({ selectedPos, setSelectedPos, isPicking }) {
  useMapEvents({
    click(e) {
      if (isPicking) {
        setSelectedPos(e.latlng);
      }
    },
  });
  return selectedPos ? <Marker position={selectedPos} icon={pickerPin} /> : null;
}

// Допоміжний компонент, який змушує карту літати до обраного котика
function MapFlyToController({ flyToPos }) {
  const map = useMap();
  useEffect(() => {
    if (flyToPos) {
      map.flyTo(flyToPos, 16, { animate: true, duration: 1.2 });
    }
  }, [flyToPos, map]);
  return null;
}

// ==========================================
// 2. ГОЛОВНИЙ КОМПОНЕНТ КАРТИ
// ==========================================
export default function ExploreMap({ isLoggedIn, setShowAuthModal }) {
  const [adsList, setAdsList] = useState([]);
  const [showAdForm, setShowAdForm] = useState(false);
  const [newAdData, setNewAdData] = useState({ title: '', description: '', location: '' });

  const [selectedPos, setSelectedPos] = useState(null); // Координати для нового оголошення
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Стейти для зв'язку "Карта <-> Список"
  const [activeAdId, setActiveAdId] = useState(null);
  const [flyToPos, setFlyToPos] = useState(null);
  const markerRefs = useRef({}); // Щоб програмно відкривати попапи на карті
  const mapRef = useRef(null); // Реф на сам блок карти (щоб скролити до нього)

  const BASE_URL = 'https://5fpeo7vj4m.execute-api.eu-north-1.amazonaws.com/Prod';

  // --- ЗАВАНТАЖЕННЯ ДАНИХ ---
  const fetchAds = async () => {
    try {
      const response = await fetch(`${BASE_URL}/reports/`);
      if (!response.ok) throw new Error('Не вдалося завантажити оголошення');
      const data = await response.json();
      const reversedAds = data.sort((a, b) => b.id - a.id);
      setAdsList(reversedAds);
    } catch (error) {
      console.error('Помилка завантаження карти:', error);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  // --- СТВОРЕННЯ ОГОЛОШЕННЯ ---
  const handleAddAd = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return setShowAuthModal(true);
    if (!newAdData.title.trim() || !newAdData.location.trim()) return;

    if (!selectedPos) {
        alert("Мяу! Клікни на карту, щоб поставити мітку 📍");
        return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('title', newAdData.title);
    formData.append('location', newAdData.location);
    if (newAdData.description) formData.append('description', newAdData.description);

    formData.append('latitude', selectedPos.lat.toString());
    formData.append('longitude', selectedPos.lng.toString());

    if (imageFile) formData.append('image', imageFile);

    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      const response = await fetch(`${BASE_URL}/reports/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Помилка сервера');

      setNewAdData({ title: '', description: '', location: '' });
      setSelectedPos(null);
      setImageFile(null);
      setShowAdForm(false);
      fetchAds();

    } catch (error) {
      console.error(error);
      alert('Ой! Не вдалося зберегти оголошення 🐾');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 3. МАГІЯ: ВЗАЄМОДІЯ "КАРТА <-> СПИСОК"
  // ==========================================

  // Коли клікаємо на карточку в списку -> летимо туди на карті
  const handleCardClick = (ad) => {
    if (!ad.latitude || !ad.longitude) return;

    setActiveAdId(ad.id);
    setFlyToPos([ad.latitude, ad.longitude]);

    // Скролимо сторінку вгору до карти
    if (mapRef.current) {
        mapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Даємо карті 1 секунду долетіти, а потім відкриваємо попап-підказку
    setTimeout(() => {
        const marker = markerRefs.current[ad.id];
        if (marker) marker.openPopup();
    }, 1000);
  };

  // Коли клікаємо на лапку на карті -> скролимо вниз до карточки
  const handlePinClick = (ad) => {
      setActiveAdId(ad.id);

      const cardElement = document.getElementById(`ad-card-${ad.id}`);
      if (cardElement) {
          cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-12 mt-4 md:mt-6">

      {/* --- ШАПКА --- */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2 px-4 md:px-0">
        <div className="text-center md:text-left">
          <h2 className="text-3xl font-black text-gray-900">Карта оголошень 🗺️</h2>
          <p className="text-gray-500 mt-1">Допоможи хвостикам знайти дім</p>
        </div>
        <button
          onClick={() => {
            if (!isLoggedIn) return setShowAuthModal(true);
            setShowAdForm(!showAdForm);
            if (showAdForm) setSelectedPos(null);
          }}
          className={`w-full md:w-auto text-white font-bold py-3.5 px-6 rounded-2xl transition-colors shadow-sm flex items-center justify-center gap-2 ${
              showAdForm ? 'bg-gray-800 hover:bg-gray-900' : 'bg-[#d946ef] hover:bg-[#c026d3]'
          }`}
        >
          {showAdForm ? '✕ Скасувати' : '+ Створити оголошення'}
        </button>
      </div>

      {/* ПІДКАЗКА */}
      {showAdForm && !selectedPos && (
          <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-xl text-center font-bold animate-pulse mx-4 md:mx-0">
              👇 Клікни в будь-яке місце на карті, щоб поставити мітку
          </div>
      )}

      {/* --- КАРТА --- */}
      <div
        ref={mapRef} // Реф для скролу до карти
        className={`relative w-full h-[400px] md:h-[450px] rounded-[32px] border-4 overflow-hidden shadow-sm z-0 transition-colors ${showAdForm && !selectedPos ? 'border-blue-400' : 'border-white'}`}
      >
        <MapContainer
            center={[49.8397, 24.0297]}
            zoom={14}
            style={{ height: '100%', width: '100%', cursor: showAdForm ? 'crosshair' : 'grab' }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">Carto</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />

            <MapClickHandler selectedPos={selectedPos} setSelectedPos={setSelectedPos} isPicking={showAdForm} />
            <MapFlyToController flyToPos={flyToPos} />

            {adsList.map(ad => (
                ad.latitude && ad.longitude && (
                    <Marker
                        key={ad.id}
                        position={[ad.latitude, ad.longitude]}
                        icon={customPin}
                        ref={(ref) => { markerRefs.current[ad.id] = ref; }}
                        eventHandlers={{
                            click: () => handlePinClick(ad), // Клік по маркеру!
                        }}
                    >
                        <Popup className="rounded-xl border-none custom-popup">
                            <div className="p-1 min-w-[160px]">
                                {ad.image_url && (
                                    <img src={ad.image_url} alt="cat" className="w-full h-28 object-cover rounded-xl mb-2.5 shadow-sm" />
                                )}
                                <h4 className="font-bold text-[#d946ef] mb-1 text-[15px] leading-tight">{ad.title}</h4>
                                <p className="text-xs text-gray-500 mb-2.5 line-clamp-2">{ad.description}</p>
                                <span className="text-[11px] font-bold bg-[#fdf4ff] text-[#d946ef] px-2.5 py-1 rounded-lg border border-fuchsia-50">
                                    📍 {ad.location}
                                </span>
                            </div>
                        </Popup>
                    </Marker>
                )
            ))}
        </MapContainer>
      </div>

      {/* --- НИЖНЯ ЧАСТИНА --- */}
      <div className="flex flex-col gap-8 px-4 md:px-0">

        {/* ФОРМА СТВОРЕННЯ */}
        {showAdForm && (
          <div className="bg-white p-6 md:p-8 rounded-[32px] shadow-sm border border-gray-100 w-full animate-[bounce-in_0.3s_ease-out]">
            <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-[#d946ef]">📝</span> Деталі хвостика
            </h3>

            <form onSubmit={handleAddAd} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Заголовок</label>
                    <input type="text" placeholder="Напр. Знайдено рудого кота..." required value={newAdData.title} onChange={(e) => setNewAdData({...newAdData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-fuchsia-100 focus:border-[#d946ef] block p-3.5 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Локація (текстом)</label>
                    <input type="text" placeholder="Напр. Стрийський парк" required value={newAdData.location} onChange={(e) => setNewAdData({...newAdData, location: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-fuchsia-100 focus:border-[#d946ef] block p-3.5 outline-none transition-all" />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Опис ситуації</label>
                <textarea placeholder="Опишіть особливі прикмети, нашийник, колір очей..." required rows="3" value={newAdData.description} onChange={(e) => setNewAdData({...newAdData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-fuchsia-100 focus:border-[#d946ef] block p-3.5 outline-none resize-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Фотографія (дуже бажано 📸)</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#fdf4ff] file:text-[#d946ef] hover:file:bg-fuchsia-100 cursor-pointer transition-colors"
                />
              </div>

              <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full md:w-auto px-10 text-white font-bold py-4 rounded-xl transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#d946ef] hover:bg-[#c026d3] shadow-[0_4px_14px_rgba(217,70,239,0.3)] hover:-translate-y-0.5'}`}
                  >
                    {isLoading ? 'Зберігаємо...' : 'Опублікувати на карті'}
                  </button>
              </div>
            </form>
          </div>
        )}

        {/* СПИСОК ОГОЛОШЕНЬ (В ОДНУ КОЛОНКУ) */}
        <div className="w-full space-y-4">
          <h3 className="text-2xl font-black text-gray-900 mb-6">Актуальні оголошення <span className="text-gray-400 font-medium text-xl">({adsList.length})</span></h3>

          {adsList.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-[32px] border border-gray-100">
                <span className="text-4xl block mb-3 opacity-60">🗺️</span>
                <p className="text-gray-500 font-bold text-lg">Поки що тут тихо.</p>
                <p className="text-gray-400 text-sm mt-1">Всі котики зараз вдома 🐾</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
                {/* 🚨 ТУТ ТЕПЕР flex-col ЗАМІСТЬ сітки (в один ряд) */}
                {adsList.map(ad => {
                    const isActive = activeAdId === ad.id;

                    return (
                    <div
                        id={`ad-card-${ad.id}`} // Даємо ID для скролу сюди
                        key={ad.id}
                        onClick={() => handleCardClick(ad)} // Клік на карточку
                        className={`bg-white p-5 rounded-[28px] border flex flex-col sm:flex-row gap-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                            isActive
                            ? 'border-[#d946ef] shadow-[0_4px_20px_rgba(217,70,239,0.15)] ring-4 ring-fuchsia-50'
                            : 'border-gray-100 hover:border-fuchsia-200 shadow-sm'
                        }`}
                    >

                        {/* Зображення */}
                        {ad.image_url ? (
                            <img src={ad.image_url} alt="cat" className="w-full sm:w-[180px] h-[180px] object-cover rounded-[20px] shrink-0" />
                        ) : (
                            <div className="w-full sm:w-[180px] h-[180px] bg-gray-50 rounded-[20px] shrink-0 flex items-center justify-center text-5xl border border-gray-100 text-gray-200">
                                🐾
                            </div>
                        )}

                        {/* Текст */}
                        <div className="flex-1 flex flex-col py-1">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                                <h4 className={`font-black text-xl leading-tight transition-colors ${isActive ? 'text-[#d946ef]' : 'text-gray-900'}`}>
                                    {ad.title}
                                </h4>
                                <span className="text-xs font-bold bg-[#fdf4ff] text-[#d946ef] px-3 py-1.5 rounded-xl flex items-center gap-1 shrink-0 border border-fuchsia-100">
                                    📍 {ad.location}
                                </span>
                            </div>

                            <p className="text-gray-600 leading-relaxed text-[15px] mb-4 line-clamp-3">
                                {ad.description || "Без опису. Клікніть, щоб побачити на карті."}
                            </p>

                            {/* Візуальна підказка, що карточка клікабельна */}
                            <div className="mt-auto flex items-center gap-1 text-[#d946ef] text-sm font-bold opacity-0 sm:opacity-100 transition-opacity">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                Показати на карті
                            </div>
                        </div>

                    </div>
                )})}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}