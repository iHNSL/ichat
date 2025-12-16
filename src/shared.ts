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
	// Roman Emperors
	"Augustus",
	"Trajan",
	"Marcus Aurelius",
	"Hadrian",
	"Constantine",
	"Tiberius",
	"Nero",
	"Caligula",
	"Vespasian",
	"Titus",
	"Domitian",
	"Commodus",
	"Septimius Severus",
	"Caracalla",
	"Diocletian",

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
	// Generals (1900-2000)
	"Dwight D. Eisenhower",
	"George S. Patton",
	"Douglas MacArthur",
	"Bernard Montgomery",
	"Erwin Rommel",
	"Georgy Zhukov",
	"John J. Pershing",
	"Norman Schwarzkopf",
	"Vo Nguyen Giap",
	"Chester Nimitz",
	"George Marshall",
	"Omar Bradley",
	"Heinz Guderian",
	"Erich von Manstein",
	"Isoroku Yamamoto",
	"ADOLF HITLER",
	"Colin Powell"
];