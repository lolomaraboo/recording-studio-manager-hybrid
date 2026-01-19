/**
 * Music Profile Presets
 * Hierarchical genre and instrument structures for multi-select components
 */

export interface GenreCategory {
  parent: string;
  subgenres: string[];
}

export interface InstrumentFamily {
  family: string;
  instruments: string[];
}

/**
 * 15+ parent genres with subgenres
 * User-editable and customizable per organization
 */
export const PRESET_GENRES: GenreCategory[] = [
  {
    parent: "Rock",
    subgenres: ["Classic Rock", "Alternative Rock", "Indie Rock", "Progressive Rock", "Punk Rock", "Hard Rock", "Psychedelic Rock"]
  },
  {
    parent: "Pop",
    subgenres: ["Pop", "Synth-pop", "Indie Pop", "Electropop", "K-Pop", "J-Pop", "Dance-pop"]
  },
  {
    parent: "Hip-Hop",
    subgenres: ["Hip-Hop", "Trap", "Boom Bap", "Conscious Hip-Hop", "Cloud Rap", "Drill", "Lo-fi Hip-Hop"]
  },
  {
    parent: "Electronic",
    subgenres: ["House", "Techno", "Trance", "Dubstep", "Drum & Bass", "EDM", "Ambient", "Downtempo"]
  },
  {
    parent: "Jazz",
    subgenres: ["Bebop", "Cool Jazz", "Free Jazz", "Fusion", "Smooth Jazz", "Latin Jazz", "Contemporary Jazz"]
  },
  {
    parent: "Classical",
    subgenres: ["Baroque", "Romantic", "Contemporary Classical", "Minimalism", "Opera", "Chamber Music"]
  },
  {
    parent: "R&B/Soul",
    subgenres: ["R&B", "Soul", "Neo-Soul", "Contemporary R&B", "Motown", "Funk"]
  },
  {
    parent: "Country",
    subgenres: ["Country", "Bluegrass", "Americana", "Country Rock", "Outlaw Country", "Contemporary Country"]
  },
  {
    parent: "Metal",
    subgenres: ["Heavy Metal", "Thrash Metal", "Death Metal", "Black Metal", "Power Metal", "Progressive Metal", "Metalcore"]
  },
  {
    parent: "Folk",
    subgenres: ["Folk", "Indie Folk", "Folk Rock", "Traditional Folk", "Contemporary Folk", "Celtic"]
  },
  {
    parent: "Reggae",
    subgenres: ["Reggae", "Dub", "Dancehall", "Ska", "Roots Reggae", "Reggaeton"]
  },
  {
    parent: "Latin",
    subgenres: ["Salsa", "Bachata", "Merengue", "Cumbia", "Reggaeton", "Bossa Nova", "Tango"]
  },
  {
    parent: "World",
    subgenres: ["Afrobeat", "Flamenco", "Fado", "Bollywood", "Arabic", "African", "Asian"]
  },
  {
    parent: "Blues",
    subgenres: ["Chicago Blues", "Delta Blues", "Electric Blues", "Blues Rock", "Country Blues"]
  },
  {
    parent: "Gospel",
    subgenres: ["Gospel", "Contemporary Christian", "Worship", "Southern Gospel", "Urban Contemporary Gospel"]
  },
  {
    parent: "Experimental",
    subgenres: ["Avant-garde", "Noise", "Industrial", "Glitch", "IDM", "Sound Art"]
  },
  {
    parent: "Soundtrack",
    subgenres: ["Film Score", "Game Soundtrack", "TV Soundtrack", "Musical Theatre"]
  }
];

/**
 * Flatten genres for multi-select (all parent + subgenres)
 * Deduplicated to avoid duplicate keys in React
 */
export const FLAT_GENRES = Array.from(new Set(PRESET_GENRES.flatMap(g => [g.parent, ...g.subgenres])));

/**
 * 12+ instrument families with specific instruments
 * User-editable and customizable per organization
 */
export const PRESET_INSTRUMENTS: InstrumentFamily[] = [
  {
    family: "Vocals",
    instruments: ["Lead Vocals", "Backing Vocals", "Soprano", "Alto", "Tenor", "Baritone", "Bass", "Beatboxing"]
  },
  {
    family: "Guitar",
    instruments: ["Electric Guitar", "Acoustic Guitar", "Classical Guitar", "Bass Guitar", "12-String Guitar", "Lap Steel", "Resonator"]
  },
  {
    family: "Keys",
    instruments: ["Piano", "Keyboard", "Synthesizer", "Organ", "Rhodes", "Wurlitzer", "Accordion", "Harpsichord"]
  },
  {
    family: "Drums/Percussion",
    instruments: ["Drums", "Congas", "Bongos", "Timbales", "Cajón", "Djembe", "Hand Percussion", "Marimba", "Vibraphone", "Xylophone"]
  },
  {
    family: "Bass",
    instruments: ["Electric Bass", "Upright Bass", "Fretless Bass", "Synth Bass"]
  },
  {
    family: "Strings",
    instruments: ["Violin", "Viola", "Cello", "Double Bass", "Harp", "Mandolin", "Banjo", "Ukulele"]
  },
  {
    family: "Brass",
    instruments: ["Trumpet", "Trombone", "French Horn", "Tuba", "Euphonium", "Cornet", "Flugelhorn"]
  },
  {
    family: "Woodwinds",
    instruments: ["Saxophone", "Clarinet", "Flute", "Oboe", "Bassoon", "Piccolo", "Recorder"]
  },
  {
    family: "Electronic Production",
    instruments: ["MIDI Controller", "Drum Machine", "Sampler", "Sequencer", "Modular Synth", "Groovebox"]
  },
  {
    family: "World Instruments",
    instruments: ["Sitar", "Tabla", "Didgeridoo", "Kora", "Shamisen", "Erhu", "Oud", "Bouzouki"]
  },
  {
    family: "DJ/Turntables",
    instruments: ["Turntables", "CDJ", "DJ Controller", "Mixer"]
  },
  {
    family: "Sound Design",
    instruments: ["Field Recording", "Foley", "Sound Effects", "Audio Programming"]
  },
  {
    family: "Other",
    instruments: ["Harmonica", "Melodica", "Theremin", "Kazoo", "Steel Drums"]
  }
];

/**
 * Flatten instruments for multi-select (all instruments across families)
 */
export const FLAT_INSTRUMENTS = PRESET_INSTRUMENTS.flatMap(f => f.instruments);
