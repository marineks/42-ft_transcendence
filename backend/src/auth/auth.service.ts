import { ForbiddenException, HttpException, Injectable, Query, Res } from '@nestjs/common';
import axios from 'axios';
import { PrismaClient, AuthType } from '@prisma/client';
import * as argon from 'argon2';
import AuthDto from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { MailService } from 'src/mail/mail.service';
import { SocketsService } from 'src/sockets/sockets.service';

const hashingConfig = {
	parallelism: 1,
	memoryCost: 64000, // 64 mb
	timeCost: 3
};
const prisma = new PrismaClient();

@Injectable()
export class AuthService {
	constructor(private readonly jwtService: JwtService, private mailService: MailService, private socketsService: SocketsService) { }

	async redirect42(@Query() query, @Res({ passthrough: true }) res: Response) {

		try {

			// Getting the users's token from the 42API.
			const url = 'https://api.intra.42.fr/oauth/token';
			const data = {
				grant_type: 'authorization_code',
				client_id: process.env.ID_42,
				client_secret: process.env.SECRET_42,
				code: query.code,
				redirect_uri: process.env.CALLBACK_URL_42,
			}

			let response = await axios.post(url, data);
			const accessToken = response.data.access_token;

			// Getting user's information using its token.
			const config = {
				headers: {
					Authorization: 'Bearer ' + accessToken,
				},
			};
			response = await axios.get('https://api.intra.42.fr/v2/me', config);

			// Storing user in database.
			const user = response.data;
			let userDb = await prisma.user.findUnique({
				where: {
					id42: user.id,
				}
			});
			if (!userDb) {

				// If the user already exists, we add a number to its nickname.
				let name = user.login;
				let i = 1;
				while (await prisma.user.findUnique({ where: { nickname: name, } })) {
					name = user.login + i;
					i++;
				}

				userDb = await prisma.user.create({
					data: {
						nickname: name,
						id42: user.id,
						authtype: AuthType.FORTYTWO,
						token42: accessToken,
						avatar: user.image.link,
						email: user.email,
					}
				});
				await prisma.achievement.createMany({
					data: [
						{
							userId: userDb.id,
							icon: "/assets/baby_icon.png", //peu fructueux
							title: "Baby steps",
							description: "Played the game for the first time",
						},
						{
							userId: userDb.id,
							icon: "fa-solid fa-jet-fighter-up",
							title: "Veteran",
							description: "Played 10 games",
						},
						{
							userId: userDb.id,
							icon: "fa-solid fa-lemon",
							title: "Easy peasy lemon squeezy",
							description: "Won 3 games",
						},
						{
							userId: userDb.id,
							icon: "fa-solid fa-user-slash",
							title: "It's my lil bro playing",
							description: "Lost 3 games",
						},
						{
							userId: userDb.id,
							icon: "fa-solid fa-viruses",
							title: "Social butterfly",
							description: "Added 3 friends",
						},
						{
							userId: userDb.id,
							icon: "fa-solid fa-user-astronaut",
							title: "Influencer",
							description: "Added 10 friends",
						},
						{
							userId: userDb.id,
							icon: "fa-solid fa-shield-dog",
							title: "Safety first",
							description: "Activated the 2FA authentification",
						},
						{
							userId: userDb.id,
							icon: "fa-solid fa-hand-spock",
							title: "Writer soul",
							description: "Change your bio",
						},
						{
							userId: userDb.id,
							icon: "fa-solid fa-hand-spock",
							title: "My safe place",
							description: "Created their first channel",
						},
						{
							userId: userDb.id,
							icon: "fa-solid fa-user-astronaut",
							title: "Roland Garros",
							description: "Make 3 aces !",
						},
						{
							userId: userDb.id,
							icon: "fa-solid fa-user-astronaut",
							title: "WINNER WINNER CHICKEN DINER",
							description: "TOP 1 of the leaderboard",
						},
					]
				});
			}
			
			// Handle 2FA login
			if (userDb.enabled2FA === true) {
				this.mailService.send2FALoginCode(userDb.id);
				await prisma.user.update({
					where: { id: userDb.id },
					data: { login2FAstatus: true }
				});
				return res.redirect(process.env.FRONTEND_URL + '/2fa/pending');
			}

			await this.generateToken(userDb.id, res);

			// this.webSocketGateway.server.emit('activity', userDb.nickname);

			return res.redirect(process.env.FRONTEND_URL + '/settings');

		} catch (error) {
			throw new HttpException('Invalid resolution from 42 API.', 502);
		}
	}

