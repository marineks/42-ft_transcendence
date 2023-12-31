import axios from "axios";
import { IMatch, IUser, IChannel, IMessage } from "./types";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

axios.defaults.withCredentials = true;

/* ######################*/
/* ##   INTERCEPTORS   ##*/
/* ######################*/

const api = axios.create({
	baseURL: BASE_URL,
	withCredentials: true,
	headers: {
		'Access-Control-Allow-Origin': BASE_URL,
	},
});

api.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		// const Navigate = useNavigate();
		if (error.response && error.response.status === 401) {
			// Redirect to the "Login" page
			window.location.href = '/Login';
			// Navigate('/Login');
		}
		else if (error.response === 500) {
			// Redirect to the according error pages
			window.location.href = '/Error/' + error.response.status;
			// Navigate('/Error/' + error.response.status);
		}
		return Promise.reject(error);
	},
);

/* ######################*/
/* ######   AUTH   ######*/
/* ######################*/

export async function signUp(newNickname: string, password: string) {

	try {
		const response = await api.post(`${BASE_URL}/auth/signup`,
			{
				nickname: newNickname,
				password: password
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': BASE_URL,
				},
			},
		);
		return response.data;

	} catch (error) {
		throw new Error('A user with this nickname already exists');
	}
}

export async function logIn(newNickname: string, password: string) {

	try {
		const response = await axios.post(`${BASE_URL}/auth/login`,
			{
				nickname: newNickname,
				password: password
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': BASE_URL,
				},
			},
		);
		return response;

	} catch (error) {
		if (axios.isAxiosError(error)) {
			if (error.response && error.response.data && error.response.data.message) {
				if (error.response.data.message === 'No such nickname') {
					throw new Error('No such nickname');
				} else {
					throw new Error('Password does not match');
				}
			}
		}
		throw new Error('An error occurred');
	}
}

export async function logOut() {

	try {
		const response = await axios.delete(`${BASE_URL}/auth/logout`);
		return response.data;

	} catch (error) {
		console.log("Error signup: ", error);
	}
}

export async function fetch2FA(code: string, userId: string) {

	try {
		const response = await axios.get(`${BASE_URL}/auth/2fa?code=${code}&userId=${userId}`);
		return response;

	} catch (error) {
		console.log("Error signup: ", error);
	}
}

/* ######################*/
/* ######   USER   ######*/
/* ######################*/

export async function checkIfLogged(): Promise<boolean> {

	const response = await axios.get<boolean>(`${BASE_URL}/users/check`);
	return response.data;
}

export async function getUserMatches(id: number): Promise<IMatch[]> {
	const response = await api.get<IMatch[]>(`/users/matches/${id}`);

	// nécessaire car Prisma ne renvoie pas exactement un Date object selon JS
	// thread: https://github.com/prisma/prisma/discussions/5522
	const matches: IMatch[] = response.data.map((match) => ({
		...match,
		date: new Date(match.date),
	}));

	return (matches);
}

export async function fetchUsers(): Promise<IUser[]> {
	const response = await api.get<IUser[]>(`/users`);
	return response.data;
}

export async function fetchUserById(id: number): Promise<IUser> {
	const response = await api.get<IUser>(`/users/${id}`);
	return response.data;
}

export async function fetchUserByNickname(nickname: string): Promise<IUser> {
	const response = await api.get<IUser>(`/users/${nickname}`);
	return response.data;
}

export async function fetchMe(): Promise<IUser> {
	const response = await api.get<IUser>(`/users/me`);
	return response.data;
}

export async function updateUserStringProperty(property: keyof IUser, newProperty: string) {
	try {
		const requestBody = { [property]: newProperty };

		const response = await api.patch<IUser>(
			`/users/me`, 					// url
			requestBody,					// request body
			{								// request config object
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': BASE_URL,
				},
			},
		);
		return response.data;
	} catch (error) {
		throw new Error('Nickname is already taken');
	}
}


export async function updateUserBooleanProperty(property: keyof IUser, newProperty: boolean) {
	try {
		const requestBody = { [property]: newProperty };

		const response = await api.patch<IUser>(
			`/users/me`, 					// url
			requestBody,					// request body
			{								// request config object
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': BASE_URL,
				},
			},
		);
		return response.data;
	} catch (error) {
		throw new Error('Error during change of boolean user property');
	}
}

export async function deleteMe(): Promise<IUser> {
	return await api.delete(`/users/me`);
}

/* ######################*/
/* ###      CHAT      ###*/
/* ######################*/

export async function getOneChannelById(id: number): Promise<IChannel> {
	const response = await api.get<IChannel>(`/chat/channel/${id}`);
	return response.data;
}

export async function getOneChannelByName(roomName: string): Promise<IChannel> {
	const response = await api.get<IChannel>(`/chat/channel/find/${roomName}`);
	return response.data;
}

