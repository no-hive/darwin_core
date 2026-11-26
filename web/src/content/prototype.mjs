// Object content is authored once. UI locale never selects another version.
export const PROTOTYPE={
  "version": 1,
  "currentId": "alan-li",
  "profiles": [
    {
      "key": "alan-li",
      "name": "Alan Li",
      "id": "alan-li.darwincore.ath",
      "job": "Marine biologist, deep-sea sampling",
      "month": 3,
      "year": 1996,
      "scores": [
        3,
        9,
        6,
        4,
        2,
        1
      ],
      "power": 12
    },
    {
      "key": "maya",
      "name": "Maya Rivers",
      "id": "maya-rivers.darwincore.ath",
      "job": "Marine ecology",
      "month": 0,
      "year": 0,
      "scores": [
        3,
        9,
        6,
        2,
        2,
        4
      ],
      "power": 10
    },
    {
      "key": "ines",
      "name": "Inés Soler",
      "id": "ines-soler.darwincore.ath",
      "job": "Marine taxonomy",
      "month": 0,
      "year": 0,
      "scores": [
        2,
        9,
        8,
        3,
        2,
        2
      ],
      "power": 8
    },
    {
      "key": "leo",
      "name": "Leo Hart",
      "id": "leo-hart.darwincore.ath",
      "job": "Open biodiversity research",
      "month": 0,
      "year": 0,
      "scores": [
        6,
        4,
        7,
        3,
        5,
        8
      ],
      "power": 6
    }
  ],
  "groups": [
    {
      "id": "darwin-core-protocol",
      "name": "Darwin Core Protocol",
      "short": "DCP",
      "defaultMembership": true,
      "members": [
        "alan-li",
        "maya",
        "ines",
        "leo"
      ],
      "description": "The shared group for everyone in Darwin Core Protocol. Global articles, protocol news, and community updates belong here.",
      "rules": "Everyone belongs to this group by default. Use the checkbox in Main to choose whether its publications appear in your feed.",
      "tags": [
        "Protocol",
        "Community"
      ],
      "news": "",
      "foundedAt": "2024-02-12"
    },
    {
      "id": "pacific",
      "name": "Pacific Field Collective",
      "short": "PFC",
      "members": [
        "alan-li",
        "maya",
        "ines"
      ],
      "description": "Three researchers, one shared view of Pacific biodiversity. We connect field observations, review evidence, and fund work together.",
      "rules": "Open membership. Members can attach their own findings and vote on active proposals. Authorship stays with the contributor.",
      "tags": [
        "Pacific",
        "Biodiversity"
      ],
      "news": "The next field review is open. Bring your observation notes and discuss the expedition plan.",
      "newsAt": "2026-11-14T09:00:00Z",
      "foundedAt": "2024-06-18"
    },
    {
      "id": "mollusks",
      "name": "Mollusk Research Circle",
      "short": "MRC",
      "members": [
        "maya",
        "ines"
      ],
      "description": "A small circle studying marine mollusks through shared evidence and careful verification.",
      "rules": "Open membership. Join to contribute findings and participate in the group’s decisions.",
      "tags": [
        "Mollusks",
        "Marine taxonomy"
      ],
      "news": "Our specimen review round is ready. Help compare evidence for the Pacific mollusk atlas.",
      "newsAt": "2026-11-15T09:00:00Z",
      "foundedAt": "2025-03-08"
    }
  ],
  "records": [
    {
      "id": "abyssal-skate",
      "authorId": "alan-li",
      "title": "Abyssal skate observation",
      "scientificName": "Bathyraja sp.",
      "description": "An observation from a deep-water camera transect. The evidence includes a field photograph and a sampling note; identification remains at genus level.",
      "date": "2026-11-04",
      "location": "North Pacific · deep-water transect",
      "groupIds": [
        "pacific"
      ],
      "researchIds": [
        "pacific-atlas"
      ],
      "evidence": "Camera transect still and field notebook reference PFC-001. Synthetic example.",
      "status": "verified",
      "createdAt": "2026-11-08T10:00:00Z"
    },
    {
      "id": "reef-coral",
      "authorId": "maya",
      "title": "Reef coral colony",
      "scientificName": "Porites sp.",
      "description": "A documented coral colony from a shallow coastal survey, with a scale reference and habitat notes.",
      "date": "2026-11-05",
      "location": "Central Pacific · coastal reef",
      "groupIds": [
        "pacific",
        "mollusks"
      ],
      "researchIds": [
        "pacific-atlas",
        "mollusk-atlas"
      ],
      "evidence": "Survey photograph and habitat sheet MRC-002. Synthetic example.",
      "status": "verified",
      "createdAt": "2026-11-09T10:00:00Z"
    },
    {
      "id": "nudibranch",
      "authorId": "ines",
      "title": "Nudibranch field finding",
      "scientificName": "Chromodoris sp.",
      "description": "A photographic finding of a nudibranch, submitted for a joint review of color patterns and habitat.",
      "date": "2026-11-06",
      "location": "Western Pacific · intertidal zone",
      "groupIds": [
        "pacific",
        "mollusks"
      ],
      "researchIds": [
        "mollusk-atlas"
      ],
      "evidence": "Macro photograph and observation log MRC-003. Synthetic example.",
      "status": "review",
      "createdAt": "2026-11-10T10:00:00Z"
    },
    {
      "id": "seagrass",
      "authorId": "leo",
      "title": "Seagrass meadow survey",
      "scientificName": "Zostera sp.",
      "description": "A coastal seagrass observation with a repeatable survey method and an open field sheet.",
      "date": "2026-11-07",
      "location": "North Pacific · coastal bay",
      "groupIds": [
        "pacific"
      ],
      "researchIds": [
        "pacific-atlas"
      ],
      "evidence": "Quadrat survey note and photograph PFC-004. Synthetic example.",
      "status": "verified",
      "createdAt": "2026-11-11T10:00:00Z"
    }
  ],
  "research": [
    {
      "id": "pacific-atlas",
      "title": "Pacific biodiversity atlas",
      "description": "Connect observations across habitats to build a small, verifiable regional atlas.",
      "groupIds": [
        "pacific"
      ],
      "memberIds": [
        "alan-li",
        "maya",
        "leo"
      ],
      "createdAt": "2026-11-01T09:00:00Z"
    },
    {
      "id": "mollusk-atlas",
      "title": "Pacific mollusk evidence atlas",
      "description": "Compare field findings, habitat context, and photographic evidence for marine mollusk research.",
      "groupIds": [
        "mollusks"
      ],
      "memberIds": [
        "maya",
        "ines"
      ],
      "createdAt": "2026-11-02T09:00:00Z"
    }
  ],
  "proposals": [
    {
      "id": "expedition-fund",
      "groupId": "pacific",
      "title": "Fund our next Pacific field expedition",
      "description": "Allocate the demonstration budget to shared field equipment and publish a joint expedition report.",
      "status": "active",
      "votes": {
        "maya": "for",
        "ines": "for",
        "leo": "against"
      },
      "createdAt": "2026-11-12T09:00:00Z",
      "endsAt": "2026-11-23T18:00:00Z"
    },
    {
      "id": "evidence-format",
      "groupId": "pacific",
      "title": "Adopt a common observation evidence format",
      "description": "Use one evidence checklist for the group’s photographic findings and field notes. This decision has already been implemented.",
      "status": "executed",
      "votes": {
        "alan-li": "for",
        "maya": "for",
        "ines": "for",
        "leo": "for"
      },
      "createdAt": "2026-11-03T09:00:00Z",
      "endsAt": "2026-11-09T18:00:00Z"
    },
    {
      "id": "specimen-review",
      "groupId": "mollusks",
      "title": "Open a joint specimen verification round",
      "description": "Review the evidence for our atlas together and agree on the next verification priorities.",
      "status": "active",
      "votes": {
        "maya": "for"
      },
      "createdAt": "2026-11-13T09:00:00Z",
      "endsAt": "2026-11-24T18:00:00Z"
    },
    {
      "id": "universal-threshold",
      "groupId": "mollusks",
      "title": "Use a single threshold for every finding",
      "description": "The circle rejected a universal threshold and kept case-by-case review.",
      "status": "defeated",
      "votes": {
        "maya": "against",
        "ines": "against"
      },
      "createdAt": "2026-11-01T09:00:00Z",
      "endsAt": "2026-11-08T18:00:00Z"
    }
  ]
};
