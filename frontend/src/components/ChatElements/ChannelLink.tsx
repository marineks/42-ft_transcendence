import React, {  useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IChannel } from "../../api/types";
import '../../styles/Tab_channels.css';
import { createMessage2, fetchMe, getAllMsgsofChannel, manageDirectMessages } from "../../api/APIHandler";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { SocketContext } from '../../context/contexts';
import { sendInviteToUser, sendNotificationToServer } from "../../sockets/sockets";
import { toast } from 'react-hot-toast';

function getTimeSinceLastMsg(lastMessageDate: Date) {
	const date = (lastMessageDate instanceof Date) ? lastMessageDate : new Date(lastMessageDate);
	const formatter = new Intl.RelativeTimeFormat('en');
	const ranges = {
		years: 3600 * 24 * 365,
		months: 3600 * 24 * 30,
		weeks: 3600 * 24 * 7,
		days: 3600 * 24,
		hours: 3600,
		minutes: 60,
		seconds: 1
	};
	const secondsElapsed = (date.getTime() - Date.now()) / 1000;
	for (const key in ranges) {
		if (ranges[key as keyof typeof ranges] < Math.abs(secondsElapsed)) {
			const delta = secondsElapsed / ranges[key as keyof typeof ranges];
			return formatter.format(Math.round(delta), key as keyof typeof ranges);
		}
	}
}

export default function ChannelLink({ channel }: { channel: IChannel }) {

	const [convName, setConvName] = useState<string>(channel.roomName);
	const [openInvitePrompt, setOpenInvitePrompt] = useState<boolean>(false);
	const [inviteName, setInviteName] = useState<string>("");

	const socket = useContext(SocketContext);
	const queryClient = useQueryClient();

	const {data, error, isLoading, isSuccess } = useQuery({queryKey: ['user'], queryFn: fetchMe});
	const { data: messages, status: msgStatus } = useQuery({queryKey: ['messages', channel.id], queryFn: () => getAllMsgsofChannel(channel.id),});

	const { mutate: findOrCreateConv } = useMutation({
		mutationFn: () => manageDirectMessages((data?.nickname + ' ' + inviteName), inviteName, data?.nickname),
		onSuccess: (data) => {
			queryClient.invalidateQueries(['channels']);
			if (socket && data) {
				sendNotificationToServer(socket, 'Create Lobby', data?.roomName);
			}
			if (socket && data && inviteName !== '') {
				// const dmName: string = data?.nickname + ' ' + inviteName;
				const msg:string = sendInviteToUser(socket, data?.roomName, inviteName, channel);
				createInfoMessage.mutate([data?.roomName, msg]);
			}
		},
		onError: () => { toast.error("An error occured: could be an invalid nickname (or you're blocked).") }
	})

	const createInfoMessage = useMutation({
		mutationFn: ([channel, message]: string[]) => createMessage2(channel, message),
		onSuccess: () => {
			queryClient.invalidateQueries(['channels']);
		},
		onError: () => toast.error('Message not sent: retry'),
	});

	useEffect(() => {
		if (channel.type === 'DM' && data) {
			setConvName(channel.roomName.replace(data?.nickname, '').trim());
		}
	}, [data, channel.type, channel.roomName]);
	
	if (error || msgStatus === "error") {
		return <div>Error</div>
	}
	if (isLoading || !isSuccess  || msgStatus === "loading" || msgStatus !== "success") {
		return <div>Loading...</div>
	}

	const handleInviteClick = (event: React.FormEvent) => {
		event.stopPropagation();
		setOpenInvitePrompt(!openInvitePrompt);
	}

	const handleOnChangeInvite = (event: React.ChangeEvent<HTMLInputElement>) => {
		event.preventDefault();
		setInviteName(event.target.value);
		
	}
	const handleUpdate = (event: React.FormEvent<HTMLButtonElement>) => {
		event.preventDefault();
		findOrCreateConv();
	}

	let msgPreview : string = 'Click to see conv';
	if (messages && messages.length > 0) {
		if (data.blockList && data.blockList.some((user) => user.nickname === messages[messages?.length - 1].from.nickname)) {
			msgPreview = 'Message hidden (from blocked user)';
		} else  {
			msgPreview = messages[messages?.length - 1].content;
		}
		msgPreview = (msgPreview.length <= 30)? msgPreview : msgPreview.substring(0,27) + '...';
		if (data.blockList && data.blockList.some((user) => user.nickname === channel.joinedUsers[0].nickname)) {
			msgPreview = 'Message hidden (from blocked user)';
		}
	}
	return (
		<div>
			<div  className="channel-link-card" >
				<div className="channel-link-header">
					<div>
						<span className='channel-link-name'>{convName} </span>
						<span className="channel-link-span">{channel.type}</span>
						{
							channel.type !== 'DM' && channel.joinedUsers &&
							<span>{channel.joinedUsers.length} member(s)</span>
						}
					</div>
					{
						channel.type !== 'DM' && 
						<FontAwesomeIcon className='channel-link-invite' title="invite" icon={faUserPlus} onClick={handleInviteClick}/>
					}
				</div>
				{
					messages.length > 0 &&
					<>
						<div className='channel-link-preview'>
							<p > 
								<span className="channel-link-messenger">{messages[messages.length - 1].from.nickname} : </span> 
								<span className='channel-link-lastmsg'>{msgPreview}</span>
							</p>
							<p className='channel-link-date'>{getTimeSinceLastMsg(messages[messages?.length - 1].date)}</p>
						</div>
					</>
				}
				{
					messages.length === 0 &&
					<div className="channel-link-messenger">Click to write down your first message!</div> 
				}
			</div>
			{
				openInvitePrompt === true &&
				<div className='channel-link-invite-card' onClick={(event) => event.stopPropagation()}>
					Invite someone:
					<input	type="text" 
							placeholder="User's nickname"
							onChange={handleOnChangeInvite}
					/>
					<button className="text_settings_btn" onClick={handleUpdate}>
						<FontAwesomeIcon icon={faCircleCheck} className="text_checkbox"/>
					</button>
				</div>
			}
		</div>
	);
}