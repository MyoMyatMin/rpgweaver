import { NextRequest } from "next/server";
import type { DemoTemplate } from "@/types";

const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    id: "blacksmith-dialogue",
    name: "Blacksmith's Warning",
    description: "A serious blacksmith warns about an ancient forge awakening",
    type: "dialogue",
    data: {
      gameLore:
        "The city of Emberreach was built atop ancient lava tunnels. The Ember Core, a relic that stabilizes the city's forges, is weakening. Guilds compete for influence, and the Night Wardens patrol shadowed alleys. Magic is regulated; contraband runes circulate in the black market.",
      npcName: "Mira Stoneveil",
      npcPersonality: "Serious",
      situation:
        "The blacksmith warns about an ancient forge awakening beneath the city",
    },
  },
  {
    id: "mysterious-merchant",
    name: "Mysterious Merchant",
    description: "A cryptic merchant offers dangerous deals",
    type: "dialogue",
    data: {
      gameLore:
        "The city of Emberreach was built atop ancient lava tunnels. The Ember Core, a relic that stabilizes the city's forges, is weakening. Guilds compete for influence, and the Night Wardens patrol shadowed alleys. Magic is regulated; contraband runes circulate in the black market.",
      npcName: "Zara the Veiled",
      npcPersonality: "Mysterious",
      situation:
        "A hooded merchant offers rare magical items at suspiciously low prices",
    },
  },
  {
    id: "goofy-innkeeper",
    name: "Goofy Innkeeper",
    description: "A cheerful innkeeper shares local gossip",
    type: "dialogue",
    data: {
      gameLore:
        "The city of Emberreach was built atop ancient lava tunnels. The Ember Core, a relic that stabilizes the city's forges, is weakening. Guilds compete for influence, and the Night Wardens patrol shadowed alleys. Magic is regulated; contraband runes circulate in the black market.",
      npcName: "Bartholomew Bright",
      npcPersonality: "Goofy",
      situation: "The innkeeper shares humorous stories about local characters",
    },
  },
  {
    id: "ember-core-quest",
    name: "Ember Core Quest",
    description: "Retrieve the unstable Ember Core from lava tunnels",
    type: "quest",
    data: {
      gameLore:
        "The city of Emberreach was built atop ancient lava tunnels. The Ember Core, a relic that stabilizes the city's forges, is weakening. Guilds compete for influence, and the Night Wardens patrol shadowed alleys. Magic is regulated; contraband runes circulate in the black market.",
      location: "Emberreach Lava Tunnels",
      primaryObjective:
        "Retrieve the unstable Ember Core before it causes a catastrophic eruption",
    },
  },
  {
    id: "night-warden-quest",
    name: "Night Warden Investigation",
    description: "Help the Night Wardens investigate contraband runes",
    type: "quest",
    data: {
      gameLore:
        "The city of Emberreach was built atop ancient lava tunnels. The Ember Core, a relic that stabilizes the city's forges, is weakening. Guilds compete for influence, and the Night Wardens patrol shadowed alleys. Magic is regulated; contraband runes circulate in the black market.",
      location: "Emberreach Market District",
      primaryObjective:
        "Investigate the source of illegal magical runes circulating in the black market",
    },
  },
  {
    id: "guild-conflict",
    name: "Guild Conflict",
    description: "Navigate tensions between competing guilds",
    type: "dialogue",
    data: {
      gameLore:
        "The city of Emberreach was built atop ancient lava tunnels. The Ember Core, a relic that stabilizes the city's forges, is weakening. Guilds compete for influence, and the Night Wardens patrol shadowed alleys. Magic is regulated; contraband runes circulate in the black market.",
      npcName: "Captain Thorne",
      npcPersonality: "Aggressive",
      situation:
        "A guild captain demands support in their conflict with rival guilds",
    },
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  let templates = DEMO_TEMPLATES;
  if (type && (type === "dialogue" || type === "quest")) {
    templates = templates.filter((t) => t.type === type);
  }

  return new Response(JSON.stringify(templates), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
