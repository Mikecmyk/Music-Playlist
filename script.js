// script.js

// 1. Element Selections
const audio = document.getElementById("audio");
const playlistsContainer = document.querySelector(".playlists");
const searchBar = document.querySelector(".search-bar");
const searchButton = document.querySelector(".search-button");

const songTitle = document.querySelector(".song-details .title");
const songArtist = document.querySelector(".song-details .artist");
const songCover = document.querySelector(".song-info img");

const playPauseBtn = document.querySelector(".control-buttons button:nth-child(2)");
const prevBtn = document.querySelector(".control-buttons button:nth-child(1)");
const nextBtn = document.querySelector(".control-buttons button:nth-child(3)");
const progressBar = document.querySelector(".progress-bar input");
const currentTimeEl = document.querySelector(".progress-bar span:nth-child(1)");
const durationEl = document.querySelector(".progress-bar span:nth-child(3)");
const volumeSlider = document.querySelector(".volume input");

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

// View Elements
const homeView = document.getElementById("home-view");
const profileView = document.getElementById("profile-view");
const settingsView = document.getElementById("settings-view");

// 2. Global State
let songs = [];
let currentSongIndex = 0;
let isPlaying = false;
let currentView = 'home';
let activeMenu = null;
let loggedInUser = null;

// 3. API & Data Handling Functions
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

function getSongsFromLocalStorage(key) {
    const storedSongs = localStorage.getItem(key);
    return storedSongs ? JSON.parse(storedSongs) : [];
}

function saveSongToLocalStorage(key, song) {
    const storedSongs = getSongsFromLocalStorage(key);
    if (!storedSongs.some(s => s.trackId === song.trackId)) {
        storedSongs.push(song);
        localStorage.setItem(key, JSON.stringify(storedSongs));
        const viewName = key === 'likedSongs' ? 'Liked Songs' : 'Library';
        alert(`${song.trackName} has been added to your ${viewName}!`);
    } else {
        const viewName = key === 'likedSongs' ? 'Liked Songs' : 'Library';
        alert(`${song.trackName} is already in your ${viewName}.`);
    }
}

function removeSongFromLocalStorage(key, trackId) {
    const storedSongs = getSongsFromLocalStorage(key);
    const updatedSongs = storedSongs.filter(song => song.trackId !== trackId);
    localStorage.setItem(key, JSON.stringify(updatedSongs));
    
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
            currentView: currentView
        };
        localStorage.setItem('playbackState', JSON.stringify(state));
    }
}

async function loadPlaybackState() {
    const savedState = localStorage.getItem('playbackState');
    if (savedState) {
        const state = JSON.parse(savedState);
        const savedTrackId = state.trackId;
        
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

progressBar.addEventListener("input", () => {
    const seekTime = (progressBar.value / 100) * audio.duration;
    audio.currentTime = seekTime;
});

audio.addEventListener("timeupdate", updateProgressBar);
audio.addEventListener("ended", nextSong);

volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value / 100;
});

// Profile and view switching event listeners
profileBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    profileMenu.classList.toggle('show');
});

document.addEventListener('click', () => {
    profileMenu.classList.remove('show');
});

profileMenu.addEventListener('click', (event) => {
    event.stopPropagation();
});

profileLink.addEventListener('click', () => {
    profileMenu.classList.remove('show');
    renderProfile();
});

settingsLink.addEventListener('click', () => {
    profileMenu.classList.remove('show');
    renderSettings();
});

logoutBtn.addEventListener('click', () => {
    // Stop the music when the user logs out
    audio.pause();
    isPlaying = false;
    playPauseBtn.textContent = "▶";

    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('playbackState');
    checkLoginStatus();
});

loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Check against the hardcoded credentials
    if (username === "Mziza" && password === "12345678") {
        localStorage.setItem('loggedInUser', "Mziza");
        errorMessage.style.display = 'none';
        checkLoginStatus();
    } else {
        errorMessage.textContent = 'Wrong username or password.';
        errorMessage.style.display = 'block';
    }
});

// 7. Initial Call & Authentication Check
function checkLoginStatus() {
    loggedInUser = localStorage.getItem('loggedInUser');
    if (loggedInUser) {
        loginPage.style.display = 'none';
        appContainer.style.display = 'block';
        profileNameEl.textContent = loggedInUser;
        loadPlaybackState();
    } else {
        loginPage.style.display = 'flex';
        appContainer.style.display = 'none';
        usernameInput.value = '';
        passwordInput.value = '';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    checkLoginStatus();
});

// Update the volume slider on the settings page
settingsVolumeControl.addEventListener('input', (event) => {
    audio.volume = event.target.value / 100;
    volumeSlider.value = event.target.value;
});

// Make sure the main music player volume slider updates the settings slider
volumeSlider.addEventListener('input', (event) => {
    audio.volume = event.target.value / 100;
    settingsVolumeControl.value = event.target.value;
});

homeLink.addEventListener('click', (event) => {
    event.preventDefault();
    currentView = 'home';
    showView("home-view");
    mainTitle.textContent = 'Good Evening';
    fetchSongsFromAPI("Ed Sheeran");
});

likedSongsLink.addEventListener('click', (event) => {
    event.preventDefault();
    currentView = 'likedSongs';
    showView("home-view");
    mainTitle.textContent = 'Liked Songs';
    songs = getSongsFromLocalStorage('likedSongs');
    renderPlaylists(songs);
});

libraryLink.addEventListener('click', (event) => {
    event.preventDefault();
    currentView = 'library';
    showView("home-view");
    mainTitle.textContent = 'Your Library';
    songs = getSongsFromLocalStorage('myMusicLibrary');
    renderPlaylists(songs);
});

// Save playback state before the user leaves the page
window.addEventListener('beforeunload', savePlaybackState);