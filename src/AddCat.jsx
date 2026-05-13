import React, { useMemo, useRef, useState } from 'react';
import ImageCropModal from './app/components/ImageCropModal';

export default function AddCat({ onAdded }) {
  const [name, setName] = useState('');
  const [ageValue, setAgeValue] = useState('');
  const [ageUnit, setAgeUnit] = useState('years');
  const [breed, setBreed] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [pendingCropFile, setPendingCropFile] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const BASE_URL = 'https://5fpeo7vj4m.execute-api.eu-north-1.amazonaws.com/Prod';

  const maxAge = useMemo(() => (ageUnit === 'months' ? 12 : 20), [ageUnit]);

  const handleImageSelected = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPendingCropFile(file);
    setShowCropModal(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!imageFile) {
      alert('Please choose a photo first.');
      return;
    }

    const parsedAge = Number(ageValue);
    if (Number.isNaN(parsedAge) || parsedAge < 0 || parsedAge > maxAge) {
      alert(`Age must be between 0 and ${maxAge} ${ageUnit}.`);
      return;
    }

    const token = localStorage.getItem('token')?.replace(/"/g, '');
    if (!token) {
      alert('Log in first to create a post.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', name.trim());
      formData.append('content', breed.trim());
      formData.append('cat_age', String(parsedAge));
      formData.append('cat_age_unit', ageUnit);
      formData.append('image', imageFile);

      const response = await fetch(`${BASE_URL}/posts/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Server could not create the post.');
      }

      alert('Post published successfully.');
      setName('');
      setAgeValue('');
      setAgeUnit('years');
      setBreed('');
      setImageFile(null);
      setPendingCropFile(null);
      onAdded?.();
    } catch (error) {
      console.error(error);
      alert('Could not upload this post right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="oc-addcat-panel bg-white p-8 rounded-[32px] shadow-2xl border border-purple-50">
      <h2 className="text-2xl font-bold text-purple-600 mb-6 text-center">Post a cat</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="oc-addcat-upload flex flex-col items-center justify-center border-2 border-dashed border-purple-100 rounded-2xl p-4 bg-purple-50/30">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelected}
            className="hidden"
          />
          <div className="oc-addcat-file-row flex w-full items-center overflow-hidden rounded-xl border border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="oc-addcat-file-btn shrink-0 px-4 py-2.5 text-sm font-black text-purple-700 bg-purple-100 hover:bg-purple-200"
            >
              Вибір файлу
            </button>
            <p className="oc-addcat-file-name min-w-0 flex-1 px-4 text-sm font-semibold text-gray-500 truncate">
              {imageFile ? imageFile.name : 'Файл не вибрано'}
            </p>
          </div>
          {imageFile && (
            <div className="mt-3 flex w-full items-center justify-between gap-3">
              <p className="oc-addcat-selected text-xs text-purple-600 font-medium truncate">
                Selected: {imageFile.name}
              </p>
              <button
                type="button"
                onClick={() => {
                  setPendingCropFile(imageFile);
                  setShowCropModal(true);
                }}
                className="rounded-xl bg-white px-3 py-1.5 text-xs font-black text-[#d946ef] border border-fuchsia-100 hover:bg-fuchsia-50"
              >
                Crop (optional)
              </button>
            </div>
          )}
        </div>

        <input
          placeholder="Cat name"
          className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <div className="oc-addcat-age-panel rounded-2xl border border-fuchsia-100 bg-fuchsia-50/50 p-3">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-500">Age unit</p>
          <div className="inline-flex rounded-xl bg-white p-1 border border-fuchsia-100">
            <button
              type="button"
              onClick={() => setAgeUnit('months')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg ${
                ageUnit === 'months' ? 'bg-[#d946ef] text-white' : 'text-gray-500 hover:text-[#d946ef]'
              }`}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setAgeUnit('years')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg ${
                ageUnit === 'years' ? 'bg-[#d946ef] text-white' : 'text-gray-500 hover:text-[#d946ef]'
              }`}
            >
              Year
            </button>
          </div>

          <div className="mt-3">
            <input
              placeholder={`Age in ${ageUnit} (max ${maxAge})`}
              type="number"
              min={0}
              max={maxAge}
              className="w-full p-4 bg-white rounded-2xl outline-none border border-gray-200 focus:ring-2 focus:ring-purple-500 transition"
              value={ageValue}
              onChange={(event) => setAgeValue(event.target.value)}
              required
            />
          </div>
        </div>

        <input
          placeholder="Breed or short description"
          className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 transition"
          value={breed}
          onChange={(event) => setBreed(event.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-95 ${
            loading ? 'bg-gray-300' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-100'
          }`}
        >
          {loading ? 'Uploading...' : 'Save and publish'}
        </button>
      </form>

      <ImageCropModal
        isOpen={showCropModal}
        file={pendingCropFile}
        title="Crop post photo"
        aspect={1}
        shape="square"
        onCancel={() => setShowCropModal(false)}
        onApply={(croppedFile) => {
          setImageFile(croppedFile);
          setPendingCropFile(croppedFile);
          setShowCropModal(false);
        }}
      />
    </div>
  );
}
