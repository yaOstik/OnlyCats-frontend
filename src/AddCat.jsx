import React, { useState } from 'react';

// Firebase нам більше не потрібен, тому ми прибрали його імпорти!

export default function AddCat({ onAdded }) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [breed, setBreed] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Вказуємо адресу вашого бекенду для постів
  const ENDPOINT_CREATE_POST = 'https://7fy5ddq0g2.execute-api.eu-north-1.amazonaws.com/Prod/posts/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Будь ласка, обери фото!");

    setLoading(true);
    try {
      // 1. Створюємо об'єкт FormData (це як віртуальна посилка для файлів та тексту)
      const formData = new FormData();

      // 2. Пакуємо дані так, як цього очікує FastAPI:
      // - title (передаємо ім'я)
      formData.append('title', name);
      // - content (об'єднуємо вік та опис)
      formData.append('content', `${age} р. ${breed}`);
      // - image (сам файл фотографії)
      formData.append('image', imageFile);

      // 3. Відправляємо запит на НАШ бекенд
      const response = await fetch(ENDPOINT_CREATE_POST, {
        method: 'POST',
        body: formData,
        // Важливо: при відправці FormData НЕ треба вказувати 'Content-Type'.
        // Браузер сам зрозуміє, що це файл, і поставить правильні заголовки.
      });

      if (!response.ok) {
        throw new Error('Помилка сервера при створенні поста');
      }

      alert("Котика успішно виставлено! 🐾");

      // Очищаємо форму
      setName('');
      setAge('');
      setBreed('');
      setImageFile(null);

      // Викликаємо функцію, щоб повернутися на головну сторінку
      if (onAdded) onAdded();

    } catch (error) {
      console.error("Помилка:", error);
      alert("Щось пішло не так при завантаженні.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-purple-50">
      <h2 className="text-2xl font-bold text-purple-600 mb-6 text-center">Виставити котика 🐈</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Поле для вибору фото */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-purple-100 rounded-2xl p-4 bg-purple-50/30">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0])}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
          />
          {imageFile && <p className="mt-2 text-xs text-purple-600 font-medium">Обрано: {imageFile.name}</p>}
        </div>

        <input
            placeholder="Ім'я котика"
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition"
            value={name}
            onChange={e => setName(e.target.value)}
            required
        />
        <input
            placeholder="Вік (років)"
            type="number"
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition"
            value={age}
            onChange={e => setAge(e.target.value)}
            required
        />
        <input
            placeholder="Порода або короткий опис"
            className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition"
            value={breed}
            onChange={e => setBreed(e.target.value)}
            required
        />
        
        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 ${loading ? 'bg-gray-300' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-100'}`}
        >
          {loading ? 'Завантаження...' : 'Зберегти та виставити'}
        </button>
      </form>
    </div>
  );
}