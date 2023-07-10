import "../styles/UserProfile.css"
import WinrateCircularBar from "../components/WinrateCircularBar";
import StatDisplay from "../components/StatDisplay";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faBan, faComment, faDice, faHeart, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { fetchUserByNickname, getUserMatches } from "../api/APIHandler";
import { IUser, IAchievement, IMatch } from "../api/types";
import { useParams, Link } from 'react-router-dom';

export function Achievement( props: { userAchievements: IAchievement[] }) {
	
	const completedAchievements: number = props.userAchievements?.filter(elt => elt.fullfilled === true).length;
	
	const displayAchievements = props.userAchievements?.map( achievement => {
		return <div key={achievement.id} className="one-achievement" id={achievement.fullfilled === true ? "completed_achievement" : "one-achievement"}>
			{/* <FontAwesomeIcon icon=`${achievement.icon}` className="fa-icon-achievements"/> */}
			<h3>{achievement.title}</h3>
			<h4>{achievement.description}</h4>
		</div>
	})
	return (
		<article id="achievements">
			<h1>ACHIEVEMENTS ({completedAchievements}/{props.userAchievements?.length})</h1>
			<div className="all-achievements">
				{displayAchievements}
			</div>
		</article>
	);
}

export function MatchHistory(props: { user: IUser }) {
	
	const matchesQuery : UseQueryResult<IMatch[]>= useQuery({ 
		queryKey: ['match', props.user.id],
		queryFn: () => getUserMatches(props.user.id)
	});

	if (matchesQuery.error instanceof Error){
		return <div>Error: {matchesQuery.error.message}</div>
	}
	if (matchesQuery.isLoading || !matchesQuery.isSuccess || !props.user){
		return <div>Loading</div>
	}

	const matches: IMatch[] = matchesQuery.data;	

	const displayMatchHistory = matches.map(match => {

		let banner: string = "ACE !";
		let banner_style: string = "ace";

		if (match.loserId === props.user.id) {
			banner = "DEFEAT!";
			banner_style = "defeat";
		}
		else if (match.winnerId === props.user.id && match.scoreLoser !== 0) {
			banner = "VICTORY !";
			banner_style = "victory";
		}	
		else if (match.scoreWinner === match.scoreLoser) {
			banner = "EQUALITY !";
			banner_style = "equality";
		}
		
		const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } as const;
		const date = match.date.toLocaleDateString('en-US', options);
		
		const userScore: number = (match.winnerId === props.user.id) ? match.scoreWinner: match.scoreLoser;
		const opponentScore: number = (match.winnerId === props.user.id) ? match.scoreLoser : match.scoreWinner;
		const opponent: IUser = (match.winnerId === props.user.id) ? match.loser : match.winner;

		return <div key={match.id} className="match-card">
					<h5>{date}</h5>
					<h4 className={`match-outcome ${banner_style}`}>{banner}</h4>
					<div className="match-detail">
						<div className="opponent">
							<img src={props.user.avatar} alt={props.user.nickname} />
							<h4>{props.user.nickname}</h4>
						</div>
						<div>
							<h2>{userScore} - {opponentScore}</h2>
						</div>
						<div className="opponent">
							<Link to={`/user/${opponent?.nickname}`} >
							<img src={opponent?.avatar} alt={opponent?.nickname} />
							</Link>
							<h4>{opponent?.nickname}</h4>
						</div>
					</div>
				</div>
	})
	return (
		<aside>
			<h1>MATCH HISTORY</h1>
			{displayMatchHistory}
		</aside>
	);
}

export function UserProfile() {

	const { nickname } = useParams<{ nickname?: string }>();
	
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
	const user: IUser = userQuery.data as IUser;
	const userTotalMatches: number = user.matchAsP1.length + user.matchAsP2.length;
	const userWinrate: number = userTotalMatches !== 0 ? user.matchAsP1.length * 100 / userTotalMatches : 0;
	const userFriendsCount: number = (user.friendsList && user.friendsList?.length >= 1) ? user.friendsList.length : 0;

	const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' } as const;
	const creationDate = new Date(user.createdAt).toLocaleDateString('en-US', options);

	return (
		<div id="whole-profile">
			<section id="main-dashboard">
				<div id="top-dashboard">
					<div>
						<article id="bio">
							<div 
								 style={{ backgroundImage: `url(${user.avatar})` }}
								 id="hexagon-avatar"></div>
							<div className="user-infos">
								<div className="titles">
									<h2>{user.nickname}</h2>
									<h1 id="status">ONLINE</h1>
								</div>
								
								<button><FontAwesomeIcon icon={faUserPlus} /></button>
								<button><FontAwesomeIcon icon={faBan} /></button>
								<button><FontAwesomeIcon icon={faComment} /></button>
								<h5>Member since {creationDate}</h5>
							</div>
						</article>
						<article className="user_bio">
							<h1>BIO</h1> 
							<span>{user.bio}</span>
						</article>
						<hr />
						<article id="main-stats">
							<div className="one-stat">
								<div>
									<FontAwesomeIcon icon={faDice} className="fa-icon"/>
								</div>
								<div  className="one-stat_txt">
									<h2>{userTotalMatches}</h2>
									<h5>Total Matches</h5>
								</div>
								
							</div>
							<div className="one-stat">
								<div>
									<FontAwesomeIcon icon={faTrophy} className="fa-icon"/>
								</div>
								<div className="one-stat_txt">
									<h2>{user.matchAsP1.length}</h2>
									<h5>Victories</h5>
								</div>
								
							</div>
							<div className="one-stat">
								<div>
									<FontAwesomeIcon icon={faHeart} className="fa-icon"/>
								</div>
								
								<div  className="one-stat_txt">
									<h2>{userFriendsCount}</h2>
									<h5>Friends</h5>
								</div>
							</div>
		
						</article>
						<hr />
					</div>
					<div id="stats">
						<h1>COMPETITIVE OVERVIEW</h1>
						<div className="winratio_stats">
							<WinrateCircularBar winRate={userWinrate} />
							<div className="statdisplay">
								<StatDisplay title={"Wins"} stat={user.matchAsP1.length} />
								<StatDisplay title={"Lose"} stat={user.matchAsP2.length} />
							</div>
						</div>
						<div className="statdisplay">
							<StatDisplay title={"(Rank)"} stat={user.rank} />
							<StatDisplay title={"Aces"} stat={user.aces} />
						</div>
						<button className="challenge-btn">Challenge</button>
					</div>
				</div>
				<Achievement 
					userAchievements={user.achievements}
				/>
			</section>
			<MatchHistory
				user={user} 
			/>
		</div>
	);
}