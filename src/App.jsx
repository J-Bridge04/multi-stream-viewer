import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Trash2, Grid, Maximize2 } from 'lucide-react';

export default function MultiStreamViewer() {
  const [streams, setStreams] = useState([]);
  const [layout, setLayout] = useState('grid');
  const [twitchToken, setTwitchToken] = useState(null);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [followedChannels, setFollowedChannels] = useState([]);
  const [suggestions, setSuggestions] = useState({});
  const [activeSuggestions, setActiveSuggestions] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [expandedStreams, setExpandedStreams] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('twitch');
  const [viewingStreamId, setViewingStreamId] = useState(null);
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
            
            // Fetch followed channels
            try {
              const followsResponse = await fetch(`https://api.twitch.tv/helix/users/follows?user_id=${user.id}&first=100`, {
                headers: {
                  'Client-ID': import.meta.env.VITE_TWITCH_CLIENT_ID,
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (followsResponse.ok) {
                const followsData = await followsResponse.json();
                setFollowedChannels(followsData.data);
              }
            } catch (error) {
              console.error('Error fetching followed channels:', error);
            }
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
    const scope = 'user:read:email user:read:follows';

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
    if (!searchInput.trim()) return;
    if (streams.length >= 12) {
      alert('You can only add a maximum of 12 streams.');
      return;
    }
    if (selectedPlatform === 'kick' || selectedPlatform === 'youtube') {
      alert('⚠️ Warning: If you are streaming this website on Twitch and you pull up a Kick or YouTube streamer, Twitch may ban you. This is not my responsibility.');
    }
    setStreams([...streams, { 
      id: Date.now(), 
      url: '', 
      platform: selectedPlatform,
      username: searchInput.trim()
    }]);
    setSearchInput('');
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

  const getGridColumns = () => {
    const count = streams.length;
    if (count === 0) return 1;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    if (count <= 9) return 3;
    return 4;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex">
      <div className="w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Multi-Stream Viewer</h1>
          <div className="flex items-center gap-3">
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
            {userData && followedChannels.length === 0 && (
              <button
                onClick={() => {
                  const followsResponse = fetch(`https://api.twitch.tv/helix/users/follows?user_id=${userData.id}&first=100`, {
                    headers: {
                      'Client-ID': import.meta.env.VITE_TWITCH_CLIENT_ID,
                      'Authorization': `Bearer ${userToken}`,
                    },
                  }).then(res => res.json()).then(data => {
                    setFollowedChannels(data.data);
                  }).catch(err => console.error('Error loading followed channels:', err));
                }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition text-sm font-medium"
              >
                Load Followed Channels
              </button>
            )}
          </div>
        </div>

        {/* Top section - stream controls */}
        <div className="bg-gray-800 rounded-lg p-3 space-y-2 mb-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addStream()}
              placeholder="Stream name"
              className="flex-1 bg-gray-700 px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-purple-500 text-sm"
            />
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-gray-700 px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-purple-500 text-sm"
            >
              <option value="twitch">Twitch</option>
              <option value="youtube">YouTube</option>
              <option value="kick">Kick</option>
            </select>
            <button
              onClick={addStream}
              className="flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 px-4 py-1 rounded text-sm transition"
            >
              <Plus size={16} />
              Add Stream
            </button>
            <button
              onClick={() => setViewingStreamId(null)}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition"
            >
              View all
            </button>
          </div>

          {/* Stream list */}
          <div className="flex gap-2 flex-wrap">
            {streams.map((stream) => (
              stream.username && (
                <div key={`summary-${stream.id}`} className="bg-gray-700 rounded-lg p-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{stream.username}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => setViewingStreamId(stream.id)}
                      className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => removeStream(stream.id)}
                      className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Followed channels section */}
          {userData && followedChannels.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-white mb-2">Your Followed Channels:</p>
              <div className="flex gap-2 flex-wrap">
                {followedChannels.map((channel) => (
                  <button
                    key={channel.to_id}
                    onClick={() => {
                      if (streams.length >= 12) {
                        alert('You can only add a maximum of 12 streams.');
                        return;
                      }
                      setStreams([...streams, {
                        id: Date.now(),
                        url: '',
                        platform: 'twitch',
                        username: channel.to_login
                      }]);
                    }}
                    className="bg-green-700 hover:bg-green-600 rounded-lg p-2 text-sm font-semibold text-white transition"
                  >
                    + {channel.to_name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {/* Right side - video grid */}
          <div className="flex flex-col">
            <div className={`grid gap-1 w-full h-[800px]`}
              style={{
                gridTemplateColumns: viewingStreamId ? '1fr' : `repeat(${getGridColumns()}, 1fr)`,
                gridAutoRows: 'minmax(0, 1fr)'
              }}>
              {(viewingStreamId ? streams.filter(s => s.id === viewingStreamId) : streams).map((stream) => {
                const embedUrl = getEmbedUrl(stream);
                return (
                  <div key={stream.id} className="bg-gray-800 rounded-lg overflow-hidden">
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
                          <Grid size={96} className="mx-auto mb-2 opacity-50" />
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

        <div className="mt-8 border-t border-gray-700 pt-6 text-center">
          <footer className="text-sm text-gray-400">
            <p>&copy; 2026 StreamHub. All rights reserved.</p>
            <p className="mt-3">
              <a 
                href="https://github.com/J-Bridge04/streamhub" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition underline"
              >
                View on GitHub
              </a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

