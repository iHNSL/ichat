import {
	type Connection,
	Server,
	type WSMessage,
	routePartykitRequest,
} from "partyserver";

import type { ChatMessage, Message } from "../shared";

export class Chat extends Server<Env> {
	static options = { hibernate: true };

	messages = [] as ChatMessage[];

	broadcastMessage(message: Message, exclude?: string[]) {
		this.broadcast(JSON.stringify(message), exclude);
	}

	onStart() {
		// this is where you can initialize things that need to be done before the server starts
		// for example, load previous messages from a database or a service

		// create the messages table if it doesn't exist
		this.ctx.storage.sql.exec(
			`CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, user TEXT, role TEXT, content TEXT, type TEXT, timestamp TEXT)`,
		);
		try {
			this.ctx.storage.sql.exec(`ALTER TABLE messages ADD COLUMN type TEXT`);
		} catch {
			// column probably already exists
		}
		try {
			this.ctx.storage.sql.exec(`ALTER TABLE messages ADD COLUMN timestamp TEXT`);
		} catch {
			// column probably already exists
		}

		// load the messages from the database
		this.messages = this.ctx.storage.sql
			.exec(`SELECT * FROM messages`)
			.toArray() as ChatMessage[];
	}

	onConnect(connection: Connection) {
		connection.send(
			JSON.stringify({
				type: "all",
				messages: this.messages,
			} satisfies Message),
		);
	}

	saveMessage(message: ChatMessage) {
		// check if the message already exists
		const existingMessage = this.messages.find((m) => m.id === message.id);
		if (existingMessage) {
			this.messages = this.messages.map((m) => {
				if (m.id === message.id) {
					return message;
				}
				return m;
			});
		} else {
			this.messages.push(message);
		}

		this.ctx.storage.sql.exec(
			`INSERT INTO messages (id, user, role, content, type, timestamp) VALUES ('${message.id
			}', '${message.user}', '${message.role}', ${JSON.stringify(
				message.content,
			)}, '${message.type || "text"}', '${message.timestamp || ""}') ON CONFLICT (id) DO UPDATE SET content = ${JSON.stringify(
				message.content,
			)}, type = '${message.type || "text"}', timestamp = '${message.timestamp || ""}'`,
		);
	}

	connectionStates = new Map<
		string,
		{ lastMessageTime: number }
	>();

	onMessage(connection: Connection, message: WSMessage) {
		const parsed = JSON.parse(message as string) as Message;

		// Validation 1: Empty message check
		if (!parsed.content || !parsed.content.trim()) {
			return;
		}

		// Initialize connection state if checking user
		let state = this.connectionStates.get(connection.id);
		if (!state) {
			state = { lastMessageTime: 0 };
			this.connectionStates.set(connection.id, state);
		}

		// Validation 2: Cooldown (5 seconds)
		const now = Date.now();
		if (now - state.lastMessageTime < 5000) {
			return; // Cooldown active. Silently ignore.
		}
		state.lastMessageTime = now;

		// let's broadcast the raw message to everyone else
		this.broadcast(message);

		// let's update our local messages store
		if (parsed.type === "add" || parsed.type === "update") {
			this.saveMessage({
				id: parsed.id,
				content: parsed.content,
				user: parsed.user,
				role: parsed.role,
				type: parsed.messageType,
				timestamp: parsed.timestamp,
			});
		}
	}
}

export default {
	async fetch(request, env) {
		return (
			(await routePartykitRequest(request, { ...env })) ||
			env.ASSETS.fetch(request)
		);
	},
} satisfies ExportedHandler<Env>;