export async function getAllUserChannels(): Promise<IChannel[]> {
	const user = await fetchMe();
	const response = await api.get<IChannel[]>(`/chat/channels/all/${user.id}`);
	return response.data;
}

export async function getNonJoinedChannels(): Promise<IChannel[]> {
	const user = await fetchMe();
	const response = await api.get<IChannel[]>(`/chat/channels/more/${user.id}`);
	return response.data;
}

export async function verifyPasswords(channelId: number, userInput: string): Promise<boolean> {
	try {
		const response = await api.get<boolean>(`/chat/channel/${channelId}/pwdcheck`,
		{
			params: {
				userInput: userInput,
			  },
		});
		return response.data;
	} catch (error) {
		throw new Error('Error joining protected channel: Incorrect Password');
	}
}

export async function createChannel(roomName: string, password: string, type: string)
	: Promise<IChannel> {
	try {
		const user = await fetchMe();
		const userId = user.id;
		const response = await api.post(`/chat/channel`,
			{
				roomName: roomName,
				ownerId: userId,
				password: password,
				type: type,
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': BASE_URL,
				},
			},
		);
		return response.data;

	} catch (error) {
		throw new Error('A channel with this name already exists');
	}
}

export async function updateChannelProperties(channelId: number, property: keyof IChannel, newValue: string) {
	try {
		const response = await api.patch(`/chat/channel/${channelId}/update`,
			{
				[property]: newValue
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': BASE_URL,
				},
			},
		);
		return response.data;
	} catch (error) {
		throw new Error('An error occured during the update of this channel.');
	}
}

export async function updateMeInChannel(channelId: number, groupToInsert: string, action: string) {
	try {
		const user = await fetchMe();
		const response = await api.post(`/chat/channel/${channelId}`,
			{
				groupToInsert,
				action,
				userId: user.id,
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': BASE_URL,
				},
			},
		);
		return response.data;
	} catch (error) {
		throw new Error(`Error: cannot ${action} to ${groupToInsert} in channel ${channelId}`);
	}
}

export async function updateUserInChannel(userId: number, channelId: number, groupToInsert: string, action: string) {
	try {
		const response = await api.post(`/chat/channel/${channelId}`,
			{
				groupToInsert,
				action,
				userId: userId,
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': BASE_URL,
				},
			},
		);
		return response.data;
	} catch (error) {
		throw new Error('Error: cannot join this channel');
	}
}

export async function leaveChannel(userId: number, channelId: number) {
	try {
		const response = await api.delete(`/chat/channel/leave/${channelId}`,
			{
				data: { userId },
			});
		return response.data;
	} catch (error) {
		throw new Error("Error: An error occured while you were leaving this channel.")
	}
}




/**
 * @description Find the convo, and if it doesn't exist, create it and join both users to it
 * @param roomName Name of the conversation (Syntax: senderNickname + ' ' + receiverNickname)
 * @param contactedUserId Id of the person you're trying to message
 * @returns the channel of the conversation (DM)
 */
export async function manageDirectMessages(roomName: string, contactedUserName: string, contactingName: string | undefined): Promise<IChannel> {
	try {
		let user: IUser = await fetchUserByNickname(contactedUserName);
		if (!contactingName) {
			throw new Error('User doesnt exist');
		}
		let contactingUser = await fetchUserByNickname(contactingName);
		if (!user || !contactingUser) {
			throw new Error('User doesnt exist');
		}
		
		if (user.blockList && user.blockList.some((blockedUser) => blockedUser.id === contactingUser.id)) {
			throw new Error('You are blocked by this user');
		}
		let conv: IChannel = await getOneChannelByName(roomName);
		if (!conv) {
			const split = roomName.split(' ');
			const roomNameReversed = split[1] + ' ' + split[0];
			
			conv = await getOneChannelByName(roomNameReversed);
			if (!conv) {
				conv = await createChannel(roomName, "", 'DM'); // Using '' for password for DM type
			}			
		}
		await updateUserInChannel(user.id, conv.id, 'joinedUsers', 'connect');
		return conv;
	} catch (error) {
		throw new Error('Error: cannot establish this personal convo');
	}
}

/**
 * 
 * @param from The sender id
 * @param to The recipient, aka roomName of a Channel
 * @param content The sender's message
 * @param channelId Number id of the conversation
 * @returns the newly-created message
 */
export async function createMessage(channel: IChannel, content: string): Promise<IMessage> {

	try {
		const { roomName, id } = channel;
		const user = await fetchMe();
		const response = await api.post(`/chat/message`,
			{
				fromId: user.id,
				to: roomName,
				content: content,
				channelId: id
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': BASE_URL,
				},
			},
		);
		return response.data;
	} catch (error) {
		throw new Error("API: Could not store message");
	}
}

