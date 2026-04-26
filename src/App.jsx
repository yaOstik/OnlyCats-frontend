import React, { useState, useEffect } from 'react'; // Виправлено імпорт
import Ads from './Ads';
import AddCat from './AddCat';

export default function App() { // Відкриваємо дужку тут
  const [activeTab, setActiveTab] = useState('home');
  // ... весь інший код стейтів та функцій ...
  const [authMode, setAuthMode] = useState('login');

  // --- СТЕЙТИ ДЛЯ АВТОРИЗАЦІЇ ---
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // --- СТЕЙТИ ДЛЯ ПЛАШОК ТА СЮРПРИЗІВ ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSurprise, setShowSurprise] = useState(false);

  const BASE_URL = 'https://7fy5ddq0g2.execute-api.eu-north-1.amazonaws.com/Prod';

  // --- ФУНКЦІЇ АВТОРИЗАЦІЇ ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? `${BASE_URL}/login` : `${BASE_URL}/register`;
    const payload = authMode === 'login'
        ? { email: authEmail, password: authPassword }
        : { username: authName, email: authEmail, password: authPassword };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Неправильні дані або користувач вже існує');
      }

      const data = await response.json();

      if (data.access_token) {
          localStorage.setItem('token', data.access_token);
      } else {
          localStorage.setItem('token', JSON.stringify(data));
      }

      setIsLoggedIn(true);

      // ПЕРЕВІРКА НА ПОШТУ КОХАНОЇ (Сюрприз без музики)
      if (authMode === 'login' && authEmail.toLowerCase() === 'kateryna.peleshchyshyn@gmail.com') {
          setShowSurprise(true);
          setAuthEmail(''); setAuthPassword(''); setAuthName('');
      } else {
          alert(authMode === 'login' ? 'Ви успішно увійшли! 🐾' : 'Реєстрація успішна! 🐾');
          setAuthEmail(''); setAuthPassword(''); setAuthName('');
          setActiveTab('home');
      }

    } catch (error) {
      console.error('Auth error:', error);
      alert(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('liked_current_cat');
    setHasLiked(false);
    setIsLoggedIn(false);
    setActiveTab('home');
    window.location.reload();
  };

  // --- СТАН ДЛЯ ЛАЙКІВ ---
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  const CAT_ID = 1;
  const ENDPOINT_GET_LIKES = `${BASE_URL}/likes/${CAT_ID}`;
  const ENDPOINT_POST_LIKE = `${BASE_URL}/likes/`;
  const ENDPOINT_DELETE_LIKE = `${BASE_URL}/likes/${CAT_ID}`;

  // --- ЗАВАНТАЖЕННЯ ЛАЙКІВ ---
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(ENDPOINT_GET_LIKES, { headers });

        if (!response.ok) {
            setLikes(0);
            return;
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            setLikes(data.length);
        } else if (data !== undefined && data !== null) {
          let newLikes = 0;
          if (typeof data === 'number') newLikes = data;
          else if (data.likes_count !== undefined) newLikes = Number(data.likes_count);
          else if (data.likes !== undefined) newLikes = Number(data.likes);
          else newLikes = Number(data);
          setLikes(isNaN(newLikes) ? 0 : newLikes);
        }
      } catch (error) {
        console.error('Помилка завантаження лайків:', error);
        setLikes(0);
      }
    };

    fetchLikes();

    const alreadyLiked = localStorage.getItem('liked_current_cat') === 'true';
    if (alreadyLiked) {
      setHasLiked(true);
    }
  }, []);

  // --- ГОЛОВНА ФУНКЦІЯ ЛАЙКУ ---
  const handleLike = async () => {
    // ЗАХИСТ ВІД НЕАВТОРИЗОВАНИХ
    if (!isLoggedIn) {
        setShowAuthModal(true);
        return;
    }

    const isLikingNow = !hasLiked;
    setHasLiked(isLikingNow);
    setLikes(prev => isLikingNow ? prev + 1 : Math.max(0, prev - 1));

    if (isLikingNow) localStorage.setItem('liked_current_cat', 'true');
    else localStorage.removeItem('liked_current_cat');

    try {
      let response;
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };

      if (token) {
          headers['Authorization'] = `Bearer ${token}`;
      }

      if (isLikingNow) {
        response = await fetch(ENDPOINT_POST_LIKE, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ post_id: CAT_ID }),
        });
      } else {
        response = await fetch(ENDPOINT_DELETE_LIKE, {
            method: 'DELETE',
            headers: headers
        });
      }

      if (!response.ok) throw new Error('Помилка сервера при збереженні лайку');

    } catch (error) {
      console.error('Не вдалося відправити лайк на сервер:', error);
      alert('Не вдалося зберегти лайк на сервері. Перевірте з\'єднання.');
      setHasLiked(!isLikingNow);
      setLikes(prev => !isLikingNow ? prev + 1 : Math.max(0, prev - 1));

      if (!isLikingNow) localStorage.setItem('liked_current_cat', 'true');
      else localStorage.removeItem('liked_current_cat');
    }
  };

  // --- СТАН ДЛЯ КОМЕНТАРІВ ---
  const [comments, setComments] = useState([
    { id: 1, text: "Який милий пухнастик! 😍", author: "Олена", isMine: false },
    { id: 2, text: "Обожнюю рудих котів, просто супер.", author: "Максим", isMine: false }
  ]);

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  // --- ФУНКЦІЇ ДЛЯ КОМЕНТАРІВ ---
  const handleAddComment = (e) => {
    e.preventDefault();

    // ЗАХИСТ ВІД НЕАВТОРИЗОВАНИХ
    if (!isLoggedIn) {
        setShowAuthModal(true);
        return;
    }

    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      text: newComment,
      author: "Ви",
      isMine: true
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleDeleteComment = (id) => {
    if (window.confirm("Ви точно хочете видалити цей коментар?")) {
      setComments(comments.filter(c => c.id !== id));
    }
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  const handleSaveEdit = () => {
    if (!editCommentText.trim()) return;

    setComments(comments.map(c =>
      c.id === editingCommentId ? { ...c, text: editCommentText } : c
    ));

    setEditingCommentId(null);
    setEditCommentText('');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditCommentText('');
  };

  // --- СТАН ТА ФУНКЦІЇ ДЛЯ ОГОЛОШЕНЬ ТА КАРТИ ---
  const [adsList, setAdsList] = useState([
    { id: 1, title: 'Знайдено рудого кота', description: 'Сидить біля під\'їзду, дуже ласкавий. На вигляд домашній.', location: 'вул. Шевченка, 12' },
    { id: 2, title: 'Шукаю британця', description: 'Загубився вчора ввечері, відгукується на ім\'я Том.', location: 'Парк Франка' }
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

    setAdsList([{ id: Date.now(), ...newAdData }, ...adsList]);
    setNewAdData({ title: '', description: '', location: '' });
    setShowAdForm(false);
  };

  return (
    <div className="flex h-screen bg-[#f4f4f5] font-sans relative">

        {/* БІЧНА ПАНЕЛЬ (Sidebar) */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0">
            {/* Логотип */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-4 border-[#bf04ff] flex items-center justify-center">
                    <div className="w-3 h-3 bg-[#bf04ff] rounded-full"></div>
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">OnlyCats</h1>
            </div>

            {/* Кнопка "Додати котика" */}
            <div className="px-4 mb-6">
                <button
                    onClick={() => {
                        // ЗАХИСТ ВІД НЕАВТОРИЗОВАНИХ
                        if (!isLoggedIn) {
                            setShowAuthModal(true);
                            return;
                        }
                        setActiveTab('addCat');
                    }}
                    className="w-full bg-[#bf04ff] hover:bg-[#a103d8] text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Додати котика
                </button>
            </div>

            {/* НАВІГАЦІЯ */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
                        activeTab === 'home' ?
                        'bg-[#fdf4ff] text-[#bf04ff]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    Головна
                </button>

                <button
                    onClick={() => setActiveTab('explore')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
                        activeTab === 'explore' ?
                        'bg-[#fdf4ff] text-[#bf04ff]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    Карта / Огляд
                </button>

                <button
                    onClick={() => setActiveTab('rating')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
                        activeTab === 'rating' ?
                        'bg-[#fdf4ff] text-[#bf04ff]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    Рейтинг
                </button>

                <button
                    onClick={() => setActiveTab('mycats')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
                        activeTab === 'mycats' ?
                        'bg-[#fdf4ff] text-[#bf04ff]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Мої котики
                </button>

                <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
                        activeTab === 'profile' ?
                        'bg-[#fdf4ff] text-[#bf04ff]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Профіль
                </button>
            </nav>

            {/* НИЖНІЙ БЛОК: РЕЄСТРАЦІЯ / АВТОРИЗАЦІЯ / ВИХІД */}
            <div className="p-4 border-t border-gray-100">
                {isLoggedIn ? (
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-50 text-red-600 hover:bg-red-100 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        Вийти з акаунта
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => { setActiveTab('auth'); setAuthMode('register'); }}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-xl transition-colors mb-2"
                        >
                            Зареєструватися
                        </button>
                        <button
                            onClick={() => { setActiveTab('auth'); setAuthMode('login'); }}
                            className="w-full bg-white border border-gray-200 hover:border-[#bf04ff] text-gray-700 hover:text-[#bf04ff] font-bold py-3 px-4 rounded-xl transition-colors"
                        >
                            Увійти
                        </button>
                    </>
                )}
            </div>
        </div>

        {/* ГОЛОВНА ЗОНА */}
        <div className="flex-1 flex flex-col items-center p-6 md:p-8 overflow-y-auto w-full">

            {/* Головна - Картка котика + Коментарі */}
            {activeTab === 'home' && (
                <div className="w-full max-w-[420px] flex flex-col gap-6 pb-12 mt-auto mb-auto">

                    {/* Картка */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 w-full overflow-hidden flex flex-col">
                        <div className="h-[400px] w-full bg-gray-100 relative">
                            <img src="https://images.unsplash.com/photo-1533738363-b7f9aef128ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="cat" className="w-full h-full object-cover" />
                        </div>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-3xl font-black text-gray-900">Рижик, 3 р.</h2>
                                <div className="flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full transition-all">
                                    <span className="text-orange-500 text-lg">🔥</span>
                                    <span className="text-orange-600 font-bold">{likes}</span>
                                </div>
                            </div>
                            <p className="text-gray-600 text-lg mb-8">Любить спати на клавіатурі та їсти сметану.</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleLike}
                                    className={`flex-1 font-bold py-4 rounded-2xl transition-all shadow-lg ${
                                        hasLiked
                                        ? 'bg-purple-50 text-[#bf04ff] border-2 border-purple-200 shadow-none'
                                        : 'bg-[#bf04ff] hover:bg-[#a103d8] text-white border-2 border-[#bf04ff] shadow-purple-500/30'
                                    }`}
                                >
                                    {hasLiked ? 'Підтримано 💖' : 'Підтримати'}
                                </button>
                                <button className="flex-1 bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors">
                                    Наступний
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- БЛОК КОМЕНТАРІВ --- */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-6 w-full">
                        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                            Коментарі <span className="text-gray-400 font-medium text-lg">({comments.length})</span>
                        </h3>

                        {/* Список коментарів */}
                        <div className="space-y-4 mb-6">
                            {comments.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">Поки що немає коментарів. Станьте першим!</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className={`p-4 rounded-2xl ${comment.isMine ? 'bg-[#fdf4ff] border border-purple-100' : 'bg-gray-50'}`}>

                                        {/* Шапка коментаря */}
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                                                    {comment.author.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-900 text-sm">{comment.author}</span>
                                                {comment.isMine && <span className="text-xs bg-[#bf04ff] text-white px-2 py-0.5 rounded-full">Автор</span>}
                                            </div>

                                            {/* Кнопки Дій */}
                                            {comment.isMine && editingCommentId !== comment.id && (
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => startEditing(comment)} className="text-gray-400 hover:text-[#bf04ff] transition-colors" title="Редагувати">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteComment(comment.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Видалити">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Текст або Форма редагування */}
                                        {editingCommentId === comment.id ? (
                                            <div className="mt-3">
                                                <textarea
                                                    value={editCommentText}
                                                    onChange={(e) => setEditCommentText(e.target.value)}
                                                    className="w-full bg-white border border-[#bf04ff] text-gray-900 rounded-xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block p-3 outline-none transition-colors resize-none mb-3"
                                                    rows="2"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={handleCancelEdit} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                                                        Скасувати
                                                    </button>
                                                    <button onClick={handleSaveEdit} className="bg-[#bf04ff] hover:bg-[#a103d8] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm">
                                                        Зберегти
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-700 ml-10 text-sm leading-relaxed">{comment.text}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Форма створення нового коментаря */}
                        <form onSubmit={handleAddComment} className="flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Написати коментар..."
                                className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block px-4 py-3.5 outline-none transition-colors"
                            />
                            <button
                                type="submit"
                                className={`flex items-center justify-center w-14 rounded-2xl transition-all ${
                                    newComment.trim() ?
                                    'bg-[#bf04ff] hover:bg-[#a103d8] text-white shadow-lg shadow-purple-500/30 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Вкладка: ДОДАТИ КОТИКА */}
            {activeTab === 'addCat' && (
                <div className="w-full max-w-md m-auto">
                    <AddCat onAdded={() => {
                        setActiveTab('home');
                        window.location.reload();
                    }} />
                </div>
            )}

            {/* Вкладка: КАРТА ОГОЛОШЕНЬ (Колишній Explore) */}
            {activeTab === 'explore' && (
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

                    {/* БЛОК ІНТЕРАКТИВНОЇ КАРТИ (Візуальна імітація) */}
                    <div className="relative w-full h-80 bg-blue-50/50 rounded-[32px] border-2 border-blue-100 overflow-hidden shadow-sm flex items-center justify-center mb-2">
                        {/* Декоративна сітка для фону карти */}
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#bf04ff 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.1 }}></div>
                        
                        <div className="text-center z-10 bg-white/90 p-6 rounded-3xl backdrop-blur-md shadow-sm border border-gray-100">
                            <span className="text-5xl block mb-3">📍</span>
                            <p className="text-xl font-black text-gray-900">Місце для карти</p>
                            <p className="text-gray-500 text-sm mt-1">Тут відображатимуться піни оголошень</p>
                        </div>

                        {/* Плаваючі піни */}
                        <div className="absolute top-[20%] left-[25%] text-4xl animate-bounce drop-shadow-lg cursor-pointer hover:scale-110 transition-transform">📍</div>
                        <div className="absolute bottom-[25%] right-[20%] text-4xl animate-bounce drop-shadow-lg cursor-pointer hover:scale-110 transition-transform" style={{ animationDelay: '0.4s' }}>📍</div>
                        <div className="absolute top-[45%] right-[40%] text-4xl animate-bounce drop-shadow-lg cursor-pointer hover:scale-110 transition-transform" style={{ animationDelay: '0.2s' }}>📍</div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                        {/* ФОРМА ДОДАВАННЯ ОГОЛОШЕННЯ */}
                        {showAdForm && (
                            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 w-full lg:w-1/3 animate-[bounce-in_0.3s_ease-out] shrink-0">
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="text-[#bf04ff]">📝</span> Нове оголошення
                                </h3>
                                <form onSubmit={handleAddAd} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Заголовок</label>
                                        <input
                                            type="text"
                                            placeholder="Знайдено рудого кота..."
                                            required
                                            value={newAdData.title}
                                            onChange={(e) => setNewAdData({...newAdData, title: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block p-3.5 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Локація</label>
                                        <input
                                            type="text"
                                            placeholder="Вул. Степана Бандери, 12"
                                            required
                                            value={newAdData.location}
                                            onChange={(e) => setNewAdData({...newAdData, location: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block p-3.5 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Опис ситуації</label>
                                        <textarea
                                            placeholder="Опишіть деталі, особливі прикмети..."
                                            required
                                            rows="4"
                                            value={newAdData.description}
                                            onChange={(e) => setNewAdData({...newAdData, description: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block p-3.5 outline-none transition-colors resize-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-colors shadow-lg mt-2"
                                    >
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
            )}

            {/* Вкладка Реєстрації/Авторизації */}
            {activeTab === 'auth' && (
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 w-full max-w-md m-auto">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 rounded-full border-4 border-[#bf04ff] flex items-center justify-center">
                            <div className="w-4 h-4 bg-[#bf04ff] rounded-full"></div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-center text-gray-900 mb-2">
                        {authMode === 'login' ? 'З поверненням! 🐾' : 'Створити акаунт 🐾'}
                    </h2>
                    <p className="text-center text-gray-500 mb-8">
                        {authMode === 'login' ? 'Увійдіть, щоб оцінювати котиків' : 'Приєднуйся до нашої пухнастої спільноти'}
                    </p>

                    <form className="space-y-4" onSubmit={handleAuthSubmit}>
                        {authMode === 'register' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ім'я / Нікнейм</label>
                                <input
                                    type="text"
                                    placeholder="Мурзик"
                                    required
                                    value={authName}
                                    onChange={(e) => setAuthName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block p-3.5 outline-none transition-colors"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                placeholder="yourcat@email.com"
                                required
                                value={authEmail}
                                onChange={(e) => setAuthEmail(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block p-3.5 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Пароль</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                required
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block p-3.5 outline-none transition-colors"
                            />
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full bg-[#bf04ff] hover:bg-[#a103d8] text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-purple-500/30 mb-4">
                                {authMode === 'login' ? 'Увійти' : 'Зареєструватися'}
                            </button>
                            <p className="text-center text-gray-500 font-medium">
                                {authMode === 'login' ? (
                                    <>
                                        Немає акаунту?{' '}
                                        <button type="button" onClick={() => setAuthMode('register')} className="text-[#bf04ff] hover:underline">
                                            Зареєструватися
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        Вже є акаунт?{' '}
                                        <button type="button" onClick={() => setAuthMode('login')} className="text-[#bf04ff] hover:underline">
                                            Увійти
                                        </button>
                                    </>
                                )}
                            </p>
                        </div>
                    </form>
                </div>
            )}

            {/* Заглушки інших сторінок */}
            {activeTab === 'rating' && <h2 className="text-3xl font-bold text-gray-400 m-auto">Сторінка "Рейтинг" (В розробці)</h2>}
            {activeTab === 'mycats' && <h2 className="text-3xl font-bold text-gray-400 m-auto">Сторінка "Мої котики" (Сумно)</h2>}
            {activeTab === 'profile' && <h2 className="text-3xl font-bold text-gray-400 m-auto">Сторінка "Профіль" (В розробці)</h2>}
            {activeTab === 'ads' && <Ads />} 

        </div>

        {/* --- ПЛАШКА: ЗАБОРОНЯЄ (Для гостей) --- */}
        {showAuthModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative animate-[bounce-in_0.5s_ease-out]">
                    <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                    <div className="flex flex-col items-center text-center mt-2">
                        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6 border-4 border-rose-100 shadow-inner">
                            <span className="text-5xl">😾</span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3">Обережно!</h3>
                        <p className="text-gray-600 mb-8 font-medium leading-relaxed text-lg px-2">
                            <span className="text-rose-500 font-bold">Адміністрація забороняє</span> подібні дії не зараєстрованим користувачам, вона буде злитись!
                            <br/><br/>Зареєструйтесь чи увійдіть, для початку!
                        </p>
                        <div className="flex w-full gap-3">
                            <button onClick={() => { setShowAuthModal(false); setActiveTab('auth'); setAuthMode('register'); }} className="flex-1 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 font-bold py-4 px-4 rounded-xl transition-colors">
                                Реєстрація
                            </button>
                            <button onClick={() => { setShowAuthModal(false); setActiveTab('auth'); setAuthMode('login'); }} className="flex-1 bg-[#bf04ff] hover:bg-[#a103d8] text-white font-bold py-4 px-4 rounded-xl transition-colors shadow-lg shadow-purple-500/30">
                                Увійти
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}