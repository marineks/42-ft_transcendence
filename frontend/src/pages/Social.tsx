import "../styles/Social.css"
// import { IUser, users } from "../data";
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faBan, faXmark, faUserXmark, faUserMinus} from '@fortawesome/free-solid-svg-icons';
import { acceptFriendRequest,/* rejectFriendRequest ,*/fetchMe, postSearchQuery } from "../api/APIHandler";
// import { removeFriend, friendRequest, blockUser ,removeFromBlock} from "../api/APIHandler";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IUser } from "../api/types";

export function SearchBar() {

	const [userInput, setUserInput] = useState("");
	const [searchedUser, setSearchResults] = useState<IUser>();

	useEffect( () => {
		if (userInput.length > 2){
			postSearchQuery(userInput)
			.then( (response) => {
				const copy = {...response};
				setSearchResults(copy.data.hits[0]._formatted);
			})
			.catch(() => {
				setSearchResults(undefined);
			});
		}
		if (userInput === "") {
			setSearchResults(undefined);
		}
	}, [userInput]);
	
	return (
		<div>
			<p className="text_serachBar">Looking for someone to add ? Try this search bar!</p>
			<div className="search_bar">
				<input 
					type="text" 
					id="search_input"
					name="search"
					onChange={(event) => setUserInput(event.target.value)}
					placeholder="Type the nickname of the person you want to find..."
				/>
				<>
					{ searchedUser && (<div key={searchedUser.id} className="searched_user">
						<div className="search_user_infos">
							<img id="search_user_avatar" src={searchedUser.avatar} alt={searchedUser.nickname} />
							<h5 id="title" dangerouslySetInnerHTML={{__html: searchedUser.nickname}}></h5>
							<a href= {process.env.REACT_APP_BACKEND_URL + "/social"}>
								<FontAwesomeIcon icon={faUserPlus} />
							</a>
						</div>
					</div>)
					}
				</>
			</div>
		</div>
	);
}

export function DisplayConnections( props: { profilesToDisplay : IUser[] }) {
	// const [group, setGroup] = useState<IUser[]>(props.profilesToDisplay);
	const queryClient = useQueryClient();
	const acceptRequest = useMutation({ 
		mutationFn: (id: number) => acceptFriendRequest(id),
		onSuccess: () => {
			queryClient.invalidateQueries(['user']);
			console.log("test");
			
		}
	});

	const handleacceptRequest = (id: number) => {
		acceptRequest.mutate(id);
	}
	const displayProfiles = props.profilesToDisplay.map(profile => {
		return <div key={profile.id} className="profile">
					<div className="img-container">
						<img 
						src={profile.avatar}
						alt={profile.nickname}
						/>
					</div>
					<div className="profile_infos">
						<h5>{profile.nickname}</h5>
						<div><FontAwesomeIcon icon={faUserPlus} onClick={() =>handleacceptRequest(profile.id)}/></div>
						<div><FontAwesomeIcon icon={faUserMinus} /></div>
						<div><FontAwesomeIcon icon={faBan} /></div>
					</div>
		</div>
	})
	return (
		<div className="all-current">
			{displayProfiles}
		</div>
	);
};
 
export function Social() {

	const [groupToDisplay, setGroupToDisplay] = useState<IUser[]>([]);
	const { data: loggedUser, error, isLoading, isSuccess } = useQuery({ queryKey: ['user'], queryFn: fetchMe});
		
	const [buttonStates, setButtonStates] = useState({
		allFriends: false,
		activeFriends: false,
		blocked: false,
		pendingRequests: false,
	  });


	// useEffect( () => {
	// 	if (activeFriends|| allFriends || blocked || pendingRequests) {

	// 		switch (groupToDisplay) {
	// 			case activeFriends:
	// 				setGroupToDisplay(activeFriends);
	// 				break;
	// 			case allFriends:
	// 				setGroupToDisplay(allFriends);
	// 				break;
	// 			case blocked:
	// 				setGroupToDisplay(blocked);
	// 				break;
	// 			case pendingRequests:
	// 				setGroupToDisplay(pendingRequests);
	// 				break;
	// 				default:
	// 					break;
	// 				}
					
	// 			}
	// 		},[groupToDisplay]);
			
	// useEffect( () => {
	// 	if (allFriends) {

	// 		setGroupToDisplay(allFriends);
	// 	}
	// });

	// if (error) {
	// 	return <div>Error</div>;
	// }
	// if (isLoading || !isSuccess) {
	// 	return <div>Loading...</div>;
	// }

	const allFriends:		IUser[] = loggedUser?.friendsList || [];
	const activeFriends:	IUser[] = allFriends?.filter(friend => friend.isActive === true) || [];
	const blocked:			IUser[] = loggedUser?.blockList || [];
	const pendingRequests:	IUser[] = loggedUser?.pendingList || [];

	

	const handleClick = (group: IUser[] | undefined, id: string) => {
		setGroupToDisplay(group || []);
		console.log(loggedUser);
		setButtonStates({
			allFriends: false,
			activeFriends: false,
			blocked: false,
			pendingRequests: false,
			[id]: true,
		});
	}

	if (error) {
		return <div>Error</div>;
	}
	if (isLoading || !isSuccess) {
		return <div>Loading...</div>;
	}

	return (
		<div  id="social-dashboard">
			<SearchBar />
			<div className="social-btn">
				<button 
					onClick={ () => handleClick(allFriends, "allFriends")}
					className={buttonStates.allFriends ? "clicked-btn" : "btn"}>
					All friends
				</button>
				<button 
					onClick={ () => handleClick(activeFriends, "activeFriends")}
					className={buttonStates.activeFriends ? "clicked-btn" : "btn"}>
					Active friends
				</button>
				<button 
					onClick={ () => handleClick(blocked, "blocked")}
					className={buttonStates.blocked ? "clicked-btn" : "btn"}>
					Blocked users
				</button>
				<button 
					onClick={ () => handleClick(pendingRequests, "pendingRequests")}
					className={buttonStates.pendingRequests ? "clicked-btn" : "btn"}>
					Pending requests
				</button>
			</div>
			{
				groupToDisplay.length > 0 && (<DisplayConnections profilesToDisplay={groupToDisplay}/>)
			}
		</div>
	);
};

