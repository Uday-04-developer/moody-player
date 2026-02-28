import React, { useState } from 'react';
import './SongRecommendations.css';
import GradientText from './gradienttext';




export default function SongRecommendations({title,songs}) {
  // 1. Hook is called at the very top (Correct placement)
  // We store the index of the currently playing song (or null if stopped)
  const [playingIndex, setPlayingIndex] = useState(null);

  const handlePlayClick = (index) => {
    // If clicking the song that is already playing, stop it (set to null)
    // Otherwise, set this new index as the playing one
    if (playingIndex === index) {
      setPlayingIndex(null);
    } else {
      setPlayingIndex(index);
    }
  };

  return (
    <div className="section glass">
      <div className="mb-6  ">
        <GradientText
          colors={['#492eb8', '#8785ff', '#8c6cf4','#ffffff','#787878','#ff6b6b']} // You can change these hex codes!
          animationSpeed={6}
          showBorder={false}
          className="text-3xl caveat-unique  font-bold"
        >
          {title}
        </GradientText>
      </div>



      {songs.length === 0 ? (
        <p className="empty-message kalam-light" style={{ textAlign: "center", padding: "20px", opacity: 0.7 }}>
          No songs found for this mood yet!
        </p>
      ) : (
        // If there ARE songs, do the normal map function
        songs.map((song, index) => (
          <div key={index} className="song-row">
            <div className="song-details">
              <div className="song-title">{song.title}</div>
              <div className="song-artist">{song.artist}</div>
            </div>
            
            <div 
              className="play-icon-circle" 
              onClick={() => handlePlayClick(index)}
            >
              {playingIndex === index ? (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 5H8V19H6V5ZM16 5H18V19H16V5Z"></path>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.3944 12.0001L10 7.7371V16.263L16.3944 12.0001ZM19.376 12.4161L8.77735 19.4818C8.54759 19.635 8.23715 19.5729 8.08397 19.3432C8.02922 19.261 8 19.1645 8 19.0658V4.93433C8 4.65818 8.22386 4.43433 8.5 4.43433C8.59871 4.43433 8.69522 4.46355 8.77735 4.5183L19.376 11.584C19.6057 11.7372 19.6678 12.0477 19.5146 12.2774C19.478 12.3323 19.4309 12.3795 19.376 12.4161Z"></path>
                </svg>
              )}
            </div>
          </div>
        ))
      )} {/* <-- Don't forget this closing bracket! */}
    </div>
  );
}