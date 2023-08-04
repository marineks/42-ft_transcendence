import '../App.css';
import { IsLoggedInContext, SocketContext } from '../context/contexts';
import'../styles/Home.css';
import { useContext, useState } from "react";
import {Link, useNavigate} from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function Home() {
	const [open, setOpen] = useState(false);
	const [fadeIn, setFadein] = useState(false);
	const navigate = useNavigate();
	const isLogin = useContext(IsLoggedInContext);

	function handleClick() {
		if (!isLogin)
			navigate('/Login');
		setOpen(!open);
		setFadein(true);
	}
	void(fadeIn); // pour faire taire unused warning

	const socket = useContext(SocketContext);

	// Global socket event necessary for game invitation
	socket?.on('match invitation', (inviter: string) => {
		// Pops a toast with two buttons, one to invite, one to decline
		toast(
			<div>
				<p>{inviter} has invited you to a match!</p>
				<button
					className="button3"
					onClick={() => {
						socket?.emit('accept match invitation', inviter);
						toast.dismiss('match invitation');
					}}>
					Accept
				</button>
				<button
					className="button3"
					onClick={() => {
						socket?.emit('decline match invitation', inviter);
						toast.dismiss('match invitation');
					}}>
					Decline
				</button>
			</div>,
			{
				id: 'match invitation',
				duration: 10000,
				icon: '🎾',
			}
		);
	});

	socket?.on('match invitation declined', (decliner: string) => {
		toast.error(`${decliner} declined your invitation`);
	});

	return (
        <div id="play-screen">
			<button className='glitch' data-text="PRESS TO PLAY" onClick={handleClick} >
				<Link className='link-login2' to="/gamepage"> PRESS TO PLAY  </Link>
			</button>
		</div>
	);
}
