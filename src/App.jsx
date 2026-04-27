import React, { useState, useEffect } from 'react';
import Ads from './Ads';
import AddCat from './AddCat';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [authMode, setAuthMode] = useState('login');

  // --- СТЕЙТИ ДЛЯ АВТОРИЗАЦІЇ ---
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  // --- СТЕЙТИ ДЛЯ ПЛАШОК ---
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [welcomeDesc, setWelcomeDesc] = useState('');

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

      // --- ЛОГІКА НОВОЇ ПЛАШКИ ВІТАННЯ ---
      if (authMode === 'login') {
          setWelcomeTitle('Мур-р-р! З поверненням!');
          setWelcomeDesc('Твій персональний котячий рай сумував за тобою. Твої улюблені хвостики вже чекають на лайки!');
      } else {
          setWelcomeTitle('Ласкаво просимо у зграю!');
          setWelcomeDesc('Тепер ти офіційно член найпухнастішої спільноти в інтернеті. Готуйся до безлічі "Няв"!');
      }

      setShowWelcomeModal(true); // Відкриваємо красиву плашку
      setAuthEmail(''); setAuthPassword(''); setAuthName('');

    } catch (error) {
      console.error('Auth error:', error);
      alert(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setActiveTab('home');
    window.location.reload();
  };

  // ==========================================
  // СТРІЧКА ПОСТІВ
  // ==========================================
  const [feedPosts, setFeedPosts] = useState([
    {
      id: 1,
      author: "Олена",
      catName: "Рижик",
      age: "3 р.",
      image: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Любить спати на клавіатурі та їсти сметану. Знову розбудив о 5 ранку 🐈",
      likes: 124,
      hasLiked: false,
      comments: [
        { id: 101, author: "Максим", text: "Який милий пухнастик! 😍", isMine: false },
        { id: 102, author: "Ви", text: "Обожнюю рудих котів, просто супер.", isMine: true }
      ],
      newCommentText: "",
      showCommentInput: false // Стейт для показу/приховування поля коментаря
    },
    {
      id: 2,
      author: "Vlad_Dev",
      catName: "Барсік",
      age: "1 р.",
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      description: "Гроза мишей і домашніх вазонів. Шукаємо йому подружку.",
      likes: 89,
      hasLiked: false,
      comments: [],
      newCommentText: "",
      showCommentInput: false
    }
  ]);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  // --- ЛОГІКА ЛАЙКУ ДЛЯ СТРІЧКИ ---
  const handleLikePost = async (postId) => {
    if (!isLoggedIn) {
        setShowAuthModal(true);
        return;
    }

    setFeedPosts(currentPosts =>
      currentPosts.map(post => {
        if (post.id === postId) {
          const isLikingNow = !post.hasLiked;
          return {
            ...post,
            hasLiked: isLikingNow,
            likes: isLikingNow ? post.likes + 1 : Math.max(0, post.likes - 1)
          };
        }
        return post;
      })
    );

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const post = feedPosts.find(p => p.id === postId);
      const isLikingNow = !post.hasLiked;

      await fetch(isLikingNow ? `${BASE_URL}/likes/` : `${BASE_URL}/likes/${postId}`, {
        method: isLikingNow ? 'POST' : 'DELETE',
        headers: headers,
        body: isLikingNow ? JSON.stringify({ post_id: postId }) : null,
      });
    } catch (error) {
      console.error('Помилка лайку:', error);
    }
  };

  // --- ЛОГІКА КОМЕНТАРІВ ---
  const toggleCommentInput = (postId) => {
    setFeedPosts(posts => posts.map(p =>
        p.id === postId ? { ...p, showCommentInput: !p.showCommentInput } : p
    ));
  };

  const handleCommentChange = (postId, text) => {
    setFeedPosts(posts => posts.map(p =>
      p.id === postId ? { ...p, newCommentText: text } : p
    ));
  };

  const handleAddCommentToPost = (e, postId) => {
    e.preventDefault();
    if (!isLoggedIn) {
        setShowAuthModal(true);
        return;
    }

    setFeedPosts(posts => posts.map(post => {
      if (post.id === postId && post.newCommentText.trim()) {
        const newComment = {
          id: Date.now(),
          author: authName || "Ви",
          text: post.newCommentText,
          isMine: true
        };
        return {
          ...post,
          comments: [...post.comments, newComment],
          newCommentText: "",
          showCommentInput: false // Ховаємо інпут після публікації
        };
      }
      return post;
    }));
  };

  const handleDeleteComment = (postId, commentId) => {
    if (window.confirm("Ви точно хочете видалити цей коментар?")) {
      setFeedPosts(posts => posts.map(post => {
        if (post.id === postId) {
          return { ...post, comments: post.comments.filter(c => c.id !== commentId) };
        }
        return post;
      }));
    }
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.text);
  };

  const handleSaveEdit = (postId) => {
    if (!editCommentText.trim()) return;

    setFeedPosts(posts => posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(c =>
            c.id === editingCommentId ? { ...c, text: editCommentText } : c
          )
        };
      }
      return post;
    }));

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
            {/* НОВИЙ ЛОГОТИП (Лапка) */}
            <div className="p-6 flex items-center gap-3">
                <svg className="w-10 h-10 text-[#bf04ff] drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/>
                </svg>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">OnlyCats</h1>
            </div>

            {/* Кнопка "Додати котика" */}
            <div className="px-4 mb-6">
                <button
                    onClick={() => {
                        if (!isLoggedIn) {
                            setShowAuthModal(true);
                            return;
                        }
                        setActiveTab('addCat');
                    }}
                    className="w-full bg-[#bf04ff] hover:bg-[#a103d8] text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-500/20"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Створити пост
                </button>
            </div>

            {/* НАВІГАЦІЯ */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                <button
                    onClick={() => setActiveTab('home')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
                        activeTab === 'home' ? 'bg-[#fdf4ff] text-[#bf04ff]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                    </svg>
                    Стрічка
                </button>

                <button
                    onClick={() => setActiveTab('explore')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
                        activeTab === 'explore' ? 'bg-[#fdf4ff] text-[#bf04ff]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    Карта оголошень
                </button>

                <button
                    onClick={() => setActiveTab('rating')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
                        activeTab === 'rating' ? 'bg-[#fdf4ff] text-[#bf04ff]' : 'text-gray-600 hover:bg-gray-50'
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
                        activeTab === 'mycats' ? 'bg-[#fdf4ff] text-[#bf04ff]' : 'text-gray-600 hover:bg-gray-50'
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
                        activeTab === 'profile' ? 'bg-[#fdf4ff] text-[#bf04ff]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Профіль
                </button>
            </nav>

            {/* НИЖНІЙ БЛОК */}
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
       <div className="flex-1 flex flex-col items-center px-0 py-6 pb-24 sm:px-6 md:p-8 md:pb-8 overflow-y-auto w-full">

            {/* --- СТРІЧКА ПОСТІВ --- */}
            {activeTab === 'home' && (
                <div className="w-full max-w-[540px] flex flex-col gap-10 pb-12 mt-2">

                    {feedPosts.map((post) => (
                        <article
                            key={post.id}
                            className="bg-white rounded-none sm:rounded-[32px] shadow-sm border-y border-x-0 sm:border-x border-gray-100 w-full overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-1 hover:border-[#bf04ff]/30 mb-4 sm:mb-0"
                         >
                            {/* Шапка поста */}
                            <div className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {/* Аватарка автора */}
                                    <div className="w-12 h-12 rounded-full bg-[#fdf4ff] border border-[#bf04ff] flex items-center justify-center text-[#bf04ff] font-black text-xl">
                                        {post.author.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 text-lg leading-tight">{post.author}</h3>
                                        <p className="text-gray-500 font-medium text-sm">{post.catName}, {post.age}</p>
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-[#bf04ff] transition-colors p-2">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                </button>
                            </div>

                            {/* Картинка (Дабл тап для лайку) */}
                            <div
                                className="w-full aspect-square bg-gray-100 relative cursor-pointer group"
                                onDoubleClick={() => handleLikePost(post.id)}
                            >
                                <img src={post.image} alt={post.catName} className="w-full h-full object-cover transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-bold bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">Двічі клацніть ❤️</span>
                                </div>
                            </div>

                            {/* Дії (Лайк, Відкрити коментарі, Поділитися) */}
                            <div className="p-5 pb-2 flex items-center justify-between">
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleLikePost(post.id)}
                                        className={`transition-transform active:scale-75 flex items-center justify-center ${post.hasLiked ? 'text-[#bf04ff]' : 'text-gray-900 hover:text-gray-500'}`}
                                    >
                                        <svg className="w-8 h-8 drop-shadow-sm" fill={post.hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={post.hasLiked ? "1" : "2"} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                        </svg>
                                    </button>
                                    {/* Кнопка "Коментувати" */}
                                    <button
                                        onClick={() => toggleCommentInput(post.id)}
                                        className={`transition-transform active:scale-75 ${post.showCommentInput ? 'text-[#bf04ff]' : 'text-gray-900 hover:text-gray-500'}`}
                                    >
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                        </svg>
                                    </button>
                                    <button className="text-gray-900 hover:text-gray-500 transition-transform active:scale-75">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Опис і лайки */}
                            <div className="px-5 mb-4">
                                <p className="font-black text-gray-900 mb-1">{post.likes} вподобань</p>
                                <p className="text-gray-700 text-[15px] leading-relaxed">
                                    <span className="font-black text-gray-900 mr-2">{post.author}</span>
                                    {post.description}
                                </p>
                            </div>

                            {/* --- БЛОК КОМЕНТАРІВ (Бульбашки) --- */}
                            <div className="px-5 mb-4 space-y-3">
                                {post.comments.length > 0 && post.comments.map(comment => (
                                    <div key={comment.id} className={`p-4 rounded-2xl ${comment.isMine ? 'bg-[#fdf4ff] border border-purple-100' : 'bg-gray-50'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold">
                                                    {comment.author.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-900 text-sm">{comment.author}</span>
                                                {comment.isMine && <span className="text-xs bg-[#bf04ff] text-white px-2 py-0.5 rounded-full">Ви</span>}
                                            </div>

                                            {/* Кнопки Дій (Редагувати/Видалити) */}
                                            {comment.isMine && editingCommentId !== comment.id && (
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => startEditing(comment)} className="text-gray-400 hover:text-[#bf04ff] transition-colors" title="Редагувати">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteComment(post.id, comment.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Видалити">
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
                                                    <button onClick={() => handleSaveEdit(post.id)} className="bg-[#bf04ff] hover:bg-[#a103d8] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm">
                                                        Зберегти
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-700 ml-10 text-sm leading-relaxed">{comment.text}</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Прихована форма додавання коментаря */}
                            {post.showCommentInput && (
                                <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto animate-[bounce-in_0.3s_ease-out]">
                                    <form onSubmit={(e) => handleAddCommentToPost(e, post.id)} className="flex gap-2">
                                        <input
                                            type="text"
                                            autoFocus
                                            value={post.newCommentText}
                                            onChange={(e) => handleCommentChange(post.id, e.target.value)}
                                            placeholder="Написати коментар..."
                                            className="flex-1 bg-white border border-gray-200 text-gray-900 rounded-2xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block px-4 py-3 outline-none transition-colors"
                                        />
                                        <button
                                            type="submit"
                                            className={`flex items-center justify-center px-5 rounded-2xl font-bold transition-all ${
                                                post.newCommentText.trim() ? 'bg-[#bf04ff] hover:bg-[#a103d8] text-white shadow-md shadow-purple-500/30' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                        </button>
                                    </form>
                                </div>
                            )}

                        </article>
                    ))}

                    <div className="text-center py-6">
                        <span className="text-4xl block mb-2">🐈</span>
                        <p className="text-gray-400 font-bold">Ви переглянули всі новини на сьогодні</p>
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

            {/* Вкладка: КАРТА ОГОЛОШЕНЬ */}
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

                    {/* БЛОК ІНТЕРАКТИВНОЇ КАРТИ */}
                    <div className="relative w-full h-80 bg-blue-50/50 rounded-[32px] border-2 border-blue-100 overflow-hidden shadow-sm flex items-center justify-center mb-2">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#bf04ff 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.1 }}></div>

                        <div className="text-center z-10 bg-white/90 p-6 rounded-3xl backdrop-blur-md shadow-sm border border-gray-100">
                            <span className="text-5xl block mb-3">📍</span>
                            <p className="text-xl font-black text-gray-900">Місце для карти</p>
                            <p className="text-gray-500 text-sm mt-1">Тут відображатимуться піни оголошень</p>
                        </div>

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
                        {/* ЛОГОТИП ФОРМИ ВХОДУ (Лапка) */}
                        <svg className="w-14 h-14 text-[#bf04ff] drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/>
                        </svg>
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
            {activeTab === 'mycats' && <h2 className="text-3xl font-bold text-gray-400 m-auto">Сторінка "Мої котики" (В розробці)</h2>}
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

        {/* --- НОВА КРЕАТИВНА ПЛАШКА ВІТАННЯ --- */}
        {showWelcomeModal && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4 animate-[fade-in_0.3s_ease-out]">
                <div className="bg-white rounded-[32px] p-10 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-[scale-in_0.4s_ease-out]">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 rounded-full bg-[#bf04ff] opacity-20 blur-2xl animate-pulse"></div>
                        <div className="relative w-24 h-24 bg-[#fdf4ff] rounded-full border-4 border-[#bf04ff]/20 flex items-center justify-center shadow-inner">
                            <svg className="w-12 h-12 text-[#bf04ff]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                <path d="M12 13.5c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3-2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5S15 11.83 15 11zm-6 0c0-.83-.67-1.5-1.5-1.5S6 10.17 6 11s.67 1.5 1.5 1.5S9 11.83 9 11zm3-4c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5S12 7.83 12 7z" fill="white"/>
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">{welcomeTitle}</h2>
                    <p className="text-gray-600 mb-10 text-lg leading-relaxed px-2 font-medium">{welcomeDesc}</p>
                    <button onClick={() => { setShowWelcomeModal(false); setActiveTab('home'); }} className="w-full bg-[#bf04ff] hover:bg-[#a103d8] text-white font-bold py-4.5 px-6 rounded-2xl transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-3 text-lg hover:scale-105 active:scale-95">
                        Погнати до котиків 🐾
                    </button>
                </div>
            </div>
        )}
{/* --- МОБІЛЬНЕ НИЖНЄ МЕНЮ (Тільки для телефонів) --- */}
        <div className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 flex justify-around items-center p-3 z-50">
            {/* Кнопка 1: Стрічка */}
            <button onClick={() => setActiveTab('home')} className={`p-2 ${activeTab === 'home' ? 'text-[#bf04ff]' : 'text-gray-400'}`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            </button>

            {/* ТУТ ДОДАШ ІНШІ КНОПКИ ПО АНАЛОГІЇ (Огляд, Профіль і т.д.) */}

            {/* Центральна кнопка "Додати" (зробимо її випуклою) */}
            <button
                onClick={() => { if(!isLoggedIn){setShowAuthModal(true); return;} setActiveTab('addCat'); }}
                className="bg-[#bf04ff] text-white p-3 rounded-full shadow-lg shadow-purple-500/30 -mt-6 border-4 border-[#f4f4f5]"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
            </button>

            {/* ТУТ ДОДАШ ЩЕ 2 КНОПКИ */}
        </div>
    </div>
  );
}