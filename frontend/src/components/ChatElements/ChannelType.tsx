import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faPencil } from "@fortawesome/free-solid-svg-icons";
import { getOneChannelById, updateChannelProperties } from "../../api/APIHandler";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IChannel, IUser } from "../../api/types";
import { toast } from "react-hot-toast";
import "../../styles/Tab_Chat.css";

export function ChannelType({ channelId, loggedUser } : { channelId: number, loggedUser: IUser}) {
	const [isEnabled, setIsEnabled] = useState<boolean>(false);
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [toggleDisplay, setToggleDisplay] = useState<boolean>(false);
	const [chanType, setChanType] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const queryClient = useQueryClient();

	const { data: channel, error, isLoading, isSuccess }= useQuery({ 
		queryKey: ['channels', channelId], 
		queryFn: () => getOneChannelById(channelId)
	});

	const updateChannel = useMutation({
		mutationFn: ([property, newValue]: [keyof IChannel, string]) => updateChannelProperties(channelId, property ,newValue),
		onSuccess: () => { 
			queryClient.invalidateQueries(['channels']);
			toast.success(`You updated the channel!`) 
		},
		onError: () => { toast.error(`Error : cannot change type of channel`) }
	});

	useEffect(() => {
		if (channel && channel.ownerId === loggedUser.id) {
			setIsEnabled(true);
		}
	}, [channel, loggedUser.id])
	
	if (error) {
		return <div>Error</div>;
	}
	if (isLoading || !isSuccess) {
		return <div>Loading...</div>;
	}

	const handleInputBlur = () => {
		if (chanType !== 'PROTECTED') {
			setIsEditing(false);
		}
	};

	const handleInputKeyPress = (event: React.FormEvent<HTMLButtonElement>) => {
		void event;
		setIsEditing(false);
		updateChannel.mutate(["type", chanType]);
		if (chanType === 'PROTECTED') {
			updateChannel.mutate(["password", password]);
		}
	};

	return (<div className="chantype">
		{
			isEnabled === true &&
			<>
			<FontAwesomeIcon 
				onClick={() => setToggleDisplay(!toggleDisplay)} 
				icon={faCircleInfo} 
				title="Click to see more"
				id="fa_see_more"
			/>
			{
				toggleDisplay === true &&
				<>
				{ isEditing? 
					(
						<>
						<select 
						value={chanType} 
						onChange={(event) => setChanType(event.target.value)}
						onBlur={handleInputBlur}
						id="chantype_select"
						>
							<option value="PUBLIC">PUBLIC</option>
							<option value="PRIVATE">PRIVATE</option>
							<option value="PROTECTED">PROTECTED</option>
						</select>
						{
							chanType === "PROTECTED" &&
							<input 
							type="password" 
							placeholder="password to enter"
							id="chantype_addpwd"
							value={password} 
							onChange={(event) => setPassword(event.target.value)} 
							/>
						}
						<button id="chantype_confirmbtn" onClick={handleInputKeyPress}>Confirm change</button>
						</>
					) : (
						<p id="chan_header_changetype" >Mode: {(chanType) ? chanType : channel.type} <FontAwesomeIcon onClick={() => setIsEditing(true)} icon={faPencil} id="fa_see_more"/></p>
					)
				}
					
				</>
			}
			</>
		}
	</div>
	);
}