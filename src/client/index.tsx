import { createRoot } from "react-dom/client";
import { usePartySocket } from "partysocket/react";
import React, { useState } from "react";
import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
	useParams,
} from "react-router";
import { nanoid } from "nanoid";

import { names, type ChatMessage, type Message } from "../shared";
import { GifPicker } from "./GifPicker";


function App() {
	const [name] = useState(names[Math.floor(Math.random() * names.length)]);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
	const { room } = useParams();

	const rateLimitRef = React.useRef<{
		messageTimestamps: number[];
		lastMessageContent: string;
		repeatCount: number;
		lastMessageTime: number; // Keeping for backward compat if needed, though mostly replaced
	}>({
		messageTimestamps: [],
		lastMessageContent: "",
		repeatCount: 0,
		lastMessageTime: 0,
	});

	const socket = usePartySocket({
		party: "chat",
		room,
		onMessage: (evt) => {
			const message = JSON.parse(evt.data as string) as Message;
			if (message.type === "add") {
				const foundIndex = messages.findIndex((m) => m.id === message.id);
				if (foundIndex === -1) {
					// probably someone else who added a message
					setMessages((messages) => [
						...messages,
						{
							id: message.id,
							content: message.content,
							user: message.user,
							role: message.role,
							type: message.messageType,
							timestamp: message.timestamp,
						},
					]);
				} else {
					// this usually means we ourselves added a message
					// and it was broadcasted back
					// so let's replace the message with the new message
					setMessages((messages) => {
						return messages
							.slice(0, foundIndex)
							.concat({
								id: message.id,
								content: message.content,
								user: message.user,
								role: message.role,
								type: message.messageType,
								timestamp: message.timestamp,
							})
							.concat(messages.slice(foundIndex + 1));
					});
				}
			} else if (message.type === "update") {
				setMessages((messages) =>
					messages.map((m) =>
						m.id === message.id
							? {
								id: message.id,
								content: message.content,
								user: message.user,
								role: message.role,
								type: message.messageType,
								timestamp: message.timestamp,
							}
							: m,
					),
				);
			} else {
				setMessages(message.messages);
			}
		},
	});

	const scrollRef = React.useRef<HTMLDivElement>(null);
	const [autoScroll, setAutoScroll] = useState(true);

	const handleScroll = () => {
		if (scrollRef.current) {
			const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
			const atBottom = scrollHeight - scrollTop - clientHeight < 50;
			setAutoScroll(atBottom);
		}
	};

	React.useLayoutEffect(() => {
		if (autoScroll && scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages, autoScroll]);

	const handleGifSelect = (url: string) => {
		setIsGifPickerOpen(false);
		const content = url;
		const now = Date.now();
		const rateLimit = rateLimitRef.current;

		// Minimal validation for GIFs selected via UI (assuming valid URL)
		// We can reuse some of existing rate limit logic if we want, or just standard send logic
		// For simplicity, let's just mirror the success path of existing send logic

		rateLimit.messageTimestamps.push(now); // Count towards rate limit
		// Reset repeat count for different message type
		rateLimit.repeatCount = 0;
		rateLimit.lastMessageContent = "";

		const chatMessage: ChatMessage = {
			id: nanoid(8),
			content,
			user: name,
			role: "user",
			type: "image",
			timestamp: Date.now(),
		};

		setMessages((messages) => [...messages, chatMessage]);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { type: msgType, ...rest } = chatMessage;
		socket.send(
			JSON.stringify({
				type: "add",
				...rest,
				messageType: msgType,
			} satisfies Message),
		);

		setAutoScroll(true);
	};

	return (
		<div className="chat-app" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
			<div
				className="message-list"
				ref={scrollRef}
				onScroll={handleScroll}
				style={{ flex: 1, overflowY: "auto", padding: "10px", paddingBottom: "20px" }}
			>
				{messages.map((message) => (
					<div key={message.id} className="row message">
						<div className="two columns user" style={{ marginRight: "10px" }}>
							{message.user}
						</div>
						<div className="nine columns" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
							<div style={{ flex: 1, wordBreak: "break-word" }}>
								{message.type === "image" ? (
									<img src={message.content} alt={message.content} style={{ maxWidth: "100%" }} />
								) : (
									message.content
								)}
							</div>
							{message.timestamp && (
								<span style={{ fontSize: "0.7em", color: "#888", marginLeft: "15px", whiteSpace: "nowrap", alignSelf: "flex-start", marginTop: "2px" }}>
									{typeof message.timestamp === "number"
										? new Intl.DateTimeFormat(undefined, {
											month: "short",
											day: "numeric",
											hour: "2-digit",
											minute: "2-digit",
										}).format(message.timestamp)
										: message.timestamp}
								</span>
							)}
						</div>
					</div>
				))}
			</div>
			<div className="input-area" style={{ padding: "20px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
				<form
					className="row"
					style={{ marginBottom: 0 }}
					onSubmit={async (e) => {
						e.preventDefault();
						const contentInput = e.currentTarget.elements.namedItem(
							"content",
						) as HTMLInputElement;
						let content = contentInput.value;
						if (!content.trim()) {
							return;
						}

						// Client-side Validation and Limits
						const now = Date.now();
						const rateLimit = rateLimitRef.current;

						// 1. Character Limit
						if (content.length > 250) {
							alert("Message too long. Limit is 250 characters.");
							return;
						}

						// 2. Spam Prevention
						const normalizedContent = content.replace(
							/[\p{C}\p{Z}\u3164\u115F\u1160\uFFA0\u2800\u180B-\u180E\uFE00-\uFE0F\uFEFF\u{E0000}-\u{E007F}]/gu,
							"",
						);
						if (normalizedContent === rateLimit.lastMessageContent) {
							if (rateLimit.repeatCount >= 2) { // Already sent twice, this would be 3rd
								alert("You cannot send the same message 3 times in a row.");
								return;
							}
						}

						// 3. Rate Limit (10 messages per minute)
						// Filter timestamps older than 60s
						rateLimit.messageTimestamps = (rateLimit.messageTimestamps || []).filter(
							(t) => now - t < 60000
						);

						if (rateLimit.messageTimestamps.length >= 10) {
							alert("Rate limit exceeded. Max 10 messages per minute.");
							return;
						}

						// If all checks pass, update state
						if (normalizedContent === rateLimit.lastMessageContent) {
							rateLimit.repeatCount = (rateLimit.repeatCount || 0) + 1;
						} else {
							rateLimit.lastMessageContent = normalizedContent;
							rateLimit.repeatCount = 1;
						}
						rateLimit.messageTimestamps.push(now);

						let type: "text" | "image" = "text";

						if (content.startsWith("/gif ")) {
							const query = content.slice(5);
							try {
								const res = await fetch(
									`https://g.tenor.com/v1/search?q=${query}&key=LIVDSRZULELA&limit=1`,
								);
								const data = await res.json();
								const url = data.results?.[0]?.media?.[0]?.gif?.url;
								if (url) {
									content = url;
									type = "image";
								}
							} catch {
								// ignore error
							}
						}

						const chatMessage: ChatMessage = {
							id: nanoid(8),
							content,
							user: name,
							role: "user",
							type,
							timestamp: Date.now(),
						};
						setMessages((messages) => [...messages, chatMessage]);
						// we could broadcast the message here

						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const { type: msgType, ...rest } = chatMessage;
						socket.send(
							JSON.stringify({
								type: "add",
								...rest,
								messageType: msgType,
							} satisfies Message),
						);

						contentInput.value = "";
						// Force scroll to bottom after active user send
						setAutoScroll(true);
					}}
				>
					<input
						type="text"
						name="content"
						className="nine columns my-input-text"
						placeholder={`Hello ${name}! Type a message...`}
						autoComplete="off"
						style={{ marginBottom: 0 }}
					/>
					<button
						type="button"
						className="one column"
						style={{
							marginBottom: 0,
							background: "transparent",
							border: "1px solid rgba(255,255,255,0.2)",
							color: "#fff",
							padding: 0,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer"
						}}
						onClick={() => setIsGifPickerOpen(true)}
						title="Choose GIF"
					>
						GIF
					</button>
					<button type="submit" className="send-message one column" style={{ marginBottom: 0 }}>
						Send
					</button>
				</form>
			</div>
			<GifPicker
				isOpen={isGifPickerOpen}
				onClose={() => setIsGifPickerOpen(false)}
				onSelect={handleGifSelect}
			/>
		</div>
	);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
	<BrowserRouter>
		<Routes>
			<Route path="/" element={<Navigate to={`/${nanoid()}`} />} />
			<Route path="/:room" element={<App />} />
			<Route path="*" element={<Navigate to="/" />} />
		</Routes>
	</BrowserRouter>,
);
