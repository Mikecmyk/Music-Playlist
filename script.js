// script.js

// 1. Element Selections
const audio = document.getElementById("audio");
const playlistsContainer = document.querySelector(".playlists");
const searchBar = document.querySelector(".search-bar");
const searchButton = document.querySelector(".search-button");

const songTitle = document.querySelector(".song-details .title");
const songArtist = document.querySelector(".song-details .artist");
const songCover = document.querySelector(".song-info img");

// Corrected button and input selections
const playPauseBtn = document.getElementById("play-pause-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const progressBar = document.getElementById("progress-bar");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const volumeSlider = document.getElementById("volume-slider");

const homeLink = document.querySelector(".nav-links a.home-link");
const likedSongsLink = document.querySelector(".nav-links a.liked-songs-link");
const libraryLink = document.querySelector(".nav-links a.library-link");
const mainTitle = document.querySelector(".section-title");

// Profile & Login Elements
const profileBtn = document.getElementById("profile-btn");
const profileMenu = document.getElementById("profile-menu");
const profileNameEl = document.getElementById("profile-name");
const logoutBtn = document.getElementById("logout-btn");
const loginPage = document.getElementById("login-page");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMessage = document.getElementById("error-message");
const appContainer = document.getElementById("app-container");
const profileLink = document.getElementById("profile-link");
const settingsLink = document.getElementById("settings-link");
const profileWelcomeName = document.getElementById("profile-welcome-name");
const topArtistsContainer = document.querySelector("#profile-view .artist-list");
const settingsVolumeControl = document.getElementById("volume-control");

// New Sign-up elements
const showSignupLink = document.getElementById("show-signup-link");
const showLoginLink = document.getElementById("show-login-link");
const loginFormContainer = document.getElementById("login-form-container");
const signupFormContainer = document.getElementById("signup-form-container");
const signupForm = document.getElementById("signup-form");
const signupUsernameInput = document.getElementById("signup-username");
const signupPasswordInput = document.getElementById("signup-password");
const signupErrorMessage = document.getElementById("signup-error-message");

// View Elements
const homeView = document.getElementById("home-view");
const profileView = document.getElementById("profile-view");
const settingsView = document.getElementById("settings-view");

// Responsive Elements
const sidebar = document.getElementById("sidebar");
const hamburgerMenu = document.getElementById("hamburger-menu");

// 2. Global State
let songs = [];
let currentSongIndex = 0;
let isPlaying = false;
let currentView = 'home';
let activeMenu = null;
let loggedInUser = null;

// 3. API & Data Handling Functions

// New function to create a user-specific key
function getUserStorageKey(key) {
    if (!loggedInUser) {
        console.error("No user logged in. Cannot create user-specific key.");
        return key;
    }
    return `${loggedInUser}_${key}`;
}

async function fetchSongsFromAPI(query) {
    try {
        playlistsContainer.innerHTML = '<p style="text-align: center; margin-top: 50px;">Searching for songs...</p>';
        const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=20`;
        const response = await fetch(url);
        const data = await response.json();
        songs = data.results;
        renderPlaylists(songs);
    } catch (error) {
        console.error("Error fetching data:", error);
        playlistsContainer.innerHTML = "<p style='text-align: center; margin-top: 50px;'>Could not load songs. Please try again later.</p>";
    }
}

// Update getSongsFromLocalStorage to use the user-specific key
function getSongsFromLocalStorage(key) {
    const userKey = getUserStorageKey(key);
    const storedSongs = localStorage.getItem(userKey);
    return storedSongs ? JSON.parse(storedSongs) : [];
}

// Update saveSongToLocalStorage to use the user-specific key
function saveSongToLocalStorage(key, song) {
    const userKey = getUserStorageKey(key);
    const storedSongs = getSongsFromLocalStorage(key);
    if (!storedSongs.some(s => s.trackId === song.trackId)) {
        storedSongs.push(song);
        localStorage.setItem(userKey, JSON.stringify(storedSongs));
        const viewName = key === 'likedSongs' ? 'Liked Songs' : 'Library';
        alert(`${song.trackName} has been added to your ${viewName}!`);
    } else {
        const viewName = key === 'likedSongs' ? 'Liked Songs' : 'Library';
        alert(`${song.trackName} is already in your ${viewName}.`);
    }
}

// Update removeSongFromLocalStorage to use the user-specific key
function removeSongFromLocalStorage(key, trackId) {
    const userKey = getUserStorageKey(key);
    const storedSongs = getSongsFromLocalStorage(key);
    const updatedSongs = storedSongs.filter(song => song.trackId !== trackId);
    localStorage.setItem(userKey, JSON.stringify(updatedSongs));
    
    if (currentView === 'likedSongs' && key === 'likedSongs') {
        songs = updatedSongs;
        renderPlaylists(songs);
    } else if (currentView === 'library' && key === 'myMusicLibrary') {
        songs = updatedSongs;
        renderPlaylists(songs);
    }
}

function savePlaybackState() {
    if (audio.src && songs[currentSongIndex]) {
        const state = {
            trackId: songs[currentSongIndex].trackId,
            currentTime: audio.currentTime,
            currentView: currentView,
            user: loggedInUser
        };
        localStorage.setItem('playbackState', JSON.stringify(state));
    }
}

async function loadPlaybackState() {
    const savedState = localStorage.getItem('playbackState');
    if (savedState) {
        const state = JSON.parse(savedState);
        const savedTrackId = state.trackId;
        
        // Only load if the saved state belongs to the current user
        if (state.user !== loggedInUser) {
            return;
        }

        if (state.currentView === 'likedSongs') {
            currentView = 'likedSongs';
            songs = getSongsFromLocalStorage('likedSongs');
            mainTitle.textContent = 'Liked Songs';
        } else if (state.currentView === 'library') {
            currentView = 'library';
            songs = getSongsFromLocalStorage('myMusicLibrary');
            mainTitle.textContent = 'Your Library';
        } else {
            const initialSongs = await fetchSongsFromAPI("Ed Sheeran");
            songs = initialSongs || [];
            currentView = 'home';
            mainTitle.textContent = 'Good Evening';
        }
        
        const songToLoadIndex = songs.findIndex(s => s.trackId === savedTrackId);
        
        if (songToLoadIndex !== -1) {
            loadAndPlaySong(songToLoadIndex);
            audio.currentTime = state.currentTime;
            pauseSong();
        }
    }
}

function saveUserCredentials(username, password) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    users[username] = password;
    localStorage.setItem('users', JSON.stringify(users));
}

function getUserCredentials(username) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    return users[username];
}

// 4. UI Rendering Functions
function renderPlaylists(songList) {
    playlistsContainer.innerHTML = "";
    if (songList.length === 0) {
        playlistsContainer.innerHTML = "<p style='text-align: center; margin-top: 50px;'>No songs found.</p>";
        return;
    }

    songList.forEach((song, index) => {
        const playlistElement = document.createElement("div");
        playlistElement.classList.add("playlist");
        playlistElement.dataset.index = index;
        playlistElement.dataset.trackId = song.trackId;

        let menuItemsHtml = '';
        if (currentView === 'home' || currentView === 'search-results') {
            menuItemsHtml = `
                <li><button class="add-to-liked-btn">Save to Liked Songs</button></li>
                <li><button class="add-to-library-btn">Add to Library</button></li>
            `;
        } else if (currentView === 'likedSongs') {
            menuItemsHtml = `
                <li><button class="remove-from-liked-btn">Remove from Liked Songs</button></li>
            `;
        } else if (currentView === 'library') {
            menuItemsHtml = `
                <li><button class="remove-from-library-btn">Remove from Your Library</button></li>
            `;
        }
        
        playlistElement.innerHTML = `
            <img src="${song.artworkUrl100}" alt="Album cover for ${song.trackName}">
            <div class="playlist-title">${song.trackName}</div>
            <div class="playlist-desc">${song.artistName}</div>
            <div class="play-button"><span>▶</span></div>
            <button class="menu-btn" title="More Options">...</button>
            <ul class="dropdown-menu">
                ${menuItemsHtml}
            </ul>
        `;

        const playBtn = playlistElement.querySelector(".play-button");
        playBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            loadAndPlaySong(index);
        });

        const menuBtn = playlistElement.querySelector(".menu-btn");
        if (menuBtn) {
            menuBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                const menu = playlistElement.querySelector(".dropdown-menu");
                if (activeMenu && activeMenu !== menu) {
                    activeMenu.classList.remove('visible');
                }
                menu.classList.toggle('visible');
                activeMenu = menu.classList.contains('visible') ? menu : null;
            });
        }
        
        const addToLikedBtn = playlistElement.querySelector(".add-to-liked-btn");
        if (addToLikedBtn) {
            addToLikedBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                saveSongToLocalStorage('likedSongs', song);
                const menu = event.target.closest('.dropdown-menu');
                menu.classList.remove('visible');
                activeMenu = null;
            });
        }
        
        const addToLibraryBtn = playlistElement.querySelector(".add-to-library-btn");
        if (addToLibraryBtn) {
            addToLibraryBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                saveSongToLocalStorage('myMusicLibrary', song);
                const menu = event.target.closest('.dropdown-menu');
                menu.classList.remove('visible');
                activeMenu = null;
            });
        }

        const removeFromLikedBtn = playlistElement.querySelector(".remove-from-liked-btn");
        if (removeFromLikedBtn) {
            removeFromLikedBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                const trackId = parseInt(playlistElement.dataset.trackId);
                removeSongFromLocalStorage('likedSongs', trackId);
            });
        }
        
        const removeFromLibraryBtn = playlistElement.querySelector(".remove-from-library-btn");
        if (removeFromLibraryBtn) {
            removeFromLibraryBtn.addEventListener("click", (event) => {
                event.stopPropagation();
                const trackId = parseInt(playlistElement.dataset.trackId);
                removeSongFromLocalStorage('myMusicLibrary', trackId);
            });
        }

        playlistsContainer.appendChild(playlistElement);
    });
}

function showView(viewId) {
    const views = [homeView, profileView, settingsView];
    views.forEach(view => view.classList.remove("active"));
    document.getElementById(viewId).classList.add("active");
}

function renderProfile() {
    showView("profile-view");
    mainTitle.textContent = "Your Profile";
    profileWelcomeName.textContent = loggedInUser;
    
    const likedSongs = getSongsFromLocalStorage('likedSongs');
    const artists = {};
    likedSongs.forEach(song => {
        if (artists[song.artistName]) {
            artists[song.artistName].count++;
        } else {
            artists[song.artistName] = {
                count: 1,
                imageUrl: song.artworkUrl100.replace('100x100bb', '600x600bb')
            };
        }
    });

    const sortedArtists = Object.entries(artists).sort(([, a], [, b]) => b.count - a.count);
    topArtistsContainer.innerHTML = sortedArtists.slice(0, 5).map(([artistName, data]) => `
        <div class="artist-item">
            <img src="${data.imageUrl}" alt="${artistName}">
            <span>${artistName}</span>
        </div>
    `).join('');
}

function renderSettings() {
    showView("settings-view");
    mainTitle.textContent = "Settings";
}

// 5. Music Player Logic Functions
function playSong() {
    isPlaying = true;
    playPauseBtn.textContent = "⏸";
    audio.play();
}

function pauseSong() {
    isPlaying = false;
    playPauseBtn.textContent = "▶";
    audio.pause();
}

function loadAndPlaySong(index) {
    if (index < 0 || index >= songs.length) return;
    
    const song = songs[index];
    if (!song || !song.previewUrl) {
        alert("This song preview is not available.");
        return;
    }
    
    audio.src = song.previewUrl;
    songTitle.textContent = song.trackName;
    songArtist.textContent = song.artistName;
    songCover.src = song.artworkUrl100.replace('100x100bb', '600x600bb');
    
    currentSongIndex = index;
    
    playSong();
}

function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadAndPlaySong(currentSongIndex);
}

function prevSong() {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadAndPlaySong(currentSongIndex);
}

function updateProgressBar() {
    if (!audio.duration) return;
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.value = progress || 0;
    
    let minutes = Math.floor(audio.currentTime / 60);
    let seconds = Math.floor(audio.currentTime % 60);
    seconds = seconds < 10 ? `0${seconds}` : seconds;
    currentTimeEl.textContent = `${minutes}:${seconds}`;

    let dMinutes = Math.floor(audio.duration / 60);
    let dSeconds = Math.floor(audio.duration % 60);
    dSeconds = dSeconds < 10 ? `0${dSeconds}` : dSeconds;
    durationEl.textContent = `${dMinutes}:${dSeconds}`;
}

// 6. Event Listeners
searchBar.addEventListener("keyup", (event) => {
    if (event.key === "Enter" && event.target.value.trim().length > 0) {
        mainTitle.textContent = 'Search Results';
        currentView = 'search-results';
        fetchSongsFromAPI(event.target.value);
    }
});

searchButton.addEventListener("click", () => {
    const query = searchBar.value.trim();
    if (query.length > 0) {
        mainTitle.textContent = 'Search Results';
        currentView = 'search-results';
        fetchSongsFromAPI(query);
    }
});

playlistsContainer.addEventListener("click", (event) => {
    const playlistElement = event.target.closest(".playlist");
    if (playlistElement) {
        const index = parseInt(playlistElement.dataset.index);
        
        if (currentView === 'library') {
            songs = getSongsFromLocalStorage('myMusicLibrary');
        } else if (currentView === 'likedSongs') {
            songs = getSongsFromLocalStorage('likedSongs');
        }
        
        loadAndPlaySong(index);
    }
});

playPauseBtn.addEventListener("click", () => {
    if (isPlaying) {
        pauseSong();
    } else {
        if (audio.src) {
            playSong();
        }
    }
});

nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);
audio.addEventListener("timeupdate", updateProgressBar);
audio.addEventListener("ended", nextSong);

progressBar.addEventListener("change", (e) => {
    const seekTime = (e.target.value / 100) * audio.duration;
    audio.currentTime = seekTime;
});

volumeSlider.addEventListener("input", (e) => {
    audio.volume = e.target.value / 100;
});

// Sidebar and Navigation
homeLink.addEventListener("click", (event) => {
    event.preventDefault();
    mainTitle.textContent = "Good Evening";
    currentView = 'home';
    fetchSongsFromAPI("Ed Sheeran"); // Load default songs
    showView("home-view");
});

likedSongsLink.addEventListener("click", (event) => {
    event.preventDefault();
    mainTitle.textContent = "Liked Songs";
    currentView = 'likedSongs';
    songs = getSongsFromLocalStorage('likedSongs');
    renderPlaylists(songs);
    showView("home-view");
});

libraryLink.addEventListener("click", (event) => {
    event.preventDefault();
    mainTitle.textContent = "Your Library";
    currentView = 'library';
    songs = getSongsFromLocalStorage('myMusicLibrary');
    renderPlaylists(songs);
    showView("home-view");
});

// Profile and Settings
profileBtn.addEventListener("click", () => {
    profileMenu.classList.toggle("show");
});

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("playbackState");
    loginPage.style.display = "flex";
    appContainer.style.display = "none";
    loggedInUser = null;
    audio.pause();
});

profileLink.addEventListener("click", (event) => {
    event.preventDefault();
    renderProfile();
    profileMenu.classList.remove("show");
});

settingsLink.addEventListener("click", (event) => {
    event.preventDefault();
    renderSettings();
    profileMenu.classList.remove("show");
});

// Login and Sign-up
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const storedPassword = getUserCredentials(username);

    if (storedPassword === password) {
        localStorage.setItem('loggedInUser', username);
        loggedInUser = username;
        showMainApp();
    } else {
        errorMessage.textContent = "Invalid username or password.";
        errorMessage.style.display = "block";
    }
});

signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = signupUsernameInput.value.trim();
    const password = signupPasswordInput.value.trim();
    if (getUserCredentials(username)) {
        signupErrorMessage.textContent = "Username already exists. Please choose a different one.";
        signupErrorMessage.style.display = "block";
    } else {
        saveUserCredentials(username, password);
        alert("Account created successfully! You can now log in.");
        loginFormContainer.style.display = "block";
        signupFormContainer.style.display = "none";
        signupUsernameInput.value = "";
        signupPasswordInput.value = "";
    }
});

showSignupLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginFormContainer.style.display = "none";
    signupFormContainer.style.display = "block";
});

showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginFormContainer.style.display = "block";
    signupFormContainer.style.display = "none";
});

// Helper functions for UI
function showMainApp() {
    loginPage.style.display = "none";
    appContainer.style.display = "flex";
    profileNameEl.textContent = loggedInUser;
    mainTitle.textContent = "Good Evening";
    fetchSongsFromAPI("Ed Sheeran");
    loadPlaybackState();
    updateVolumeFromSettings();
}

function checkLoginStatus() {
    loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        showMainApp();
    } else {
        loginPage.style.display = "flex";
        appContainer.style.display = "none";
    }
}

function updateVolumeFromSettings() {
    const savedVolume = settingsVolumeControl.value;
    volumeSlider.value = savedVolume;
    audio.volume = savedVolume / 100;
}

// Close dropdown menus when clicking outside
window.addEventListener('click', (event) => {
    if (activeMenu && !event.target.closest('.playlist')) {
        activeMenu.classList.remove('visible');
        activeMenu = null;
    }
});

// Responsive Logic
function handleResponsiveUI() {
    if (window.innerWidth <= 768) {
        // Mobile view
        sidebar.classList.add('hidden');
        hamburgerMenu.style.display = 'block';
    } else {
        // Desktop view
        sidebar.classList.remove('hidden');
        hamburgerMenu.style.display = 'none';
    }
}

hamburgerMenu.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
});

// Initial calls
window.addEventListener('DOMContentLoaded', checkLoginStatus);
window.addEventListener('load', handleResponsiveUI);
window.addEventListener('resize', handleResponsiveUI);

// Additional event listener for the settings volume control
settingsVolumeControl.addEventListener("input", (e) => {
    const volume = e.target.value;
    volumeSlider.value = volume;
    audio.volume = volume / 100;
});