	async login(body: AuthDto, @Res({ passthrough: true }) res: Response) {
		// Find the user by nickname.
		// If the user doesn't exists, throw an error.
		try {
			const activeUser = await prisma.user.findUniqueOrThrow({
				where: { nickname: body.nickname },
			})

			// Compare passwords.
			// If they don't match, throw an exception.
			const pwMatch = await argon.verify(activeUser.password, body.password, hashingConfig);
			if (pwMatch === false)
				throw new ForbiddenException('Password incorrect');

			// Handle 2FA login
			if (activeUser.enabled2FA === true) {
				this.mailService.send2FALoginCode(activeUser.id);
				await prisma.user.update({
					where: { id: activeUser.id },
					data: { login2FAstatus: true }
				});
				return { doubleFA: true };
			}

			await this.generateToken(activeUser.id, res);

			// this.webSocketGateway.server.emit('activity', activeUser.nickname);

			return { doubleFA: false };

		} catch (error) {
			if (error.code === 'P2025') {
				const errorMessage = 'No such nickname';
				throw new ForbiddenException(errorMessage);
			}
			else {
				const errorMessage = 'Invalid login. Have you signed up?';
				throw new ForbiddenException(errorMessage);
			}
		}
	}

	async login2FA(@Query() query, @Res({ passthrough: true }) res: Response) {
		const code = query.code;
		const id: number = +query.userId;
		try {
			if (await this.mailService.Confirmation2FA(id, code)) {
				const user = await prisma.user.update({
					where: { id: id },
					data: { login2FAstatus: false }
				});
				await this.generateToken(id, res);
				return "Successfully logged!";
			}
		} catch (error) {
			throw new ForbiddenException('Invalid Link.');
		}
		throw new ForbiddenException('Invalid Link.');
	}

	async signup(body: AuthDto, @Res({ passthrough: true }) res: Response) {

		try {
			// generate password hash
			const { randomBytes } = await import('crypto');
			const buf = randomBytes(16);
			const hash = await argon.hash(body.password, {
				...hashingConfig,
				salt: buf
			});

			const avatarpath = "/assets/avatar" + Math.floor((Math.random() * 2.99) + 1) + ".png";
			// save the new user in the db
			const newUser = await prisma.user.create({
				data: {
					nickname: body.nickname,
					avatar: avatarpath,
					password: hash,
					authtype: AuthType.LOGNPWD,
				},
			});

			// create the achievements and add it to the user created
			const userId = newUser.id;

			await prisma.achievement.createMany({
				data: [
					{
						userId: userId,
						icon: "/assets/baby_icon.png", //peu fructueux
						title: "Baby steps",
						description: "Played the game for the first time",
					},
					{
						userId: userId,
						icon: "fa-solid fa-jet-fighter-up",
						title: "Veteran",
						description: "Played 10 games",
					},
					{
						userId: userId,
						icon: "fa-solid fa-lemon",
						title: "Easy peasy lemon squeezy",
						description: "Won 3 games",
					},
					{
						userId: userId,
						icon: "fa-solid fa-user-slash",
						title: "It's my lil bro playing",
						description: "Lost 3 games",
					},
					{
						userId: userId,
						icon: "fa-solid fa-viruses",
						title: "Social butterfly",
						description: "Added 3 friends",
					},
					{
						userId: userId,
						icon: "fa-solid fa-user-astronaut",
						title: "Influencer",
						description: "Added 10 friends",
					},
					{
						userId: userId,
						icon: "fa-solid fa-shield-dog",
						title: "Safety first",
						description: "Activated the 2FA authentification",
					},
					{
						userId: userId,
						icon: "fa-solid fa-hand-spock",
						title: "Writer soul",
						description: "Change your bio",
					},
					{
						userId: userId,
						icon: "fa-solid fa-hand-spock",
						title: "My safe place",
						description: "Created their first channel",
					},
					{
						userId: userId,
						icon: "fa-solid fa-user-astronaut",
						title: "Roland Garros",
						description: "Make 3 aces !",
					},
					{
						userId: userId,
						icon: "fa-solid fa-user-astronaut",
						title: "WINNER WINNER CHICKEN DINER",
						description: "TOP 1 of the leaderboard",
					},
				]
			});

			await this.generateToken(newUser.id, res);

			return "Successfully signed up!";

		} catch (error) {

			if (error.code === "P2002")
				throw new ForbiddenException('Credentials taken');

			throw error;
		}
	}

	async logout(userId: number, @Res({ passthrough: true }) res: Response) {

		// Delete jwt from cookies.
		res.clearCookie('jwt');

		// Close socket connection.
		const socket = this.socketsService.currentActiveUsers.get(userId);
		socket?.disconnect(true);

		return "Successfully logged out.";
	}

	async generateToken(userId: number, @Res({ passthrough: true }) res: Response) {

		// Generate access JWT.
		const payload = { sub: userId };
		const jwt = await this.jwtService.signAsync(payload, {
			secret: process.env.JWT_SECRET,
			expiresIn: '1d',
		});

		// Add new tokens in cookies.
		res.cookie('jwt', jwt, {
			httpOnly: true, // Ensures that the cookie cannot be accessed via client-side JavaScript
			secure: true, // Only send the cookie over HTTPS
			maxAge: 60 * 60 * 24 * 1000, // Set cookie expiry to 1 day
			signed: true, // Indicates if the cookie should be signed
			sameSite: 'none', // Allow cross-site cookies
		});

		return true;
	}
}
