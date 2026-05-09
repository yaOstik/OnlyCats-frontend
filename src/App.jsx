import React, { useState, useEffect } from 'react';
import Ads from './Ads';
import AddCat from './AddCat';
import ExploreMap from './ExploreMap';
import TasksPage from './TasksPage';
import RatingPage from './RatingPage';
import ProfilePage from './ProfilePage';

// --- РОЗУМНИЙ КОМПОНЕНТ АВАТАРКИ ---
const UserAvatar = ({ userId, username, BASE_URL, className }) => {
  const [hasError, setHasError] = useState(false);
  const avatarUrl = userId ? `${BASE_URL}/profiles/${userId}/avatar` : null;

  if (!avatarUrl || hasError) {
    return (
      <div className={`rounded-full bg-gradient-to-tr from-fuchsia-100 to-purple-50 text-[#d946ef] flex items-center justify-center font-black ${className}`}>
        {username ? username.charAt(0).toUpperCase() : '🐈'}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={username}
      onError={() => setHasError(true)}
      className={`rounded-full object-cover bg-white shadow-sm ${className}`}
    />
  );
};

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
  const [outOfLikesModal, setOutOfLikesModal] = useState(false);
  const [welcomeTitle, setWelcomeTitle] = useState('');
  const [welcomeDesc, setWelcomeDesc] = useState('');

  const [targetProfileId, setTargetProfileId] = useState(null);

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
        const actualUserId = post.user_id || post.userId || post.owner?.id;

        const rawComments = allCommentsData[index] || [];
        const formattedComments = rawComments.map(c => {
            const isMine = String(c.user_id) === String(myUserId);
            const authorName = c.author_username || c.authorUsername || c.username || (isMine ? (myLocalName || "You") : `User ${c.user_id}`);
            return {
                id: c.id,
                userId: c.user_id,
                author: authorName,
                text: c.content,
                isMine: isMine
            };
        });

        return {
          id: post.id,
          userId: actualUserId,
          author: postAuthor,
          catName: post.title || "Fluffy",
          age: post.cat_age,
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

  const widgetTopCats = [...feedPosts]
    .filter(p => p.likes > 0)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3)
    .map((post, index) => {
        let style = { color: 'text-gray-500', bg: 'bg-gray-100', ring: 'ring-gray-200' };
        if (index === 0) style = { color: 'text-yellow-700', bg: 'bg-yellow-100', ring: 'ring-yellow-400' };
        if (index === 1) style = { color: 'text-gray-700', bg: 'bg-gray-200', ring: 'ring-gray-300' };
        if (index === 2) style = { color: 'text-orange-800', bg: 'bg-orange-100', ring: 'ring-orange-300' };

        return { ...post, rank: index + 1, style };
    });

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
        if (response.status === 403) {
            setOutOfLikesModal(true);
        } else if (response.status === 401) {
            alert("Your session expired. Please log out and log in again! 🐾");
        }
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      setFeedPosts(currentPosts => currentPosts.map(post => {
          if (post.id === postId) return { ...post, hasLiked: !isLikingNow, likes: !isLikingNow ? post.likes + 1 : Math.max(0, post.likes - 1) };
          return post;
      }));
    }
  };

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
                        userId: c.user_id,
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
    const myUserId = getMyUserId();

    setFeedPosts(posts => posts.map(p => {
      if (p.id === postId) {
        return {
            ...p,
            comments: [...p.comments, { id: tempId, userId: myUserId, author: myLocalName, text: text, isMine: true }],
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
          case 'profile': return targetProfileId ? 'User Profile' : 'My Profile';
          case 'auth': return 'Join Us';
          case 'addCat': return 'Post a Cat';
          default: return 'OnlyCats';
      }
  }

  // 🐾 СУЦІЛЬНА КЛАСИЧНА ЛАПКА ЯК НА СКРІНШОТІ
  const PawIcon = ({ className }) => (
    <svg viewBox="0 0 512 512" fill="currentColor" className={className || "w-6 h-6"}>
        <path d="M226.5 92.9c14.3 7.3 28.9 23 39.5 44.9 10.6-21.9 25.2-37.6 39.5-44.9 16.8-8.6 36.1-9.5 50.8-3.4 18.2 7.5 28.8 25.4 30.7 44.9 1.7 17.5-6.8 35.1-20.7 48.7-18.7 18.3-48 29.8-80.3 35.4-32.3-5.6-61.6-17.1-80.3-35.4-13.9-13.6-22.4-31.2-20.7-48.7 1.9-19.5 12.5-37.4 30.7-44.9 14.7-6.1 34-.5 50.8 3.4zM96.7 167.3c15-6.2 34.3-.5 51.1 8 14.3 7.3 28.9 23 39.5 44.9-20.6 8.3-39 21.6-53.1 39-16.1-23.7-39.6-43.2-64.8-55-13.9-6.5-22.4-24.1-20.7-41.6 1.9-19.5 12.5-37.4 30.7-44.9 5.8-2.4 11.9-3 17.3-2.9v-7.5zm318.6 0c15-6.2 34.3-.5 51.1 8 18.2 7.5 28.8 25.4 30.7 44.9 1.7 17.5-6.8 35.1-20.7 48.7-18.7 18.3-48 29.8-80.3 35.4-14.1-17.4-32.5-30.7-53.1-39 10.6-21.9 25.2-37.6 39.5-44.9 16.8-8.6 36.1-9.5 50.8-3.4-6.1-2.4-12.2-3-18-2.9v-7.5zM256 304.5c42.4 0 83.2 16.4 115.1 46.5 26.2 24.7 43.1 57.3 48.3 93.3 2.1 14.3-10.4 25.7-24.9 25.7H117.5c-14.5 0-27-11.4-24.9-25.7 5.2-36 22.1-68.6 48.3-93.3 31.9-30.1 72.7-46.5 115.1-46.5z"/>
    </svg>
  );

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans relative text-gray-800 selection:bg-fuchsia-200">

        <style>
        {`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
        `}
        </style>

        {/* 1. LEFT SIDEBAR */}
        <div className="w-[260px] bg-white flex flex-col hidden md:flex shrink-0 z-10 border-r border-gray-100 shadow-[2px_0_15px_rgba(0,0,0,0.02)]">

            {/* 🚨 ТУТ ТОЧНО ТАКЕ ЛОГО ЯК НА СКРІНШОТІ */}
            <div className="p-6 pt-8 pb-8 flex items-center gap-3">
                <div className="w-[42px] h-[42px] bg-[#d946ef] rounded-[12px] flex items-center justify-center text-white shadow-sm shrink-0">
                   <PawIcon className="w-[22px] h-[22px]" />
                </div>
                <h1 className="text-[24px] font-black tracking-tight text-[#0f172a] mt-0.5">OnlyCats</h1>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {[
                    { id: 'home', label: 'Feed', path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                    { id: 'explore', label: 'Map', path: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                    { id: 'rating', label: 'Leaderboard', path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                    { id: 'tasks', label: 'Tasks', path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
                    { id: 'profile', label: 'Profile', path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
                ].map(item => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === 'profile') setTargetProfileId(null);
                                setActiveTab(item.id);
                            }}
                            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[18px] font-bold transition-all ${
                                isActive && (!targetProfileId || item.id !== 'profile') ? 'bg-[#fdf4ff] text-[#d946ef] shadow-sm border border-fuchsia-50' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                            }`}
                        >
                            <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="w-full bg-[#d946ef] hover:bg-[#c026d3] text-white font-bold py-4 px-4 rounded-[18px] flex items-center justify-center gap-3 transition-transform hover:-translate-y-1 shadow-[0_4px_15px_rgba(217,70,239,0.3)]"
                >
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-lg font-black leading-none pb-0.5">+</div>
                    Post Cat
                </button>

                {isLoggedIn ? (
                    <button onClick={handleLogout} className="w-full mt-4 text-sm font-bold text-gray-400 hover:text-red-400 transition-colors">
                        Log Out
                    </button>
                ) : (
                    <div className="mt-4 flex flex-col gap-2">
                        <button onClick={() => { setActiveTab('auth'); setAuthMode('register'); }} className="w-full text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl transition-colors">
                            Sign Up
                        </button>
                        <button onClick={() => { setActiveTab('auth'); setAuthMode('login'); }} className="w-full text-sm font-bold text-[#d946ef] bg-[#fdf4ff] hover:bg-fuchsia-100 py-3 rounded-xl transition-colors">
                            Log In
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* 2. MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col overflow-hidden relative">

            {/* ДЕСКТОП ХІДЕР */}
            <header className="h-[80px] hidden md:flex items-center justify-between px-8 shrink-0 bg-transparent z-10">
                <h2 className="text-[24px] font-black text-gray-900 tracking-tight">{getTabTitle()}</h2>
                <div className="flex items-center gap-5">
                    <button className="text-gray-400 hover:text-[#d946ef] transition-colors bg-white p-2.5 rounded-full shadow-sm border border-gray-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></button>
                    <button className="text-gray-400 hover:text-[#d946ef] transition-colors relative bg-white p-2.5 rounded-full shadow-sm border border-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#d946ef] border-2 border-white rounded-full"></div>
                    </button>
                </div>
            </header>

            {/* 📱 МОБАЙЛ-ХІДЕР */}
            <div className="md:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl px-5 py-3 shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex items-center justify-between">

                {/* 🚨 ТУТ ТОЧНО ТАКЕ ЛОГО ЯК НА СКРІНШОТІ */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-[#d946ef] rounded-[8px] flex items-center justify-center text-white shadow-sm shrink-0">
                        <PawIcon className="w-4 h-4" />
                    </div>
                    <h1 className="text-[20px] font-black text-[#0f172a] tracking-tight mt-0.5">OnlyCats</h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('explore')}
                        className={`p-2 rounded-full transition-colors ${activeTab === 'explore' ? 'text-[#d946ef] bg-fuchsia-50' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </button>
                    {!isLoggedIn && (
                        <button onClick={() => setShowAuthModal(true)} className="text-[13px] font-bold text-[#d946ef] bg-[#fdf4ff] px-4 py-2 rounded-xl">Log In</button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-y-auto px-0 md:px-8 pb-32 md:pb-8 pt-4 md:pt-0">

                <main className="flex-1 max-w-[620px] w-full mx-auto flex flex-col">

                    {/* DYNAMIC ROUTING */}
                    {activeTab === 'home' && (
                        <div className="w-full space-y-6 md:space-y-8">
                            {feedPosts.map((post) => {
                                const userHandle = `@${post.author.toLowerCase().replace(/\s+/g, '_')}`;
                                const visibleComments = post.isCommentsExpanded ? post.comments : post.comments.slice(-1);

                                return (
                                <article key={post.id} className="bg-white mx-3 sm:mx-0 rounded-[28px] sm:rounded-[32px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 w-auto sm:w-full overflow-hidden flex flex-col">

                                    {/* ХІДЕР ПОСТА */}
                                    <div className="px-5 py-4 flex items-center justify-between">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer group"
                                            onClick={() => { setTargetProfileId(post.userId); setActiveTab('profile'); }}
                                        >
                                            <UserAvatar
                                                userId={post.userId}
                                                username={post.author}
                                                BASE_URL={BASE_URL}
                                                className="w-11 h-11 text-lg group-hover:ring-2 ring-[#d946ef] ring-offset-2 transition-all"
                                            />
                                            <div className="leading-tight">
                                                <h3 className="font-bold text-gray-900 text-[15px] group-hover:text-[#d946ef] transition-colors">{post.author}</h3>
                                                <p className="text-gray-400 text-[13px] font-medium">{userHandle}</p>
                                            </div>
                                        </div>
                                        <button className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-50">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
                                        </button>
                                    </div>

                                    {/* ФОТО КОТИКА */}
                                    <div className="w-full bg-gray-50 relative cursor-pointer sm:px-2" onDoubleClick={() => handleLikePost(post.id)}>
                                        <img src={post.image} alt={post.catName} className="w-full rounded-[16px] sm:rounded-[24px] object-cover max-h-[600px] shadow-sm" />
                                    </div>

                                    {/* ПАНЕЛЬ ІНСТРУМЕНТІВ */}
                                    <div className="px-5 py-3 flex items-center justify-between mt-1">
                                        <div className="flex gap-4">
                                            <button onClick={() => handleLikePost(post.id)} className={`transition-all active:scale-75 hover:-translate-y-0.5 ${post.hasLiked ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}>
                                                <svg className="w-[30px] h-[30px] drop-shadow-sm" fill={post.hasLiked ? "currentColor" : "none"} stroke={post.hasLiked ? "currentColor" : "currentColor"} strokeWidth={post.hasLiked ? "0" : "2"} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => toggleComments(post.id)} className={`transition-all active:scale-75 hover:-translate-y-0.5 ${post.showCommentInput ? 'text-[#d946ef]' : 'text-gray-300 hover:text-[#d946ef]'}`}>
                                                <svg className="w-[30px] h-[30px] drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* ІНФОРМАЦІЯ ПРО КОТИКА */}
                                    <div className="px-5 pb-4 flex flex-col gap-2">
                                        <p className="font-black text-gray-900 text-[15px] flex items-center gap-1">
                                            {post.likes} {post.likes === 1 ? 'star' : 'stars'} <span className="text-yellow-400">⭐</span>
                                        </p>

                                        <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col gap-1.5 mt-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-[17px] text-gray-900 tracking-tight">{post.catName}</span>
                                                {post.age && post.age !== "Age unknown" && (
                                                    <span className="bg-white border border-fuchsia-100 text-[#d946ef] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm">
                                                        {post.age}
                                                    </span>
                                                )}
                                            </div>
                                            {post.description && (
                                                <p className="text-gray-700 text-[14px] leading-relaxed">
                                                    {post.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* СЕКЦІЯ КОМЕНТАРІВ */}
                                    <div className={`px-5 pb-5 space-y-4 ${post.isCommentsExpanded ? 'max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-3' : ''}`}>
                                        {post.comments.length > 1 && !post.isCommentsExpanded && (
                                            <button
                                                onClick={() => toggleComments(post.id)}
                                                className="text-[13px] font-bold text-gray-400 hover:text-[#d946ef] transition-colors uppercase tracking-wider"
                                            >
                                                View all {post.comments.length} comments
                                            </button>
                                        )}

                                        {visibleComments.map(comment => (
                                            <div key={comment.id} className="flex items-start gap-3 group">
                                                <UserAvatar
                                                    userId={comment.userId}
                                                    username={comment.author}
                                                    BASE_URL={BASE_URL}
                                                    className="w-9 h-9 text-[13px] shrink-0 mt-0.5"
                                                />

                                                <div className="flex-1">
                                                    <div className="bg-gray-50 rounded-[20px] rounded-tl-sm px-4 py-3 relative border border-transparent group-hover:border-gray-100 transition-colors">
                                                        <span
                                                            className="font-bold text-gray-900 text-[13px] block mb-1 cursor-pointer hover:text-[#d946ef] transition-colors"
                                                            onClick={() => { setTargetProfileId(comment.userId); setActiveTab('profile'); }}
                                                        >
                                                            {comment.author}
                                                        </span>

                                                        {editingCommentId === comment.id ? (
                                                            <div className="mt-1 flex flex-col items-end gap-2 w-full">
                                                                <input type="text" value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} className="w-full border-b-2 border-[#d946ef] outline-none text-sm py-1 bg-transparent font-medium" />
                                                                <div className="flex gap-3 mt-1">
                                                                    <button onClick={handleCancelEdit} className="text-xs font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                                                                    <button onClick={() => handleSaveEdit(post.id)} className="text-xs font-black text-[#d946ef] hover:text-[#c026d3]">Save</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-700 text-[14px] leading-snug break-words font-medium">{comment.text}</span>
                                                        )}
                                                    </div>

                                                    {comment.isMine && editingCommentId !== comment.id && (
                                                        <div className="flex items-center gap-4 mt-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => startEditing(comment)} className="text-[11px] font-bold text-gray-400 hover:text-[#d946ef]">Edit</button>
                                                            <button onClick={() => handleDeleteComment(post.id, comment.id)} className="text-[11px] font-bold text-gray-400 hover:text-red-400">Delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {post.showCommentInput && (
                                        <div className="px-5 py-4 border-t border-gray-50 bg-gray-50/50">
                                            <form onSubmit={(e) => handleAddCommentToPost(e, post.id)} className="flex items-center gap-3">
                                                <UserAvatar
                                                    userId={getMyUserId()}
                                                    username={localStorage.getItem('username')}
                                                    BASE_URL={BASE_URL}
                                                    className="w-8 h-8 text-[12px] shrink-0"
                                                />
                                                <input type="text" autoFocus value={post.newCommentText} onChange={(e) => handleCommentChange(post.id, e.target.value)} placeholder="Add a fluffy comment..." className="flex-1 text-[15px] font-medium outline-none placeholder-gray-400 bg-transparent" />
                                                <button type="submit" className={`text-[15px] font-black tracking-wide ${post.newCommentText.trim() ? 'text-[#d946ef]' : 'text-fuchsia-200'}`}>Post</button>
                                            </form>
                                        </div>
                                    )}
                                </article>
                            )})}

                            <div className="text-center py-6 pb-10">
                                <div className="text-gray-300 flex justify-center mb-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-[12px] flex items-center justify-center text-gray-300 shadow-sm shrink-0">
                                        <PawIcon className="w-6 h-6" />
                                    </div>
                                </div>
                                <p className="text-gray-400 font-bold text-[15px]">Meow! You're all caught up.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'addCat' && <AddCat onAdded={() => { setActiveTab('home'); window.location.reload(); }} />}
                    {activeTab === 'tasks' && <TasksPage BASE_URL={BASE_URL} />}
                    {activeTab === 'rating' && <RatingPage BASE_URL={BASE_URL} />}
                    {activeTab === 'profile' && <ProfilePage BASE_URL={BASE_URL} targetUserId={targetProfileId} />}
                    {activeTab === 'explore' && <ExploreMap isLoggedIn={isLoggedIn} setShowAuthModal={setShowAuthModal} />}

                    {activeTab === 'auth' && (
                        <div className="bg-white mx-3 sm:mx-0 p-8 rounded-[32px] shadow-sm border border-gray-100 w-auto mt-4">
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

                    {activeTab === 'ads' && <Ads />}

                </main>

                <aside className="w-[320px] ml-8 hidden lg:block shrink-0 pt-0">
                    <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 relative overflow-hidden">

                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br from-yellow-100 to-orange-50 rounded-full opacity-60 blur-2xl pointer-events-none"></div>

                        <h3 className="font-black text-gray-900 mb-5 flex items-center gap-2 text-[18px] relative z-10">
                            <span className="text-xl">🏆</span> Fluffy League
                        </h3>

                        {widgetTopCats.length === 0 ? (
                            <div className="text-center py-6 relative z-10">
                                <p className="text-gray-400 text-sm font-medium">No ratings yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 relative z-10">
                                {widgetTopCats.map((cat, index) => (
                                    <div
                                      key={cat.id}
                                      onClick={() => { setTargetProfileId(cat.userId); setActiveTab('profile'); }}
                                      className="flex items-center gap-3 group cursor-pointer p-2 -mx-2 rounded-2xl hover:bg-gray-50 transition-colors"
                                    >
                                        <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-black text-[13px] shadow-sm ${cat.style.bg} ${cat.style.color}`}>
                                            {cat.rank}
                                        </div>

                                        <div className="relative">
                                            {index === 0 && <span className="absolute -top-3 -right-2 text-sm z-10 drop-shadow-sm">👑</span>}
                                            <img src={cat.image} alt={cat.catName} className="w-12 h-12 rounded-[14px] object-cover shadow-sm group-hover:scale-105 transition-transform duration-300" />
                                        </div>

                                        <div className="flex-1 min-w-0 ml-1">
                                            <div className="font-black text-gray-900 text-[15px] leading-tight truncate group-hover:text-[#d946ef] transition-colors">{cat.catName}</div>
                                            <div className="text-[12px] text-gray-500 font-bold flex items-center gap-1 mt-0.5">
                                                <span className="text-yellow-400 text-sm">⭐</span>
                                                {cat.likes} stars
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setActiveTab('rating')}
                            className="w-full mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 border border-yellow-100 font-black tracking-wide py-3.5 rounded-xl transition-all hover:shadow-md active:scale-95 text-sm relative z-10"
                        >
                            View Leaderboard
                        </button>
                    </div>

                    <div className="mt-6 px-4 text-center">
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[12px] font-bold text-gray-300 mb-3">
                            <a href="#" className="hover:text-gray-500 transition-colors">About</a>
                            <a href="#" className="hover:text-gray-500 transition-colors">Help</a>
                            <a href="#" className="hover:text-gray-500 transition-colors">Privacy</a>
                            <a href="#" className="hover:text-gray-500 transition-colors">Terms</a>
                        </div>
                        <p className="text-[11px] font-bold text-gray-300">© 2024 OnlyCats Inc.</p>
                    </div>
                </aside>

            </div>
        </div>

        {/* --- MODALS --- */}
        {showAuthModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <div className="flex flex-col items-center text-center mt-2">
                        <div className="w-20 h-20 bg-[#d946ef] rounded-[20px] flex items-center justify-center mb-5 text-white shadow-sm">
                            <PawIcon className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Oops, paws off!</h3>
                        <p className="text-gray-500 mb-8 text-[15px] font-medium leading-relaxed">
                            To pet cats, leave comments, and give stars, you need to join our fluffy family 🐾
                        </p>
                        <div className="flex w-full gap-3">
                            <button onClick={() => { setShowAuthModal(false); setActiveTab('auth'); setAuthMode('register'); }} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3.5 rounded-xl text-[15px] transition-colors">Sign Up</button>
                            <button onClick={() => { setShowAuthModal(false); setActiveTab('auth'); setAuthMode('login'); }} className="flex-1 bg-[#d946ef] hover:bg-[#c026d3] text-white font-bold py-3.5 rounded-xl text-[15px] shadow-sm transition-colors">Log In</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* 🚨 МОДАЛКА ЛІМІТУ ЛАЙКІВ (ЗІРОЧОК) */}
        {outOfLikesModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative text-center animate-in zoom-in-95 duration-200 border-4 border-yellow-400">
                    <span className="text-6xl block mb-4 drop-shadow-md">🙀</span>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Out of Stars!</h3>
                    <p className="text-gray-500 mb-6 text-[15px] font-medium leading-relaxed">
                        You've used all your free stars for today. Come back tomorrow or earn bonus stars by doing daily tasks! ⭐
                    </p>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => { setOutOfLikesModal(false); setActiveTab('tasks'); }} className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black py-4 rounded-xl text-[15px] shadow-sm transition-transform active:scale-95">Go to Tasks</button>
                        <button onClick={() => setOutOfLikesModal(false)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl text-sm transition-colors">Maybe later</button>
                    </div>
                </div>
            </div>
        )}

        {showWelcomeModal && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-[32px] p-10 max-w-md w-full text-center shadow-xl animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 bg-[#d946ef] rounded-[20px] text-white mx-auto mb-5 flex items-center justify-center shadow-sm">
                        <PawIcon className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black mb-3 tracking-tight text-gray-900">{welcomeTitle}</h2>
                    <p className="text-gray-500 mb-8 text-[15px] font-medium leading-relaxed">{welcomeDesc}</p>
                    <button onClick={() => { setShowWelcomeModal(false); setActiveTab('home'); }} className="w-full bg-[#d946ef] text-white font-black py-4 rounded-[18px] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-lg tracking-wide">Let's go to the cats 🐾</button>
                </div>
            </div>
        )}

        {/* 📱 ПЛАВАЮЧА iOS-LIKE ПАНЕЛЬ НАВІГАЦІЇ ДЛЯ МОБАЙЛУ */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-6 bg-gradient-to-t from-[#f3f4f6] via-[#f3f4f6]/90 to-transparent pointer-events-none">
            <div className="bg-white/90 backdrop-blur-xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-[24px] flex justify-around items-center p-2 pointer-events-auto">

                {/* HOME */}
                <button onClick={() => setActiveTab('home')} className={`p-3 rounded-[18px] transition-colors ${activeTab === 'home' ? 'text-[#d946ef] bg-[#fdf4ff]' : 'text-gray-400'}`}>
                    <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                </button>

                {/* 🚨 TASKS (ЗАМІСТЬ КАРТИ) */}
                <button onClick={() => setActiveTab('tasks')} className={`p-3 rounded-[18px] transition-colors ${activeTab === 'tasks' ? 'text-[#d946ef] bg-[#fdf4ff]' : 'text-gray-400'}`}>
                    <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                </button>

                {/* ADD POST */}
                <button onClick={() => { if(!isLoggedIn) return setShowAuthModal(true); setActiveTab('addCat'); }} className="bg-[#d946ef] text-white p-3.5 rounded-full shadow-[0_4px_20px_rgba(217,70,239,0.4)] transform -translate-y-4 border-[4px] border-white transition-transform active:scale-95 relative z-10">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M12 4v16m8-8H4"></path></svg>
                </button>

                {/* RATING */}
                <button onClick={() => setActiveTab('rating')} className={`p-3 rounded-[18px] transition-colors ${activeTab === 'rating' ? 'text-[#d946ef] bg-[#fdf4ff]' : 'text-gray-400'}`}>
                    <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </button>

                {/* PROFILE */}
                <button onClick={() => {
                    if (isLoggedIn) {
                        setTargetProfileId(null);
                        setActiveTab('profile');
                    } else {
                        setActiveTab('auth');
                    }
                }} className={`p-3 rounded-[18px] transition-colors ${activeTab === 'profile' || activeTab === 'auth' ? 'text-[#d946ef] bg-[#fdf4ff]' : 'text-gray-400'}`}>
                    <svg className="w-[26px] h-[26px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </button>
            </div>
        </div>

    </div>
  );
}