export type ChatMessage = {
	id: string;
	content: string;
	user: string;
	role: "user" | "assistant";
};

export type Message =
	| {
		type: "add";
		id: string;
		content: string;
		user: string;
		role: "user" | "assistant";
	}
	| {
		type: "update";
		id: string;
		content: string;
		user: string;
		role: "user" | "assistant";
	}
	| {
		type: "all";
		messages: ChatMessage[];
	};

export const names = [
	// Div
	"Augustus",
	"Marcus Aurelius",
	"Constantine",
	"Titus",
	"Mini Pekka",
	"Genji",
	"Winton",
	"Mercy",



	// Greek Gods & Mythology
	"Zeus",
	"Poseidon",
	"Hades",
	"Ares",
	"Apollo",
	"Hermes",
	"Hephaestus",
	"Dionysus",
	"Athena",
	"Artemis",
	"Hera",
	"Demeter",
	"Persephone",
	"Hercules",
	"Achilles",
	"Odysseus",

	// Norse Mythology
	"Odin",
	"Thor",
	"Loki",
	"Freya",
	"Heimdall",
	"Tyr",
	"Baldur",
	"Frigg",

	// Roman Mythology
	"Jupiter",
	"Mars",
	"Minerva",
	"Venus",
	"Mercury",
	"Neptune",
	"Pluto",
	"Gaia",
	"Vulcan",

	// Egyptian Mythology
	"Ra",
	"Anubis",
	"Osiris",
	"Isis",
	"Horus",
	"Set",
	"Thoth",
	"Bastet",
];
