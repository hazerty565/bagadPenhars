export interface Track {
  id: number
  title: string
  subtitle: string
  album: string
  duration: number
  year: number
  instruments: string
  albumArt: string
}

export const tracks: Track[] = [
  {
    id: 1,
    title: "Kan ar Mor",
    subtitle: "Chant de la mer",
    album: "Breizh Éternel",
    duration: 222,
    year: 2023,
    instruments: "Binioù, Bombarde, Tambour",
    albumArt: "/album1.webp",
  },
  {
    id: 2,
    title: "Bale en Dro",
    subtitle: "La danse tournante",
    album: "Breizh Éternel",
    duration: 255,
    year: 2023,
    instruments: "Binioù, Bombarde",
    albumArt: "/album1.webp",
  },
  {
    id: 3,
    title: "Gavotte Pourlet",
    subtitle: "Danse du Poher",
    album: "Breizh Éternel",
    duration: 198,
    year: 2023,
    instruments: "Binioù, Bombarde, Caisse claire",
    albumArt: "/album1.webp",
  },
  {
    id: 4,
    title: "Plinn ha Laridé",
    subtitle: "Suite de danses",
    album: "Terres d'Armor",
    duration: 314,
    year: 2021,
    instruments: "Binioù, Bombarde, Percussion",
    albumArt: "/album2.webp",
  },
  {
    id: 5,
    title: "An Dro Izel",
    subtitle: "La danse basse",
    album: "Terres d'Armor",
    duration: 241,
    year: 2021,
    instruments: "Binioù, Bombarde",
    albumArt: "/album2.webp",
  },
  {
    id: 6,
    title: "Suite de Kerne",
    subtitle: "Cornouaille médiévale",
    album: "Kerne Ancient",
    duration: 278,
    year: 2019,
    instruments: "Binioù Kozh, Veuze, Tambourin",
    albumArt: "/album3.webp",
  },
]

export const albums = [
  {
    id: 1,
    title: "Breizh Éternel",
    year: 2023,
    trackCount: 12,
    cover: "/album1.webp",
    description: "Notre album le plus récent, une immersion dans les traditions musicales du Pays de Cornouaille.",
  },
  {
    id: 2,
    title: "Terres d'Armor",
    year: 2021,
    trackCount: 10,
    cover: "/album2.webp",
    description: "Un voyage à travers les paysages sonores de l'Armor, entre landes et côtes sauvages.",
  },
  {
    id: 3,
    title: "Kerne Ancient",
    year: 2019,
    trackCount: 8,
    cover: "/album3.webp",
    description: "Retour aux sources médiévales de la musique cornouaillaise.",
  },
]

export const events = [
  {
    id: 1,
    date: "2026-07-14",
    title: "Festival Interceltique",
    location: "Lorient, Morbihan",
    type: "Festival",
    description: "Grande parade et concert au festival interceltique de Lorient.",
  },
  {
    id: 2,
    date: "2026-08-03",
    title: "Fête de Cornouaille",
    location: "Quimper, Finistère",
    type: "Festival",
    description: "Participation au grand défilé de la Fête de Cornouaille.",
  },
  {
    id: 3,
    date: "2026-09-20",
    title: "Concert de Rentrée",
    location: "Douarnenez, Finistère",
    type: "Concert",
    description: "Concert de rentrée en plein air sur le port de Douarnenez.",
  },
  {
    id: 4,
    date: "2026-10-11",
    title: "Nuit Celtique",
    location: "Brest, Finistère",
    type: "Concert",
    description: "Une soirée magique au coeur de la ville de Brest.",
  },
  {
    id: 5,
    date: "2026-11-01",
    title: "Sammor — Fête des Morts",
    location: "Penhars, Quimper",
    type: "Tradition",
    description: "Célébration traditionnelle de la Samain, soirée musicale et recueillement.",
  },
]
