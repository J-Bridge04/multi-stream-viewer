import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Grid, Maximize2 } from 'lucide-react';

export default function MultiStreamViewer() {
  const [streams, setStreams] = useState([
    { id: 1, url: '', platform: 'twitch', username: '' }
  ]);
  const [layout, setLayout] = useState('grid');
  const [twitchToken, setTwitchToken] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [suggestions, setSuggestions] = useState({});
  const [activeSuggestions, setActiveSuggestions] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [expandedStreams, setExpandedStreams] = useState({});
  const debounceTimers = useRef({});

  // Get Twitch OAuth token on component mount
  useEffect(() => {
    const getTwitchToken = async () => {
      try {
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: import.meta.env.VITE_TWITCH_CLIENT_ID,
            client_secret: import.meta.env.VITE_TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials',
          }).toString(),
        });

        if (!response.ok) {
          throw new Error('Failed to get Twitch token');
        }

        const data = await response.json();
        setTwitchToken(data.access_token);
      } catch (error) {
        console.error('Error getting Twitch token:', error);
      }
    };

    getTwitchToken();

    // Check for OAuth callback
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const token = params.get('access_token');
      const scope = params.get('scope');

      if (token && scope) {
        // Store token and get user info
        setUserToken(token);
        localStorage.setItem('twitchUserToken', token);

        // Get user info
        try {
          const response = await fetch('https://api.twitch.tv/helix/users', {
            headers: {
              'Client-ID': import.meta.env.VITE_TWITCH_CLIENT_ID,
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const user = data.data[0];
            setUserData({
              id: user.id,
              login: user.login,
              display_name: user.display_name,
              profile_image_url: user.profile_image_url,
            });
            localStorage.setItem('twitchUserData', JSON.stringify(user));
          }
        } catch (error) {
          console.error('Error getting user info:', error);
        }

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        // Check localStorage for existing token
        const savedToken = localStorage.getItem('twitchUserToken');
        const savedUserData = localStorage.getItem('twitchUserData');
        if (savedToken) {
          setUserToken(savedToken);
        }
        if (savedUserData) {
          setUserData(JSON.parse(savedUserData));
        }
      }
    };

    handleOAuthCallback();
  }, []);

  // Search for Twitch channels
  const searchTwitchChannels = async (query, streamId) => {
    if (!query || !twitchToken) {
      setSuggestions(prev => ({ ...prev, [streamId]: [] }));
      return;
    }

    try {
      const response = await fetch(
        `https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=5`,
        {
          headers: {
            'Client-ID': import.meta.env.VITE_TWITCH_CLIENT_ID,
            'Authorization': `Bearer ${twitchToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search channels');
      }

      const data = await response.json();
      const channelNames = data.data.map(channel => channel.broadcaster_login);
      setSuggestions(prev => ({ ...prev, [streamId]: channelNames }));
    } catch (error) {
      console.error('Error searching channels:', error);
    }
  };

  // Debounced search handler
  const handleSearchInput = (streamId, value) => {
    updateStream(streamId, 'username', value);

    // Clear existing timer
    if (debounceTimers.current[streamId]) {
      clearTimeout(debounceTimers.current[streamId]);
    }

    // Set new timer
    debounceTimers.current[streamId] = setTimeout(() => {
      searchTwitchChannels(value, streamId);
    }, 300);
  };

  // Handle suggestion click
  const selectSuggestion = (streamId, channelName) => {
    updateStream(streamId, 'username', channelName);
    setSuggestions(prev => ({ ...prev, [streamId]: [] }));
    setActiveSuggestions(null);
  };

  // Twitch sign in
  const handleTwitchSignIn = () => {
    const clientId = import.meta.env.VITE_TWITCH_CLIENT_ID;
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const scope = 'user:read:email';

    const authUrl = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;

    window.location.href = authUrl;
  };

  // Logout
  const handleLogout = () => {
    setUserToken(null);
    setUserData(null);
    localStorage.removeItem('twitchUserToken');
    localStorage.removeItem('twitchUserData');
  };

  const addStream = () => {
    setStreams([...streams, { 
      id: Date.now(), 
      url: '', 
      platform: 'twitch',
      username: '' 
    }]);
  };

  const signIn = () => {
    // Placeholder for sign-in logic
    alert('Sign-in functionality is not implemented yet.');
  };

  const removeStream = (id) => {
    setStreams(streams.filter(s => s.id !== id));
  };

  const updateStream = (id, field, value) => {
    setStreams(streams.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const getEmbedUrl = (stream) => {
    if (!stream.username) return '';
    
    switch(stream.platform) {
      case 'twitch':
        return `https://player.twitch.tv/?channel=${stream.username}&parent=${window.location.hostname}`;
      case 'youtube':
        // Username can be video ID or channel handle
        const isVideoId = stream.username.length === 11;
        return isVideoId 
          ? `https://www.youtube.com/embed/${stream.username}?autoplay=1`
          : `https://www.youtube.com/embed/live_stream?channel=${stream.username}&autoplay=1`;
      case 'kick':
        return `https://player.kick.com/${stream.username}`;
      default:
        return '';
    }
  };

  const getGridClass = () => {
    const count = streams.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    return 'grid-cols-3';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Multi-Stream Viewer</h1>
          <div className="flex items-center gap-2">
            {userData ? (
              <div className="flex items-center gap-3 bg-green-900 px-4 py-2 rounded-lg">
                <img 
                  src={userData.profile_image_url} 
                  alt={userData.display_name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium">{userData.display_name}</span>
                <button
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={handleTwitchSignIn}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
              >
                <Plus size={20}/>
                Sign in with Twitch
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          {/* Left sidebar - stream controls */}
          <div className={`flex-shrink-0 space-y-2 transition-all duration-300 ${showSidebar ? 'w-72' : 'w-14'}`}>
            <div className="flex items-center gap-2">
              <button
                onClick={addStream}
                className={`flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-sm transition flex-1 ${!showSidebar ? 'px-1' : ''}`}
              >
                <Plus size={16} />
                {showSidebar && 'Add Stream'}
              </button>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sm transition"
              >
                {showSidebar ? '◀' : '▶'}
              </button>
            </div>
            
            {showSidebar && streams.map((stream, index) => (
              <div key={stream.id} className="bg-gray-800 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedStreams(prev => ({
                    ...prev,
                    [stream.id]: !prev[stream.id]
                  }))}
                  className="w-full bg-gray-800 hover:bg-gray-700 p-2 flex items-center justify-between transition"
                >
                  <span className="text-gray-400 font-mono text-sm">#{index + 1}</span>
                  <span className="text-sm">{expandedStreams[stream.id] ? '▼' : '▶'}</span>
                </button>

                {expandedStreams[stream.id] && (
                  <div className="p-2 border-t border-gray-700 space-y-2">
                    <select
                      value={stream.platform}
                      onChange={(e) => updateStream(stream.id, 'platform', e.target.value)}
                      className="w-full bg-gray-700 px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-purple-500 text-sm mb-2"
                    >
                      <option value="twitch">Twitch</option>
                      <option value="youtube">YouTube</option>
                      <option value="kick">Kick</option>
                    </select>

                    <div className="relative mb-2">
                      <input
                        type="text"
                        value={stream.username}
                        onChange={(e) => {
                          if (stream.platform === 'twitch') {
                            handleSearchInput(stream.id, e.target.value);
                          } else {
                            updateStream(stream.id, 'username', e.target.value);
                          }
                        }}
                        onFocus={() => setActiveSuggestions(stream.id)}
                        onBlur={() => setTimeout(() => setActiveSuggestions(null), 100)}
                        placeholder={
                          stream.platform === 'twitch' ? 'Channel name' :
                          stream.platform === 'youtube' ? 'Video ID or @handle' :
                          'Channel name'
                        }
                        className="w-full bg-gray-700 px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-purple-500 text-sm"
                      />
                      
                      {/* Suggestions Dropdown */}
                      {stream.platform === 'twitch' && 
                        activeSuggestions === stream.id && 
                        suggestions[stream.id]?.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded z-10">
                          {suggestions[stream.id].map((suggestion, idx) => (
                            <div
                              key={idx}
                              onClick={() => selectSuggestion(stream.id, suggestion)}
                              className="px-2 py-1 hover:bg-gray-600 cursor-pointer text-xs"
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {streams.length > 1 && (
                      <button
                        onClick={() => removeStream(stream.id)}
                        className="w-full text-red-400 hover:text-red-300 p-1 text-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right side - video grid */}
          <div className="flex-1">
            <div className={`grid ${getGridClass()} gap-4`}>
              {streams.map((stream) => {
                const embedUrl = getEmbedUrl(stream);
                return (
                  <div key={stream.id} className="bg-gray-800 rounded-lg overflow-hidden aspect-video">
                    {embedUrl ? (
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allowFullScreen
                        allow="autoplay; encrypted-media; picture-in-picture"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Grid size={48} className="mx-auto mb-2 opacity-50" />
                          <p>Enter a {stream.platform} channel name</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Quick Guide:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li><strong>Twitch:</strong> Enter the channel name (e.g., "shroud")</li>
            <li><strong>YouTube:</strong> Enter the video ID (11 characters) or @handle for live streams</li>
            <li><strong>Kick:</strong> Enter the channel name</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

