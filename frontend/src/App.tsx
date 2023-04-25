
import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FriendsList } from './pages/FriendsList';
import { Leaderboard } from './pages/Leaderboard';
import { UserProfile } from './pages/UserProfile';
import Login from './pages/Login';
import './App.css';
import Home from './pages/Home'
import Navbar from './components/Navbar';
import Settings from './pages/Settings';
import Chat from './components/Chat';


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

    {/* <Header 
      theme={theme} 
      toggleTheme={toggleTheme}
    /> */}

	<Navbar theme={theme} toggleTheme={toggleTheme}/>

    <section id="main-content">
      {/* <div id="menu"></div> */}

    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/friends" element={<FriendsList />} />
      <Route path="/user" element={<UserProfile />} />
	  <Route path='/settings' element={<Settings />} />
	  <Route path='/login' element={<Login />} />
    </Routes>
     
	 <Chat/>

    </section> 

    <footer> This website was not generated by an AI :) </footer>
    </div>
  );
}

export default App;
