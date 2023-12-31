import "../styles/UserProfile.css"
import WinrateCircularBar from "../components/Profile/WinrateCircularBar";
import StatDisplay from "../components/Profile/StatDisplay";
import UserInfos from "../components/Profile/UserInfos";
import OneMainStat from "../components/Profile/OneMainStat";
import { Achievement } from "../components/Profile/Achievement";
import { MatchHistory } from "../components/Profile/MatchHistory";
import { faDice, faHeart, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { fetchUserByNickname } from "../api/APIHandler";
import { IUser } from "../api/types";
import { useParams } from 'react-router-dom';
import { useContext } from "react";
import { SocketContext } from "../context/contexts";
import { Socket } from "socket.io-client";
import { toast } from "react-hot-toast";

export function UserProfile() {

	const { nickname } = useParams<{ nickname?: string }>();
	const socket : Socket | null = useContext(SocketContext);
	
	/* On fait une requête au backend pour récupérer le user connecté */
	const userQuery : UseQueryResult<IUser>= useQuery({ 
		queryKey: ['user', nickname], 	 				// on relie notre requête au mot clé 'user'
		queryFn: () => {
			if (nickname) {
				return fetchUserByNickname(nickname)}	// call API
			}
	});

    if (userQuery.error instanceof Error){
      return <div>Error: {userQuery.error.message}</div>
    }
    if (userQuery.isLoading || !userQuery.isSuccess){
      return <div>Loading</div>
    }

	/* Pour pouvoir passer ses infos dans les components, on renomme pour + de lisbilité */
	const user: IUser = userQuery.data;
	const userTotalMatches: number = (user.matchAsP1 && user.matchAsP2) ? user.matchAsP1.length + user.matchAsP2.length : 0;
	const userWinrate: number = userTotalMatches !== 0 ? user.matchAsP1.length * 100 / userTotalMatches : 0;
	const userFriendsCount: number = (user.friendsList && user.friendsList?.length >= 1) ? user.friendsList.length : 0;
	
	// Invite to a game of Pong!
	const handleInvitation = () => {
		if (socket) {
			socket?.emit('invite match', user.nickname);
			toast.success('Invitation sent', {id: 'invite'});
		}
		socket?.on('match invitation declined', (nickname: string) => {
			toast.error(`${nickname} declined your invitation.`, {id: 'invite'});
		});
		}
	return (
		<div id="whole-profile-container">
			<div id="whole-profile">
			<section id="main-dashboard">
				<div id="top-dashboard">
					<div id="bio-container">
						<article id="bio">
							<div style={{ backgroundImage: `url(${user.avatar})` }} id="hexagon-avatar"></div>
							{
								user && user.nickname &&
								<UserInfos user={user} />
							}
						</article>
						<article className="user_bio">
							<h1>BIO</h1> 
							<span>{user.bio}</span>
						</article>
						<hr />
						<article id="main-stats">
							<OneMainStat title="Total Matches" stat={userTotalMatches} icon={faDice} />
							<OneMainStat title="Victories" stat={user.matchAsP1 ? user.matchAsP1.length : 0} icon={faTrophy} />
							<OneMainStat title="Friends" stat={userFriendsCount} icon={faHeart} />
						</article>
						<hr />
					</div>
					<div id="stats">
						<h1>COMPETITIVE OVERVIEW</h1>
						<div className="winratio_stats">
							<WinrateCircularBar winRate={userWinrate} />
							<div className="statdisplay">
								<StatDisplay title={"Wins"} stat={user.matchAsP1 ? user.matchAsP1.length : 0} />
								<StatDisplay title={"Lose"} stat={user.matchAsP2 ? user.matchAsP2.length : 0} />
							</div>
						</div>
						<div className="statdisplay">
							<StatDisplay title={"(Rank)"} stat={user.rank} />
							<StatDisplay title={"Aces"} stat={user.aces} />
						</div>
						<button onClick={handleInvitation} className="challenge-btn">Challenge</button>
					</div>
				</div>
				<Achievement 
					user={user}
				/>
			</section>
			<MatchHistory
				user={user} 
			/>
			</div>
		</div>
	);
}