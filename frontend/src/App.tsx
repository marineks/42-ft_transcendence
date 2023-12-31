import './App.css';
// import React from 'react';
import { Routes, Route} from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Social } from './pages/Social';
import { Leaderboard } from './pages/Leaderboard';
import { UserProfile } from './pages/UserProfile';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import Settings from './pages/Settings';
import Chat from './components/Chat';
import AboutUs from './pages/AboutUs';
import FAQ from './pages/FAQ';
import Home from './pages/Home';
import GamePage from './pages/GamePage';
import { Socket } from 'socket.io-client';
import { Toaster } from 'react-hot-toast';
import DoubleFA from './pages/DoubleFA';
import Error from './pages/Error';
import PendingPage from './pages/DoubleFAPending';
import { Pong } from './pages/Pong';
import { CustomPong } from "./pages/CustomPong";
import { AppProvider } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { IsLoggedInContext, SocketContext, ChatStatusContext } from './context/contexts';
import { IChannel } from './api/types';

const app = new PIXI.Application({
			width: 800,
			height: 600,
			backgroundColor: 0x1099bb,
			//   resizeTo: window,
		});

function App() {

	// On initialise nos contexts (= nos variables globales)
	const [activeTab, setActiveTab] = useState<number>(0);
	const [activeConv, setActiveConv] = useState<IChannel | null>(null);
	const [isExpanded, setIsExpanded] = useState(false);
	const [isLoggedIn, setLoggedIn] = useState<boolean>(false);
	// const [isMuted, setIsMuted] = useState<boolean>(false);
	// const [muteExpiration, setMuteExpiration] = useState<number | null>(null);
	const [socket, setSocket] = useState<Socket | null>(null);
	const [theme, setTheme] = useState('dark');

	// Si le user est déjà venu, on récupère le thème qu'il avait choisi
	useEffect(() => {
		const storedTheme = localStorage.getItem('theme');
		if (storedTheme) {
			setTheme(storedTheme);
		}
	}, []);

	// Fonction pour changer de thème et le garder dans le LocalStorage
	const toggleTheme = () => {
	const newTheme = theme === 'dark' ? 'kawaii' : 'dark';
		setTheme(newTheme);
		localStorage.setItem('theme', newTheme);
	};

	function closeChat(event: Event) {
		event.stopPropagation();
		setIsExpanded(!isExpanded);
	}

	document.body.ondblclick = closeChat;

	// const videoPlayer = document.getElementById('videobg');
	// window.addEventListener('beforeunload', () => {
	// 	if(videoPlayer instanceof HTMLVideoElement){
	// 	videoPlayer.pause();
	// }
	// })
	// function lazyLoadVideo(){
	// 	const videoContainer = document.getElementById('videoContainer');
	// 	const videobg = document.getElementById('videobg');
	// 	if ('IntersectionObserver' in window){
	// 		const observer = new IntersectionObserver((entries) => {
	// 			entries.forEach((entry) => {
	// 				if(entry.isIntersecting){
	// 					if(videobg instanceof HTMLVideoElement){
	// 					videobg.src = videobg.dataset.src;
	// 					observer>unobserve(videoContainer);
	// 				}
	// 				}
	// 			});
	// 		});
	// 	}
	// }

  return (
	<div id='app' className={`App ${theme}`}>
		<section id="main-content">
			<ChatStatusContext.Provider value={ {activeTab, setActiveTab, activeConv, setActiveConv, isExpanded, setIsExpanded}}>
			<SocketContext.Provider value={socket}>
			<IsLoggedInContext.Provider value={isLoggedIn}>
			{/* <MuteContext.Provider value={ {isMuted, setIsMuted, muteExpiration, setMuteExpiration}}> */}
				<Navbar theme={theme} toggleTheme={toggleTheme} setLoggedIn={setLoggedIn} setSocket={setSocket} />
				<div id="videoContainer">
					<video className='videobg' autoPlay loop muted preload="auto" content="width=device-width, initial-scale=1.0">
						<source src="./assets/bg-video.mp4" type='video/mp4' />
					</video>
				</div>
				<Toaster/>
				{/* <AppProvider value = {app}> */}
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/leaderboard" element={<Leaderboard />} />
						<Route path='/faq' element={<FAQ />} />
						<Route path="/aboutUs" element={<AboutUs />} />
						<Route path="/social" element={<Social />} />
						<Route path='/settings' element={<Settings />} />
						<Route path='/pong' element={<AppProvider value = {app}><Pong /></AppProvider>} />
						<Route path='/custompong' element={<AppProvider value = {app}><CustomPong /></AppProvider>} />
						<Route path='/login' element={<Login setLoggedIn={setLoggedIn} setSocket={setSocket} />} />
						<Route path='/2fa' element={<DoubleFA/>} />
						<Route path='/2fa/pending' element={<PendingPage/>} />
						<Route path='/user' element={<UserProfile />} />
						<Route path='/gamepage' element ={<GamePage/>}/>
						<Route path='/error/:status' element={<Error/>} />
						<Route path='*' element={<Error/>} />
						<Route path={`/user/:nickname`}  element={<UserProfile />} />
					</Routes>
				{/* </AppProvider> */}
				{ isLoggedIn && <Chat/> }
				{/* <footer className="hide-footer"> This website was not generated by an AI :) </footer> */}
				{/* <script>
					var isFirstPage = window.location.pathname === '/home';
					
					if(isFirstPage){
						var footer = document.querySelector('.hide-footer');
						if (footer){
							footer.classList.remove('.hide-footer';)
						}
					}
				</script> */}

			{/* </ MuteContext.Provider> */}
			</IsLoggedInContext.Provider>
			</SocketContext.Provider>
			</ChatStatusContext.Provider>
	</section>
	</div>
  );
}

export default App;
