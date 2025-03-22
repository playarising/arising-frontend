export type TCivilization = 'ard' | 'shinkari' | 'ikara' | 'tarki' | 'zhand' | 'hartenn'

export interface ICivilizationData {
  id: TCivilization
  civilization: string
  badge: string
  group: string
  background: string
  description1: string
  description2: string
}

export const CIVILIZATIONS: Record<TCivilization, ICivilizationData> = {
  ard: {
    id: 'ard',
    background: '',
    badge: '/assets/civilizations/ard.png',
    civilization: 'Ard',
    description1:
      'Ards are humans who dedicate their lives to the Art of War. They believe that during the fury of battle people are closest to the goddess, and they relentlessly follow this belief.',
    description2:
      'Despite waving the same flag, praying to the same goddess, and letting themselves be governed by the same king, the cities of Rhuvonor are in constant war.',
    group: ''
  },
  hartenn: {
    id: 'hartenn',
    background: '',
    badge: '/assets/civilizations/hartheim.png',
    civilization: 'Hartenn',
    description1:
      'Hartenn are indomitable inhabitants of Tark that reside there even before the glacier catastrophe, holding their territories firmly.',
    description2:
      'The cold weather has molded and hardened them—their culture builds upon the concept of being tough enough to endure every challenge life throws their way.',
    group: ''
  },
  ikara: {
    id: 'ikara',
    background: '',
    badge: '/assets/civilizations/ikaran.png',
    civilization: "I'kara",
    description1:
      "I'kara have a meaningful relationship with nature, even worshiping it. They mostly live in cities built around trees or water bodies.",
    description2:
      "One of the main traits of the I'kara is their ability to adapt. They do so by changing their appearance.",
    group: ''
  },
  shinkari: {
    id: 'shinkari',
    background: '',
    badge: '/assets/civilizations/shinkari.png',
    civilization: 'Shinkari',
    description1: 'Shinkari are a peaceful people until something forces soldiers to unsheath their blades.',
    description2:
      "Since the emperor's death, neither of his two firstborn twins could concede the right to reign. That caused the Great Nation of Akun to divide itself into Eastern Akun and Western Akun.",
    group: ''
  },
  tarki: {
    id: 'tarki',
    background: '',
    badge: '/assets/civilizations/tarki.png',
    civilization: "Tark'i",
    description1: "Tark'i are humans that learned to adapt to the extreme climatic conditions of the continent Tark.",
    description2:
      'They live in small villages and are willing to protect their people by any means necessary. They enjoy simple things like music or dancing around a bonfire.',
    group: ''
  },
  zhand: {
    id: 'zhand',
    background: '',
    badge: '/assets/civilizations/zhand.png',
    civilization: 'Zhand',
    description1:
      "The Zhands are the adaptation result of the people forced to flee Tark upon their defeat in the Hart-I'kara war",
    description2: 'Fearing a bad reception by the Ards, the Zhands migrated to the desert region of the continent.',
    group: ''
  }
}
