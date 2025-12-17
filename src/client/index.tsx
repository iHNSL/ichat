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

function App() {
	const [name] = useState(names[Math.floor(Math.random() * names.length)]);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const { room } = useParams();

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

	return (
		<div className="chat container">
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
								{message.timestamp}
							</span>
						)}
					</div>
				</div>
			))}
			<form
				className="row"
				onSubmit={async (e) => {
					e.preventDefault();
					const contentInput = e.currentTarget.elements.namedItem(
						"content",
					) as HTMLInputElement;
					let content = contentInput.value;
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
						timestamp: new Intl.DateTimeFormat("en-GB", {
							hour: "2-digit",
							minute: "2-digit",
							timeZone: "Etc/GMT-1",
						}).format(new Date()),
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
				}}
			>
				<input
					type="text"
					name="content"
					className="ten columns my-input-text"
					placeholder={`Hello ${name}! Type a message...`}
					autoComplete="off"
				/>
				<button type="submit" className="send-message two columns">
					Send
				</button>
			</form>
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
