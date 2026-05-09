import React, { useState, useEffect } from 'react';
import Ads from './Ads';
import AddCat from './AddCat';
import ExploreMap from './ExploreMap';
import TasksPage from './TasksPage';

// ==========================================
// MAIN APP COMPONENT
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [authMode, setAuthMode] = useState('login');

  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [welcomeDesc, setWelcomeDesc] = useState('');

  const [ratingPeriod, setRatingPeriod] = useState('daily');

  const BASE_URL = 'https://5fpeo7vj4m.execute-api.eu-north-1.amazonaws.com/Prod';

  const getMyUserId = () => {
    try {
        const token = localStorage.getItem('token')?.replace(/"/g, '');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return String(payload.sub || payload.id || payload.user_id);
    } catch (e) {
        return null;
    }
  };

  // --- AUTH LOGIC ---
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

      if (!response.ok) throw new Error('Oops, something went wrong! Check your info 🐾');

      const data = await response.json();
      localStorage.setItem('token', data.access_token || JSON.stringify(data));

      if (authMode === 'register') {
          localStorage.setItem('username', authName);
      } else if (data.username) {
          localStorage.setItem('username', data.username);
      }

      setIsLoggedIn(true);

      if (authMode === 'login') {
          setWelcomeTitle('Purr-r! Welcome back! 🐾');
          setWelcomeDesc('Your personal cat paradise missed you. The fluffies are waiting for your paws!');
      } else {
          setWelcomeTitle('Welcome to the clowder! 🎉');
          setWelcomeDesc('You are officially one of us! Get ready for endless purring.');
      }

      setShowWelcomeModal(true);
      setAuthEmail(''); setAuthPassword(''); setAuthName('');

    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setActiveTab('home');
    window.location.reload();
  };

  // --- FEED POSTS LOGIC ---
  const [feedPosts, setFeedPosts] = useState([]);

  const fetchFeedPosts = async () => {
    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const fetchPostsPromise = fetch(`${BASE_URL}/posts/`);
      const fetchLikesPromise = token ? fetch(`${BASE_URL}/likes/me`, { headers }) : Promise.resolve(null);

      const [postsResponse, likesResponse] = await Promise.all([fetchPostsPromise, fetchLikesPromise]);

      if (!postsResponse.ok) throw new Error('Failed to load kitties');

      const postsData = await postsResponse.json();

      let myLikedPostIds = [];
      if (likesResponse && likesResponse.ok) {
          const likesData = await likesResponse.json();
          myLikedPostIds = likesData.post_ids || [];
      }

      const commentsPromises = postsData.map(post =>
          fetch(`${BASE_URL}/comments/${post.id}`).then(res => res.ok ? res.json() : [])
      );
      const allCommentsData = await Promise.all(commentsPromises);

      const myUserId = getMyUserId();
      const myLocalName = localStorage.getItem('username');

      const formattedPosts = postsData.map((post, index) => {
        const likesFromServer = post.rating_score || post.likes_count || post.likes || 0;
        const postAuthor = post.author_username || post.authorUsername || post.username || post.owner?.username || "Incognito Cat";

        const rawComments = allCommentsData[index] || [];
        const formattedComments = rawComments.map(c => {
            const isMine = String(c.user_id) === String(myUserId);
            const authorName = c.author_username || c.authorUsername || c.username || (isMine ? (myLocalName || "You") : `User ${c.user_id}`);
            return {
                id: c.id,
                author: authorName,
                text: c.content,
                isMine: isMine
            };
        });

        return {
          id: post.id,
          author: postAuthor,
          catName: post.title || "Fluffy",
          age: post.cat_age !== undefined && post.cat_age !== null ? `${post.cat_age} y.o.` : "Age unknown",
          image: post.image_url || "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          description: post.content || "",
          likes: likesFromServer,
          hasLiked: myLikedPostIds.includes(post.id),
          createdAt: post.created_at || new Date().toISOString(),

          comments: formattedComments,
          newCommentText: "",
          showCommentInput: false,
          isCommentsExpanded: false
        };
      });

      setFeedPosts(formattedPosts.sort((a, b) => b.id - a.id));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchFeedPosts();
  }, [isLoggedIn]);

  // --- LEADERBOARD LOGIC ---
  const now = new Date();

  const formatRank = (post, index) => {
      let trend = '';
      let color = 'text-gray-400';
      if (index === 0 && post.likes > 0) { trend = '👑 Leader'; color = 'text-yellow-500'; }
      else if (index > 0 && index < 3 && post.likes > 0) { trend = '🔥 Hot'; color = 'text-orange-500'; }
      else if (post.likes > 0) { trend = '🐾 Rising'; color = 'text-[#d946ef]'; }

      return {
          id: post.id,
          rank: index + 1,
          name: post.catName,
          owner: `@${post.author.toLowerCase().replace(/\s+/g, '_')}`,
          paws: post.likes,
          trend: trend,
          color: color,
          img: post.image
      };
  };

  const dailyCats = [...feedPosts].filter(post => (now - new Date(post.createdAt)) < 24 * 60 * 60 * 1000).sort((a, b) => b.likes - a.likes).map(formatRank);
  const monthlyCats = [...feedPosts].filter(post => (now - new Date(post.createdAt)) < 30 * 24 * 60 * 60 * 1000).sort((a, b) => b.likes - a.likes).map(formatRank);
  const widgetTopCats = dailyCats.slice(0, 3);
  const displayLeaderboard = ratingPeriod === 'daily' ? dailyCats : monthlyCats;

  // --- LIKES LOGIC ---
  const handleLikePost = async (postId) => {
    if (!isLoggedIn) return setShowAuthModal(true);

    const postToLike = feedPosts.find(p => p.id === postId);
    if (!postToLike) return;

    const isLikingNow = !postToLike.hasLiked;

    setFeedPosts(currentPosts => currentPosts.map(post => {
        if (post.id === postId) {
          return { ...post, hasLiked: isLikingNow, likes: isLikingNow ? post.likes + 1 : Math.max(0, post.likes - 1) };
        }
        return post;
    }));

    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      if (!token) throw new Error("No token");

      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
      const url = isLikingNow ? `${BASE_URL}/likes/` : `${BASE_URL}/likes/${postId}`;
      const method = isLikingNow ? 'POST' : 'DELETE';
      const body = isLikingNow ? JSON.stringify({ post_id: parseInt(postId) }) : null;

      const response = await fetch(url, { method, headers, body });

      if (!response.ok) {
        if (response.status === 401) alert("Your session expired. Please log out and log in again! 🐾");
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      setFeedPosts(currentPosts => currentPosts.map(post => {
          if (post.id === postId) return { ...post, hasLiked: !isLikingNow, likes: !isLikingNow ? post.likes + 1 : Math.max(0, post.likes - 1) };
          return post;
      }));
    }
  };

  // ==========================================
  // --- COMMENTS LOGIC ---
  // ==========================================
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const toggleComments = async (postId) => {
    const post = feedPosts.find(p => p.id === postId);
    const willExpand = !post.isCommentsExpanded;

    setFeedPosts(posts => posts.map(p => p.id === postId ? {
        ...p,
        showCommentInput: willExpand,
        isCommentsExpanded: willExpand
    } : p));

    if (willExpand) {
        try {
            const response = await fetch(`${BASE_URL}/comments/${postId}`);
            if (response.ok) {
                const data = await response.json();
                const myUserId = getMyUserId();
                const myLocalName = localStorage.getItem('username');

                const formattedComments = data.map(c => {
                    const isMine = String(c.user_id) === String(myUserId);
                    const authorName = c.author_username || c.authorUsername || c.username || (isMine ? (myLocalName || "You") : `User ${c.user_id}`);

                    return {
                        id: c.id,
                        author: authorName,
                        text: c.content,
                        isMine: isMine
                    };
                });

                setFeedPosts(posts => posts.map(p => p.id === postId ? { ...p, comments: formattedComments } : p));
            }
        } catch (error) {
            console.error("Failed to fetch comments", error);
        }
    }
  };

  const handleCommentChange = (postId, text) => setFeedPosts(posts => posts.map(p => p.id === postId ? { ...p, newCommentText: text } : p));

  const handleAddCommentToPost = async (e, postId) => {
    e.preventDefault();
    if (!isLoggedIn) return setShowAuthModal(true);

    const post = feedPosts.find(p => p.id === postId);
    const text = post.newCommentText.trim();
    if (!text) return;

    const tempId = Date.now();
    const myLocalName = localStorage.getItem('username') || "You";

    setFeedPosts(posts => posts.map(p => {
      if (p.id === postId) {
        return {
            ...p,
            comments: [...p.comments, { id: tempId, author: myLocalName, text: text, isMine: true }],
            newCommentText: "",
            isCommentsExpanded: true
        };
      }
      return p;
    }));

    try {
      const token = localStorage.getItem('token')?.replace(/"/g, '');
      const response = await fetch(`${BASE_URL}/comments/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ post_id: postId, content: text })
      });

      if (!response.ok) throw new Error("Failed to post comment");
      const savedComment = await response.json();

      setFeedPosts(posts => posts.map(p => {
        if (p.id === postId) {
          const finalAuthor = savedComment.author_username || savedComment.authorUsername || savedComment.username || myLocalName;
          return { ...p, comments: p.comments.map(c => c.id === tempId ? { ...c, id: savedComment.id, author: finalAuthor } : c) };
        }
        return p;
      }));
    } catch (error) {
      console.error(error);
      setFeedPosts(posts => posts.map(p => {
        if (p.id === postId) return { ...p, comments: p.comments.filter(c => c.id !== tempId) };
        return p;
      }));
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (window.confirm("Meow, are you sure you want to delete this comment?")) {
      const post = feedPosts.find(p => p.id === postId);
      const commentToDelete = post.comments.find(c => c.id === commentId);

      setFeedPosts(posts => posts.map(post => {
        if (post.id === postId) return { ...post, comments: post.comments.filter(c => c.id !== commentId) };
        return post;
      }));

      try {
          const token = localStorage.getItem('token')?.replace(/"/g, '');
          const response = await fetch(`${BASE_URL}/comments/${commentId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error("Failed to delete");
      } catch (error) {
          setFeedPosts(posts => posts.map(p => {
            if (p.id === postId) return { ...p, comments: [...p.comments, commentToDelete] };
            return p;
          }));
      }
    }
  };

  const startEditing = (comment) => { setEditingCommentId(comment.id); setEditCommentText(comment.text); };

  const handleSaveEdit = async (postId) => {
    if (!editCommentText.trim()) return;

    const post = feedPosts.find(p => p.id === postId);
    const originalText = post.comments.find(c => c.id === editingCommentId).text;
    const currentEditId = editingCommentId;

    setFeedPosts(posts => posts.map(p => {
      if (p.id === postId) {
        return { ...p, comments: p.comments.map(c => c.id === currentEditId ? { ...c, text: editCommentText } : c) };
      }
      return p;
    }));

    setEditingCommentId(null);
    setEditCommentText('');

    try {
        const token = localStorage.getItem('token')?.replace(/"/g, '');
        const response = await fetch(`${BASE_URL}/comments/${currentEditId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content: editCommentText })
        });
        if (!response.ok) throw new Error("Failed to update comment");
    } catch (error) {
        setFeedPosts(posts => posts.map(p => {
          if (p.id === postId) {
            return { ...p, comments: p.comments.map(c => c.id === currentEditId ? { ...c, text: originalText } : c) };
          }
          return p;
        }));
    }
  };
  const handleCancelEdit = () => { setEditingCommentId(null); setEditCommentText(''); };

  const getTabTitle = () => {
      switch(activeTab) {
          case 'home': return 'Home Feed';
          case 'explore': return 'Explore Map';
          case 'tasks': return 'Daily Tasks';
          case 'rating': return 'Leaderboard';
          case 'mycats': return 'My Cats';
          case 'profile': return 'My Profile';
          case 'auth': return 'Join Us';
          case 'addCat': return 'Post a Cat';
          default: return 'OnlyCats';
      }
  }

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans relative text-gray-800">

        {/* --- GLOBAL STYLES ДЛЯ КОРПОРАТИВНОГО СКРОЛУ --- */}
        <style>
        {`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
        `}
        </style>

        {/* ======================================= */}
        {/* 1. LEFT SIDEBAR */}
        {/* ======================================= */}
        <div className="w-[260px] bg-white flex flex-col hidden md:flex shrink-0 z-10 border-r border-gray-100">

            <div className="p-6 pt-8 pb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-[#d946ef] rounded-xl flex items-center justify-center text-white shadow-sm">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/>
                   </svg>
                </div>
                <h1 className="text-[22px] font-black tracking-tight text-gray-900">OnlyCats</h1>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {[
                    { id: 'home', label: 'Feed', path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                    { id: 'explore', label: 'Map', path: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { id: 'rating', label: 'Leaderboard', path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                    { id: 'tasks', label: 'Tasks', path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                    { id: 'mycats', label: 'My Cats', path: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                    { id: 'profile', label: 'Profile', path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
                ].map(item => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl font-bold transition-all ${
                                isActive ? 'bg-[#fdf4ff] text-[#d946ef]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.path}></path>
                            </svg>
                            {item.label}
                        </button>
                    )
                })}
            </nav>

            <div className="p-5 mt-auto border-t border-gray-50">
                <button
                    onClick={() => {
                        if (!isLoggedIn) return setShowAuthModal(true);
                        setActiveTab('addCat');
                    }}
                    className="w-full bg-[#d946ef] hover:bg-[#c026d3] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                >
                    <div className="w-5 h-5 rounded-full bg-white text-[#d946ef] flex items-center justify-center text-lg font-black leading-none pb-0.5">+</div>
                    Post Cat
                </button>

                {isLoggedIn ? (
                    <button onClick={handleLogout} className="w-full mt-4 text-sm font-bold text-gray-400 hover:text-red-400 transition-colors">
                        Log Out
                    </button>
                ) : (
                    <div className="mt-4 flex flex-col gap-2">
                        <button onClick={() => { setActiveTab('auth'); setAuthMode('register'); }} className="w-full text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 py-2.5 rounded-lg transition-colors">
                            Sign Up
                        </button>
                        <button onClick={() => { setActiveTab('auth'); setAuthMode('login'); }} className="w-full text-sm font-bold text-[#d946ef] bg-[#fdf4ff] hover:bg-fuchsia-100 py-2.5 rounded-lg transition-colors">
                            Log In
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* ======================================= */}
        {/* 2. MAIN CONTENT AREA & WIDGETS */}
        {/* ======================================= */}
        <div className="flex-1 flex flex-col overflow-hidden">

            <header className="h-[80px] hidden md:flex items-center justify-between px-8 shrink-0 bg-[#fafafa] z-10">
                <h2 className="text-[22px] font-bold text-gray-900">{getTabTitle()}</h2>
                <div className="flex items-center gap-5">
                    <button className="text-gray-400 hover:text-[#d946ef] transition-colors"><svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></button>
                    <button className="text-gray-400 hover:text-[#d946ef] transition-colors relative">
                        <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#d946ef] border-2 border-[#fafafa] rounded-full"></div>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-y-auto px-0 md:px-8 pb-24 md:pb-8">

                <main className="flex-1 max-w-[600px] w-full mx-auto flex flex-col">

                    <div className="md:hidden flex items-center justify-between bg-white p-4 shadow-sm border-b border-gray-100 mb-4 sticky top-0 z-20">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#d946ef] rounded-lg flex items-center justify-center text-white">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/></svg>
                            </div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">OnlyCats</h1>
                        </div>
                        {!isLoggedIn && (
                            <button onClick={() => setShowAuthModal(true)} className="text-sm font-bold text-[#d946ef] bg-[#fdf4ff] px-3 py-1.5 rounded-lg">Log In</button>
                        )}
                    </div>

                    {activeTab === 'home' && (
                        <div className="w-full pb-12">
                            {feedPosts.map((post) => {
                                const userHandle = `@${post.author.toLowerCase().replace(/\s+/g, '_')}`;
                                const visibleComments = post.isCommentsExpanded ? post.comments : post.comments.slice(-1);

                                return (
                                <article key={post.id} className="bg-white rounded-none sm:rounded-[24px] shadow-sm border-y sm:border border-gray-100 w-full overflow-hidden flex flex-col mb-6">
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-lg">
                                                {post.author.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="leading-tight">
                                                <h3 className="font-bold text-gray-900 text-[15px]">{post.author}</h3>
                                                <p className="text-gray-400 text-[13px] font-medium">{userHandle}</p>
                                            </div>
                                        </div>
                                        <button className="text-gray-400 hover:text-gray-900 transition-colors p-2">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
                                        </button>
                                    </div>

                                    <div className="w-full bg-gray-50 relative cursor-pointer" onDoubleClick={() => handleLikePost(post.id)}>
                                        <img src={post.image} alt={post.catName} className="w-full object-cover max-h-[600px]" />
                                    </div>

                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <div className="flex gap-4">
                                            <button onClick={() => handleLikePost(post.id)} className={`transition-transform active:scale-75 ${post.hasLiked ? 'text-[#d946ef]' : 'text-gray-300 hover:text-gray-400'}`}>
                                                <svg className="w-[26px] h-[26px]" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/>
                                                </svg>
                                            </button>
                                            <button onClick={() => toggleComments(post.id)} className={`transition-transform active:scale-75 ${post.showCommentInput ? 'text-[#d946ef]' : 'text-gray-300 hover:text-gray-400'}`}>
                                                <svg className="w-[26px] h-[26px]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.03 2 11c0 2.822 1.488 5.334 3.93 6.947V22l4.137-2.285C10.67 19.897 11.325 20 12 20c5.523 0 10-4.03 10-9s-4.477-9-10-9z"/></svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="px-4 pb-4 flex flex-col gap-1.5">
                                        <p className="font-bold text-gray-900 text-sm">{post.likes} paws</p>
                                        <p className="text-gray-800 text-[14px] leading-snug">
                                            <span className="font-bold text-gray-900 mr-2">{post.author}</span>
                                            {post.description}
                                        </p>
                                    </div>

                                    <div className={`px-4 pb-4 space-y-4 ${post.isCommentsExpanded ? 'max-h-[250px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2' : ''}`}>

                                        {post.comments.length > 1 && !post.isCommentsExpanded && (
                                            <button
                                                onClick={() => toggleComments(post.id)}
                                                className="text-sm font-medium text-gray-400 hover:text-[#d946ef] transition-colors"
                                            >
                                                View all {post.comments.length} comments
                                            </button>
                                        )}

                                        {visibleComments.map(comment => (
                                            <div key={comment.id} className="flex items-start gap-2.5 group">

                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-fuchsia-100 to-purple-100 text-[#d946ef] flex items-center justify-center font-bold text-[13px] shrink-0 shadow-sm mt-0.5">
                                                    {comment.author ? comment.author.charAt(0).toUpperCase() : '🐈'}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="bg-gray-50 rounded-[20px] rounded-tl-sm px-3.5 py-2.5 relative">
                                                        <span className="font-bold text-gray-900 text-[13px] block mb-0.5">{comment.author}</span>

                                                        {editingCommentId === comment.id ? (
                                                            <div className="mt-1 flex flex-col items-end gap-2 w-full">
                                                                <input type="text" value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} className="w-full border-b border-[#d946ef] outline-none text-sm py-1 bg-transparent" />
                                                                <div className="flex gap-2">
                                                                    <button onClick={handleCancelEdit} className="text-xs font-bold text-gray-400">Cancel</button>
                                                                    <button onClick={() => handleSaveEdit(post.id)} className="text-xs font-bold text-[#d946ef]">Save</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-700 text-[14px] leading-snug break-words">{comment.text}</span>
                                                        )}
                                                    </div>

                                                    {comment.isMine && editingCommentId !== comment.id && (
                                                        <div className="flex items-center gap-3 mt-1.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEditing(comment)} className="text-[11px] font-bold text-gray-400 hover:text-[#d946ef]">Edit</button>
                                                            <button onClick={() => handleDeleteComment(post.id, comment.id)} className="text-[11px] font-bold text-gray-400 hover:text-red-400">Delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {post.showCommentInput && (
                                        <div className="px-4 py-3 border-t border-gray-50">
                                            <form onSubmit={(e) => handleAddCommentToPost(e, post.id)} className="flex gap-2">
                                                <input type="text" autoFocus value={post.newCommentText} onChange={(e) => handleCommentChange(post.id, e.target.value)} placeholder="Add a comment..." className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent" />
                                                <button type="submit" className={`text-sm font-bold ${post.newCommentText.trim() ? 'text-[#d946ef]' : 'text-purple-200'}`}>Post</button>
                                            </form>
                                        </div>
                                    )}
                                </article>
                            )})}

                            <div className="text-center py-10">
                                <span className="text-4xl block mb-3 opacity-80">🐈</span>
                                <p className="text-gray-400 font-bold text-lg">Meow! You're all caught up for today.</p>
                                <p className="text-gray-400 text-sm mt-1">Come back later for a fresh batch of fluffiness 🐾</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rating' && (
                        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 w-full mb-12">
                            <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                                <span className="text-2xl">🏆</span> Fluffy Leaderboard
                            </h3>

                            <div className="flex bg-gray-50 p-1 rounded-xl w-fit mb-6">
                                <button
                                    onClick={() => setRatingPeriod('daily')}
                                    className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${ratingPeriod === 'daily' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Daily
                                </button>
                                <button
                                    onClick={() => setRatingPeriod('monthly')}
                                    className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${ratingPeriod === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Monthly
                                </button>
                            </div>

                            {displayLeaderboard.length === 0 ? (
                                <p className="text-center text-gray-500 py-10">Leaderboard is empty. Be the first to post a cat! 🐾</p>
                            ) : (
                                <div className="space-y-5">
                                    {displayLeaderboard.map(cat => (
                                        <div key={cat.id} className="flex items-center gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                            <span className={`font-black w-6 text-center text-lg ${cat.rank === 1 ? 'text-yellow-500' : cat.rank === 2 ? 'text-gray-400' : cat.rank === 3 ? 'text-orange-400' : 'text-gray-300'}`}>
                                                #{cat.rank}
                                            </span>

                                            <img src={cat.img} alt={cat.name} className={`w-14 h-14 rounded-2xl object-cover shadow-sm ${cat.rank === 1 ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`} />

                                            <div className="flex-1">
                                                <div className="font-bold text-gray-900 text-[16px]">
                                                    {cat.name} <span className="text-gray-400 font-medium text-[13px] ml-1">{cat.owner}</span>
                                                </div>
                                                <div className="text-[14px] text-gray-600 font-bold flex items-center gap-1 mt-0.5">
                                                    <svg className="w-3.5 h-3.5 text-[#d946ef]" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/></svg>
                                                    {cat.paws} paws
                                                </div>
                                            </div>
                                            <span className={`text-[12px] font-black uppercase tracking-wide bg-gray-50 px-2 py-1 rounded-lg ${cat.color}`}>
                                                {cat.trend}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'addCat' && <AddCat onAdded={() => { setActiveTab('home'); window.location.reload(); }} />}

                    {/* 🚨 ОСЬ ВОНО: Рендеримо новий ізольований компонент! */}
                    {activeTab === 'tasks' && <TasksPage BASE_URL={BASE_URL} />}

                    {activeTab === 'explore' && <ExploreMap isLoggedIn={isLoggedIn} setShowAuthModal={setShowAuthModal} />}

                    {activeTab === 'auth' && (
                        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 w-full mt-4">
                            <h2 className="text-2xl font-black text-center text-gray-900 mb-6">{authMode === 'login' ? 'Welcome Back! 🐈' : 'Create a Fluffy Account 🐾'}</h2>
                            <form className="space-y-4" onSubmit={handleAuthSubmit}>
                                {authMode === 'register' && <div><label className="block text-sm font-bold text-gray-700 mb-1">Your Name / Username</label><input type="text" required value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#d946ef]" /></div>}
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Your Email</label><input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#d946ef]" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-1">Secret Password</label><input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-[#d946ef]" /></div>
                                <button type="submit" className="w-full bg-[#d946ef] text-white font-bold py-3.5 rounded-xl mt-2 shadow-sm hover:-translate-y-0.5 transition-all">{authMode === 'login' ? 'Log In' : 'Join Us'}</button>
                                <p className="text-center text-sm text-gray-500 font-medium pt-2">
                                    {authMode === 'login' ? <>Not with us yet? <button type="button" onClick={() => setAuthMode('register')} className="text-[#d946ef]">Sign up</button></> : <>Already in the clowder? <button type="button" onClick={() => setAuthMode('login')} className="text-[#d946ef]">Log in</button></>}
                                </p>
                            </form>
                        </div>
                    )}

                    {activeTab === 'mycats' && <h2 className="text-2xl font-bold text-gray-400 text-center mt-10">Your Fluffies (In Dev)</h2>}
                    {activeTab === 'profile' && <h2 className="text-2xl font-bold text-gray-400 text-center mt-10">Your Profile (In Dev)</h2>}
                    {activeTab === 'ads' && <Ads />}

                </main>

                {/* 2.2. RIGHT WIDGETS (DESKTOP) */}
                <aside className="w-[300px] ml-8 hidden lg:block shrink-0 pt-0">

                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                            <span className="text-xl">🏆</span> Top Cats Today
                        </h3>

                        {widgetTopCats.length === 0 ? (
                            <p className="text-gray-400 text-sm italic">Loading leaders...</p>
                        ) : (
                            <div className="space-y-4">
                                {widgetTopCats.map(cat => (
                                    <div key={cat.id} className="flex items-center gap-3">
                                        <span className="text-gray-400 font-bold text-sm w-4">{cat.rank}</span>
                                        <img src={cat.img} alt={cat.name} className="w-10 h-10 rounded-xl object-cover" />
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-900 text-sm leading-tight">{cat.name}</div>
                                            <div className="text-[11px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                                               <svg className="w-2.5 h-2.5 text-[#d946ef]" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/></svg>
                                               {cat.paws}
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-bold ${cat.color}`}>{cat.trend}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button onClick={() => setActiveTab('rating')} className="w-full mt-6 text-[#d946ef] font-bold text-sm hover:underline">
                            View Full Leaderboard
                        </button>
                    </div>

                    <div className="mt-6 px-2">
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-gray-400 mb-3">
                            <a href="#" className="hover:text-gray-600">About</a>
                            <a href="#" className="hover:text-gray-600">Help</a>
                            <a href="#" className="hover:text-gray-600">Privacy</a>
                            <a href="#" className="hover:text-gray-600">Terms</a>
                        </div>
                        <p className="text-[12px] text-gray-400">© 2024 OnlyCats Inc.</p>
                    </div>

                </aside>

            </div>
        </div>

        {/* --- ACCESS DENIED MODAL --- */}
        {showAuthModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative">
                    <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <div className="flex flex-col items-center text-center mt-2">
                        <div className="w-20 h-20 bg-[#fdf4ff] rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">🥺</span>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Oops, paws off!</h3>
                        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                            To pet cats, leave comments, and give paws, you need to join our fluffy family 🐾
                        </p>
                        <div className="flex w-full gap-3">
                            <button onClick={() => { setShowAuthModal(false); setActiveTab('auth'); setAuthMode('register'); }} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold py-3.5 rounded-xl text-sm transition-colors">Sign Up</button>
                            <button onClick={() => { setShowAuthModal(false); setActiveTab('auth'); setAuthMode('login'); }} className="flex-1 bg-[#d946ef] hover:bg-[#c026d3] text-white font-bold py-3.5 rounded-xl text-sm shadow-sm transition-colors">Log In</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- WELCOME MODAL --- */}
        {showWelcomeModal && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[32px] p-10 max-w-md w-full text-center shadow-xl">
                    <div className="w-16 h-16 bg-[#fdf4ff] text-[#d946ef] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8.5 7c-1.38 0-2.5-1.12-2.5-2.5S7.12 2 8.5 2 11 3.12 11 4.5 9.88 7 8.5 7zm7 0c-1.38 0-2.5-1.12-2.5-2.5S14.12 2 15.5 2 18 3.12 18 4.5 16.88 7 15.5 7zM5.5 12c-1.38 0-2.5-1.12-2.5-2.5S4.12 7 5.5 7 8 8.12 8 9.5 6.88 12 5.5 12zm13 0c-1.38 0-2.5-1.12-2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5zM12 22c-3.31 0-6-2.69-6-6 0-2.5 1.5-4.5 3.5-5.5.83-.41 1.67-.5 2.5-.5s1.67.09 2.5.5c2 1 3.5 3 3.5 5.5 0 3.31-2.69 6-6 6z"/></svg>
                    </div>
                    <h2 className="text-2xl font-black mb-2">{welcomeTitle}</h2>
                    <p className="text-gray-500 mb-8 text-sm">{welcomeDesc}</p>
                    <button onClick={() => { setShowWelcomeModal(false); setActiveTab('home'); }} className="w-full bg-[#d946ef] text-white font-bold py-4 rounded-2xl shadow-sm">Let's go to the cats 🐾</button>
                </div>
            </div>
        )}

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 flex justify-around items-center p-2 z-50 pb-safe">
            <button onClick={() => setActiveTab('home')} className={`p-3 rounded-2xl transition-colors ${activeTab === 'home' ? 'text-[#d946ef] bg-[#fdf4ff]' : 'text-gray-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            </button>
            <button onClick={() => setActiveTab('explore')} className={`p-3 rounded-2xl transition-colors ${activeTab === 'explore' ? 'text-[#d946ef] bg-[#fdf4ff]' : 'text-gray-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </button>
            <button onClick={() => { if(!isLoggedIn) return setShowAuthModal(true); setActiveTab('addCat'); }} className="bg-[#d946ef] text-white p-3.5 rounded-full shadow-[0_4px_14px_rgba(217,70,239,0.4)] -mt-8 border-4 border-[#fafafa] transition-transform active:scale-95">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            </button>
            <button onClick={() => setActiveTab('rating')} className={`p-3 rounded-2xl transition-colors ${activeTab === 'rating' ? 'text-[#d946ef] bg-[#fdf4ff]' : 'text-gray-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </button>
            <button onClick={() => setActiveTab(isLoggedIn ? 'profile' : 'auth')} className={`p-3 rounded-2xl transition-colors ${activeTab === 'profile' || activeTab === 'auth' ? 'text-[#d946ef] bg-[#fdf4ff]' : 'text-gray-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            </button>
        </div>

    </div>
  );
}