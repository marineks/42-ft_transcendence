
import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FriendsList } from './pages/FriendsList';
import { Leaderboard } from './pages/Leaderboard';
import { UserProfile } from './pages/UserProfile';
import Login from './pages/Login';
import './App.css';
import Navbar from './components/Navbar';
import Settings from './pages/Settings';
import Chat from './components/Chat';
import AboutUs from './pages/AboutUs';
import FAQ from './pages/FAQ';

function App() {

  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []); // [] specifies the dependencies array (if empty : runs only when component mounts)

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'kawaii' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div id='app' className={`App ${theme}`}>
    <section id="main-content">
	
	<Navbar theme={theme} toggleTheme={toggleTheme}/>
	<video className='videobg' autoPlay loop muted content="width=device-width, initial-scale=1.0">
		<source src="./assets/bg-video.mp4" type='video/mp4' />
	</video>
	<audio className="music-bg" controls autoPlay loop >
		<source src="./assets/edgerunner.mp3" type="audio/mpeg"/>
	</audio>
		<Routes>
		{/* <Route path="/" element={<Home />} /> */}
		
		<Route path="/leaderboard" element={<Leaderboard />} />
		<Route path='/faq' element={<FAQ />} />
    	<Route path="/aboutUs" element={<AboutUs />} />
		<Route path="/friends" element={<FriendsList />} />
		<Route path='/settings' element={<Settings />} />
		<Route path='/login' element={<Login />} />
		<Route path='/user' element={<UserProfile />} />
		</Routes>
		<Chat/>
    <footer> This website was not generated by an AI :) </footer>
    </section>
    </div>
  );
}

export default App;