/**
 * 
 * @param from The sender id
 * @param to The recipient, aka roomName of a Channel
 * @param content The sender's message
 * @param channelId Number id of the conversation
 * @returns the newly-created message
 */
export async function createMessage2(channelName: string, content: string): Promise<IMessage> {
	try {
		let channel = await getOneChannelByName(channelName);
		if (!channel) {
			const split = channelName.split(' ');
			const channelNameReversed = split[1] + ' ' + split[0];
			channel = await getOneChannelByName(channelNameReversed);
		}
		const user = await fetchMe();
		const response = await api.post(`/chat/message`,
			{
				fromId: user.id,
				to: channel.roomName,
				content: content,
				channelId: channel.id
			},
			{
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': BASE_URL,
				},
			},
		);
		return response.data;
	} catch (error) {
		throw new Error("API: Could not store message");
	}
}

export async function getAllMsgsofChannel(channelId: number): Promise<IMessage[]> {
	try {
		const response = await api.get(`/chat/messages/${channelId}`);
		const messages: IMessage[] = response.data.map((message: IMessage) => ({
			...message,
			date: new Date(message.date),
		}));

		return messages;
	} catch (error) {
		throw new Error("API: Could not retrieve messages");
	}
}

export async function deleteAllMsgsofChannel(channelId: number) {
	try {
		return api.delete(`/chat/messages/${channelId}`);
	} catch (error) {
		throw new Error("API: Error during deletion of messages");
	}
}

/* ######################*/
/* ######  SEARCH  ######*/
/* ######################*/

export async function getMeiliData(): Promise<IUser> {
	const response = await api.get(`/search`);
	return response.data;
}


export async function postSearchQuery(userInput: string) {

	try {
		const response = await api.post(`/search`, {
			searchQuery: userInput,
		});
		return response;
	} catch (error) {
		throw new Error('Meilisearch: error caught during search');
	}

}

/* ######################*/
/* ###   CLOUDINARY   ###*/
/* ######################*/

export async function uploadImage(file: File) {
	try {
		const formData = new FormData();
		formData.append('file', file);

		const user = await fetchMe();

		const response = await api.post(`/cloudinary`,
			formData, {
			params: {
				id: user.id,
			},
		});
		return response.data; // response.data = avatarUrl
	} catch (error) {
		throw new Error('Error uploading image');
	}
}



/* #######################*/
/* ######   GAME   #######*/
/* #######################*/



/* ######################*/
/* ###     SOCIAL     ###*/
/* ######################*/

export async function getMyFriends(): Promise<IUser> {
	try{
		const response = await api.get(`/social/friends`);
		return response.data;
	} catch (error) {
		console.log("Error getMyFriends: ", error);
		throw error; // Rejette la promesse avec l'erreur d'origine pour la gestion des erreurs par l'appelant
	}
}

export async function getBlockedFriends(): Promise<IUser> {
	try{
		const response = await api.get(`/social/blocked-list`);
		return response.data;
	} catch (error) {
		console.log("Error getBlockerFriends: ", error);
		throw error; 
	}
}

export async function getPendingList(): Promise<IUser> {
	try{
		const response = await api.get(`/social/pending-list`);
		return response.data;
	} catch (error) {
		console.log("Error getPendingList: ", error);
		throw error; 
	}
}

export async function removeFromBlock(id : number): Promise<IUser> {

	try {
		const response = await api.delete(`/social/block/${id}`);
		return response.data;

	} catch (error) {
		console.log("Error RemoveFromBlock: ", error);
		throw error; 
	}
}

export async function rejectFriendRequest(id : number): Promise<IUser> {

	try {
		const response = await api.delete(`/social/friend-request/${id}/reject`);
		return response.data;

	} catch (error) {
		console.log("Error RejectFriendRequest: ", error);
		throw error; 
	}
}

export async function removeFriend(id : number): Promise<IUser> {

	try {
		const response = await api.delete(`/social/friends/${id}`);
		return response.data;

	} catch (error) {
		console.log("Error RemoveFriend: ", error);
		throw error; 
	}
}

export async function acceptFriendRequest(id : number): Promise<IUser> {

	try {
		const response = await api.post(`/social/friend-request/${id}/accept`);
		return response.data;

	} catch (error) {
		console.log("Error AcceptFriendRequest: ", error);
		throw error; 
	}
}

export async function friendRequest(username: string): Promise<IUser> {

	try {
		const response = await api.post(`/social/friend-request/${username}`);
		return response.data;

	} catch (error) {
		console.log("Error FriendRequest: ", error);
		throw error; 
	}
}

export async function blockUser(username: string): Promise<IUser> {

	try {
		const response = await api.post(`/social/block/${username}`);
		return response.data;

	} catch (error) {
		console.log("Error BlockUser: ", error);
		throw error; 
	}
}
