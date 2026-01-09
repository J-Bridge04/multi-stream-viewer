# Multi-Stream Viewer

A modern web application for watching multiple live streams simultaneously from Twitch, YouTube, and Kick. Heavily inspired by [teamstream.gg](https://teamstream.gg).

![Multi-Stream Viewer](https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)

## ✨ Features

- 🎥 **Multi-Platform Support** - Watch streams from Twitch, YouTube, and Kick simultaneously
- 🔍 **Twitch Channel Search** - Real-time search suggestions powered by Twitch API
- 🔐 **Twitch Authentication** - Sign in with your Twitch account
- 📱 **Responsive Grid Layout** - Automatically adjusts based on number of streams
- 🎛️ **Collapsible Sidebar** - Minimize the control panel for maximum viewing space
- 🗂️ **Individual Stream Controls** - Each stream has its own expandable controls
- 🎨 **Modern UI** - Clean, dark-themed interface built with Tailwind CSS

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Twitch Developer Account (for API access)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/J-Bridge04/multi-stream-viewer.git
cd multi-stream-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_TWITCH_CLIENT_ID=your_twitch_client_id
VITE_TWITCH_CLIENT_SECRET=your_twitch_client_secret
```

4. Get Twitch API credentials:
   - Go to https://dev.twitch.tv/console/apps
   - Create a new application
   - Set OAuth Redirect URL to `http://localhost:5173/callback`
   - Copy your Client ID and Client Secret to the `.env` file

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:5173 in your browser

## 🎮 Usage

### Adding Streams

1. Click the **"Add Stream"** button in the sidebar
2. Select the platform (Twitch, YouTube, or Kick)
3. Enter the channel name or video ID:
   - **Twitch**: Channel name (e.g., "shroud") - features autocomplete
   - **YouTube**: Video ID (11 characters) or @handle for live streams
   - **Kick**: Channel name

### Managing Streams

- **Collapse Sidebar**: Click the ◀ button to minimize the control panel
- **Collapse Individual Stream**: Click the ▶ arrow next to each stream number
- **Remove Stream**: Click the trash icon on any stream (minimum 1 stream required)

### Twitch Sign In

- Click **"Sign in with Twitch"** to authenticate
- Enables enhanced features and personalized experience
- Your session is saved in local storage

### Whats To Come
- Youtube and Kick Sign in authorizations
- Searchable Youtube and Kick streams
- The ability to check if a user is banned on twitch/Kick/youtube for the purpose of streaming this site

## 🛠️ Built With

- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - Icons
- [Twitch API](https://dev.twitch.tv/docs/api/) - Channel search and authentication

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Heavily inspired by [teamstream.gg](https://teamstream.gg)
- Built with the amazing tools and communities behind React, Vite, and Tailwind CSS

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/J-Bridge04/multi-stream-viewer/issues).

## 📧 Contact

Created by [@J-Bridge04](https://github.com/J-Bridge04)

---

**Note**: This is an independent project and is not affiliated with Twitch, YouTube, Kick, or teamstream.gg.
