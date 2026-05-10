import { useCallback, useState } from 'react';
import AddCat from './AddCat';
import Ads from './Ads';
import ExploreMap from './ExploreMap';
import ProfilePage from './ProfilePage';
import RatingPage from './RatingPage';
import TasksPage from './TasksPage';
import AppModals from './app/components/AppModals';
import AppShell from './app/components/AppShell';
import AuthPageCard from './app/components/AuthPageCard';
import HomeFeed from './app/components/HomeFeed';
import { BASE_URL, getTabTitle } from './app/constants';
import { useAuth } from './app/hooks/useAuth';
import { useFeedPosts } from './app/hooks/useFeedPosts';
import { getStoredUsername } from './app/utils/authStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [targetProfileId, setTargetProfileId] = useState(null);
  const [outOfLikesModal, setOutOfLikesModal] = useState(false);

  const {
    authMode,
    setAuthMode,
    authForm,
    updateAuthField,
    handleAuthSubmit,
    isLoggedIn,
    getMyUserId,
    logout,
    showAuthModal,
    setShowAuthModal,
    closeAuthModal,
    showWelcomeModal,
    closeWelcomeModal,
    welcomeTitle,
    welcomeDesc,
  } = useAuth(BASE_URL);

  const requireAuth = useCallback(() => setShowAuthModal(true), [setShowAuthModal]);

  const {
    feedPosts,
    topCats,
    editingCommentId,
    editCommentText,
    setEditCommentText,
    fetchFeedPosts,
    handleLikePost,
    toggleComments,
    handleCommentChange,
    handleAddCommentToPost,
    deleteComment,
    startEditing,
    cancelEditing,
    saveEditedComment,
  } = useFeedPosts({
    baseUrl: BASE_URL,
    isLoggedIn,
    getMyUserId,
    onAuthRequired: requireAuth,
    onOutOfLikes: () => setOutOfLikesModal(true),
  });

  const openAuthTab = useCallback(
    (mode) => {
      setAuthMode(mode);
      setShowAuthModal(false);
      setActiveTab('auth');
    },
    [setAuthMode, setShowAuthModal],
  );

  const handleSelectTab = useCallback((tabId) => setActiveTab(tabId), []);

  const handleSelectOwnProfile = useCallback(() => {
    setTargetProfileId(null);
    setActiveTab('profile');
  }, []);

  const handleOpenProfile = useCallback((userId) => {
    setTargetProfileId(userId || null);
    setActiveTab('profile');
  }, []);

  const handleCreatePost = useCallback(() => {
    setActiveTab('addCat');
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setTargetProfileId(null);
    setActiveTab('home');
  }, [logout]);

  const handlePostAdded = useCallback(() => {
    setActiveTab('home');
    void fetchFeedPosts();
  }, [fetchFeedPosts]);

  const tabTitle = getTabTitle(activeTab, targetProfileId);
  const currentUserId = getMyUserId();
  const currentUsername = getStoredUsername();

  let mainContent = null;
  if (activeTab === 'home') {
    mainContent = (
      <HomeFeed
        feedPosts={feedPosts}
        baseUrl={BASE_URL}
        currentUserId={currentUserId}
        currentUsername={currentUsername}
        editingCommentId={editingCommentId}
        editCommentText={editCommentText}
        onSetEditCommentText={setEditCommentText}
        onOpenProfile={handleOpenProfile}
        onLikePost={handleLikePost}
        onToggleComments={toggleComments}
        onCommentChange={handleCommentChange}
        onAddCommentToPost={handleAddCommentToPost}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        onSaveEditedComment={saveEditedComment}
        onDeleteComment={deleteComment}
      />
    );
  } else if (activeTab === 'addCat') {
    mainContent = <AddCat onAdded={handlePostAdded} />;
  } else if (activeTab === 'tasks') {
    mainContent = <TasksPage BASE_URL={BASE_URL} />;
  } else if (activeTab === 'rating') {
    mainContent = <RatingPage BASE_URL={BASE_URL} />;
  } else if (activeTab === 'profile') {
    mainContent = <ProfilePage BASE_URL={BASE_URL} targetUserId={targetProfileId} />;
  } else if (activeTab === 'explore') {
    mainContent = <ExploreMap isLoggedIn={isLoggedIn} setShowAuthModal={setShowAuthModal} />;
  } else if (activeTab === 'auth') {
    mainContent = (
      <AuthPageCard
        authMode={authMode}
        authForm={authForm}
        onChangeMode={setAuthMode}
        onFieldChange={updateAuthField}
        onSubmit={handleAuthSubmit}
      />
    );
  } else if (activeTab === 'ads') {
    mainContent = <Ads />;
  }

  return (
    <>
      <AppShell
        activeTab={activeTab}
        targetProfileId={targetProfileId}
        tabTitle={tabTitle}
        isLoggedIn={isLoggedIn}
        topCats={topCats}
        onSelectTab={handleSelectTab}
        onSelectProfile={handleSelectOwnProfile}
        onCreatePost={handleCreatePost}
        onRequireAuth={requireAuth}
        onOpenAuthTab={openAuthTab}
        onLogout={handleLogout}
        onOpenProfile={handleOpenProfile}
      >
        {mainContent}
      </AppShell>

      <AppModals
        showAuthModal={showAuthModal}
        showOutOfLikesModal={outOfLikesModal}
        showWelcomeModal={showWelcomeModal}
        welcomeTitle={welcomeTitle}
        welcomeDesc={welcomeDesc}
        onCloseAuthModal={closeAuthModal}
        onOpenAuthTab={openAuthTab}
        onCloseOutOfLikesModal={() => setOutOfLikesModal(false)}
        onGoToTasksFromLikesModal={() => {
          setOutOfLikesModal(false);
          setActiveTab('tasks');
        }}
        onCloseWelcomeModal={() => {
          closeWelcomeModal();
          setActiveTab('home');
        }}
      />
    </>
  );
}

