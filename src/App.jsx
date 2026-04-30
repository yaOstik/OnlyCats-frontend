import React, { useState, useEffect } from 'react';
import Ads from './Ads';
import AddCat from './AddCat';
import ExploreMap from './ExploreMap'; // ПІДКЛЮЧИЛИ КАРТУ

// ==========================================
// КОМПОНЕНТ СТОРІНКИ ЗАВДАНЬ (Лежить у цьому ж файлі)
// ==========================================
const TasksPage = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Погодувати кота', completed: false },
    { id: 2, text: 'Погладити кота', completed: false },
    { id: 3, text: 'Прибрати за котом', completed: false }
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
      <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Завдання OnlyCats 🐾</h2>

      {/* Прогрес-бар */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-3">
           <span className="font-bold text-gray-700">Твій прогрес догляду</span>
           <span className="text-[#bf04ff] font-black text-xl">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#bf04ff] transition-all duration-500 ease-out shadow-[0_0_15px_rgba(191,4,255,0.4)]"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Список завдань */}
      <div className="space-y-4">
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`flex items-center gap-4 p-6 rounded-3xl border-2 cursor-pointer transition-all duration-200 ${
              task.completed
              ? 'bg-purple-50 border-purple-100 scale-[0.98]'
              : 'bg-white border-gray-50 hover:border-purple-200 shadow-sm'
            }`}
          >
            <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
              task.completed ? 'bg-[#bf04ff] border-[#bf04ff]' : 'border-gray-300 bg-white'
            }`}>
              {task.completed && (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              )}
            </div>
            <span className={`text-xl font-bold transition-all ${
              task.completed ? 'text-gray-400 line-through' : 'text-gray-800'
            }`}>
              {task.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// ГОЛОВНИЙ КОМПОНЕНТ APP
// ==========================================
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

  const BASE_URL = 'https://5fpeo7vj4m.execute-api.eu-north-1.amazonaws.com/Prod';

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

      // --- ЛОГІКА ПЛАШКИ ВІТАННЯ ---
      if (authMode === 'login') {
          setWelcomeTitle('Мур-р-р! З поверненням!');
          setWelcomeDesc('Твій персональний котячий рай сумував за тобою. Твої улюблені хвостики вже чекають на лайки!');
      } else {
          setWelcomeTitle('Ласкаво просимо у зграю!');
          setWelcomeDesc('Тепер ти офіційно член найпухнастішої спільноти в інтернеті. Готуйся до безлічі "Няв"!');
      }

      setShowWelcomeModal(true);
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
  const [feedPosts, setFeedPosts] = useState([]);

  const fetchFeedPosts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/posts/`);
      if (!response.ok) throw new Error('Помилка сервера при завантаженні стрічки');

      const data = await response.json();

      const formattedPosts = data.map(post => ({
        id: post.id,
        author: post.username || post.owner?.username || post.author_name || "Анонім",
        catName: post.title || "Котик",
        age: post.cat_age !== undefined && post.cat_age !== null ? `${post.cat_age} р.` : "Невідомо",
        image: post.image_url || "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        description: post.content || "",
        likes: 0, // Поки бекендер не додасть likes_count
        hasLiked: false,
        comments: [],
        newCommentText: "",
        showCommentInput: false
      }));

      const reversedPosts = formattedPosts.sort((a, b) => b.id - a.id);
      setFeedPosts(reversedPosts);

    } catch (error) {
      console.error('Помилка завантаження постів:', error);
    }
  };

  useEffect(() => {
    fetchFeedPosts();
  }, []);

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
      // 🚨 Фікс відрізання лапок зберігся!
      const token = localStorage.getItem('token')?.replace(/"/g, '');
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
          showCommentInput: false
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

  return (
    <div className="flex h-screen bg-[#f4f4f5] font-sans relative">

        {/* БІЧНА ПАНЕЛЬ (Sidebar) */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shrink-0">
            <div className="p-6 flex items-center gap-3">
                <svg className="w-10 h-10 text-[#bf04ff] drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/>
                </svg>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">OnlyCats</h1>
            </div>

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
                    onClick={() => setActiveTab('tasks')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-colors ${
                        activeTab === 'tasks' ? 'bg-[#fdf4ff] text-[#bf04ff]' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                    </svg>
                    Завдання
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
       <div className="flex-1 flex flex-col items-center pt-3 px-1 pb-24 py-6 sm:px-6 md:p-8 md:pb-8 overflow-y-auto w-full">

            {activeTab === 'home' && (
                <div className="w-full max-w-[540px] flex flex-col pb-12 ">
                    <div className="md:hidden flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-2">
                        <div className="flex items-center gap-2 shrink-0">
                            <svg className="w-8 h-8 text-[#bf04ff]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/>
                            </svg>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">OnlyCats</h1>
                        </div>
                        <div className="flex-1 ml-4 bg-[#fdf4ff] border border-purple-100 rounded-xl py-2 px-3 flex items-center justify-center overflow-hidden">
                            <span className="text-[#bf04ff] font-bold text-sm truncate">
                                {isLoggedIn ? `Привіт, ${authName || 'Котику'}! 🐾` : 'Свіжі пухнасті новини 🔥'}
                            </span>
                        </div>
                    </div>

                    {feedPosts.map((post) => (
                        <article key={post.id} className="bg-white rounded-none sm:rounded-[32px] shadow-sm border-y border-x-0 sm:border-x border-gray-100 w-full overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-1 hover:border-[#bf04ff]/30 mb-4 sm:mb-0">
                            <div className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[#fdf4ff] border border-[#bf04ff] flex items-center justify-center text-[#bf04ff] font-black text-xl">
                                        {post.author.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-900 text-lg leading-tight">{post.author}</h3>
                                        <p className="text-gray-500 font-medium text-sm">{post.catName}, {post.age}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full aspect-square bg-gray-100 relative cursor-pointer group" onDoubleClick={() => handleLikePost(post.id)}>
                                <img src={post.image} alt={post.catName} className="w-full h-full object-cover transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-bold bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">Двічі клацніть ❤️</span>
                                </div>
                            </div>

                            <div className="p-5 pb-2 flex items-center justify-between">
                                <div className="flex gap-4">
                                    <button onClick={() => handleLikePost(post.id)} className={`transition-transform active:scale-75 flex items-center justify-center ${post.hasLiked ? 'text-[#bf04ff]' : 'text-gray-900 hover:text-gray-500'}`}>
                                        <svg className="w-8 h-8 drop-shadow-sm" fill={post.hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={post.hasLiked ? "1" : "2"} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                        </svg>
                                    </button>
                                    <button onClick={() => toggleCommentInput(post.id)} className={`transition-transform active:scale-75 ${post.showCommentInput ? 'text-[#bf04ff]' : 'text-gray-900 hover:text-gray-500'}`}>
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="px-5 mb-4 flex flex-col gap-1">
                                <p className="text-gray-700 text-[15px] leading-relaxed">
                                    <span className="font-black text-gray-900 mr-2">{post.author}</span>
                                    {post.description}
                                </p>
                                <p className="font-black text-gray-900 text-sm">{post.likes} вподобань</p>
                            </div>

                            {/* КОМЕНТАРІ */}
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

                                            {comment.isMine && editingCommentId !== comment.id && (
                                                <div className="flex items-center gap-3">
                                                    <button onClick={() => startEditing(comment)} className="text-gray-400 hover:text-[#bf04ff] transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                    </button>
                                                    <button onClick={() => handleDeleteComment(post.id, comment.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {editingCommentId === comment.id ? (
                                            <div className="mt-3">
                                                <textarea value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} className="w-full bg-white border border-[#bf04ff] text-gray-900 rounded-xl focus:ring-[#bf04ff] focus:border-[#bf04ff] block p-3 outline-none resize-none mb-3" rows="2" />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={handleCancelEdit} className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900">Скасувати</button>
                                                    <button onClick={() => handleSaveEdit(post.id)} className="bg-[#bf04ff] text-white text-sm font-bold px-4 py-2 rounded-xl">Зберегти</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-700 ml-10 text-sm">{comment.text}</p>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {post.showCommentInput && (
                                <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto">
                                    <form onSubmit={(e) => handleAddCommentToPost(e, post.id)} className="flex gap-2">
                                        <input type="text" autoFocus value={post.newCommentText} onChange={(e) => handleCommentChange(post.id, e.target.value)} placeholder="Написати коментар..." className="flex-1 bg-white border border-gray-200 rounded-2xl block px-4 py-3 outline-none focus:border-[#bf04ff]" />
                                        <button type="submit" className={`flex items-center justify-center px-5 rounded-2xl font-bold ${post.newCommentText.trim() ? 'bg-[#bf04ff] text-white' : 'bg-gray-200 text-gray-400'}`}>
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

            {activeTab === 'addCat' && (
                <div className="w-full max-w-md m-auto">
                    <AddCat onAdded={() => { setActiveTab('home'); window.location.reload(); }} />
                </div>
            )}

            {/* ВКЛАДКА ЗАВДАНЬ */}
            {activeTab === 'tasks' && <TasksPage />}

            {/* ВКЛАДКА КАРТИ ОГОЛОШЕНЬ */}
            {activeTab === 'explore' && (
                 <ExploreMap isLoggedIn={isLoggedIn} setShowAuthModal={setShowAuthModal} />
            )}

            {/* Вкладка Реєстрації/Авторизації */}
            {activeTab === 'auth' && (
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 w-full max-w-md m-auto">
                    <div className="flex justify-center mb-6">
                        <svg className="w-14 h-14 text-[#bf04ff] drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/>
                        </svg>
                    </div>

                    <h2 className="text-2xl font-black text-center text-gray-900 mb-2">
                        {authMode === 'login' ? 'З поверненням! 🐾' : 'Створити акаунт 🐾'}
                    </h2>
                    <form className="space-y-4" onSubmit={handleAuthSubmit}>
                        {authMode === 'register' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ім'я / Нікнейм</label>
                                <input type="text" required value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 outline-none focus:border-[#bf04ff]" />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                            <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 outline-none focus:border-[#bf04ff]" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Пароль</label>
                            <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 outline-none focus:border-[#bf04ff]" />
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full bg-[#bf04ff] text-white font-bold py-4 rounded-xl mb-4">{authMode === 'login' ? 'Увійти' : 'Зареєструватися'}</button>
                            <p className="text-center text-gray-500 font-medium">
                                {authMode === 'login' ? (
                                    <>Немає акаунту? <button type="button" onClick={() => setAuthMode('register')} className="text-[#bf04ff] hover:underline">Зареєструватися</button></>
                                ) : (
                                    <>Вже є акаунт? <button type="button" onClick={() => setAuthMode('login')} className="text-[#bf04ff] hover:underline">Увійти</button></>
                                )}
                            </p>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'rating' && <h2 className="text-3xl font-bold text-gray-400 m-auto">Сторінка "Рейтинг" (В розробці)</h2>}
            {activeTab === 'mycats' && <h2 className="text-3xl font-bold text-gray-400 m-auto">Сторінка "Мої котики" (В розробці)</h2>}
            {activeTab === 'profile' && <h2 className="text-3xl font-bold text-gray-400 m-auto">Сторінка "Профіль" (В розробці)</h2>}
            {activeTab === 'ads' && <Ads />}

        </div>

        {/* --- ПЛАШКА ЗАБОРОНИ --- */}
        {showAuthModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative">
                    <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <div className="flex flex-col items-center text-center mt-2">
                        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                            <span className="text-5xl">😾</span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-3">Обережно!</h3>
                        <p className="text-gray-600 mb-8 font-medium">Адміністрація забороняє подібні дії не зареєстрованим користувачам!</p>
                        <div className="flex w-full gap-3">
                            <button onClick={() => { setShowAuthModal(false); setActiveTab('auth'); setAuthMode('register'); }} className="flex-1 border-2 border-gray-200 font-bold py-4 rounded-xl">Реєстрація</button>
                            <button onClick={() => { setShowAuthModal(false); setActiveTab('auth'); setAuthMode('login'); }} className="flex-1 bg-[#bf04ff] text-white font-bold py-4 rounded-xl">Увійти</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- ПЛАШКА ВІТАННЯ --- */}
        {showWelcomeModal && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[32px] p-10 max-w-md w-full text-center">
                    <h2 className="text-3xl font-black mb-3">{welcomeTitle}</h2>
                    <p className="text-gray-600 mb-10 text-lg">{welcomeDesc}</p>
                    <button onClick={() => { setShowWelcomeModal(false); setActiveTab('home'); }} className="w-full bg-[#bf04ff] text-white font-bold py-4 px-6 rounded-2xl">Погнати до котиків 🐾</button>
                </div>
            </div>
        )}

        {/* --- МОБІЛЬНЕ МЕНЮ --- */}
        <div className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 flex justify-around items-center p-3 z-50 pb-safe">
            <button onClick={() => setActiveTab('home')} className={`p-2 rounded-xl transition-colors ${activeTab === 'home' ? 'text-[#bf04ff]' : 'text-gray-400'}`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            </button>
            <button onClick={() => setActiveTab('explore')} className={`p-2 rounded-xl transition-colors ${activeTab === 'explore' ? 'text-[#bf04ff]' : 'text-gray-400'}`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            </button>
            <button onClick={() => { if(!isLoggedIn){setShowAuthModal(true); return;} setActiveTab('addCat'); }} className="bg-[#bf04ff] text-white p-3 rounded-full shadow-lg shadow-purple-500/30 -mt-6 border-4 border-[#f4f4f5] transition-transform active:scale-95">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
            </button>
            <button onClick={() => setActiveTab('rating')} className={`p-2 rounded-xl transition-colors ${activeTab === 'rating' ? 'text-[#bf04ff]' : 'text-gray-400'}`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </button>
            <button onClick={() => setActiveTab(isLoggedIn ? 'profile' : 'auth')} className={`p-2 rounded-xl transition-colors ${activeTab === 'profile' || activeTab === 'auth' ? 'text-[#bf04ff]' : 'text-gray-400'}`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </button>
        </div>

    </div>
  );
}