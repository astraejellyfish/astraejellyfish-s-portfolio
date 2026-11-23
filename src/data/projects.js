export const hiveCaseStudy = {
  title: 'Crafting an Intuitive Dashboard for Peer-to-Peer Accountability and Role Analytics',
  paragraphs: [
    'Collaborative academic projects often struggle with uneven workload distribution and a lack of individual accountability. HIVE addresses this challenge through a web-based platform that tracks task progress, monitors individual contributions, and encourages peer-to-peer evaluation.',
    'With role-based permissions, contribution tracking, and peer rating mechanisms, HIVE provides a centralized workspace where student leaders can manage team responsibilities while instructors can review verified participation records. The platform aims to promote transparency, encourage active involvement, and support fairer evaluations of individual contributions.',
  ],
  document: {
    type: 'google-slides',
    url: 'https://docs.google.com/presentation/d/1JBvtilgEEyObsm_tJYZ5XZ8JwWkYQtCOOD0opJHm5ls/embed',
  },
}

export const projects = [
  {
    title: 'HIVE',
    image: `${import.meta.env.BASE_URL}images/hive.png`,
    description: 'HIVE is a group participation and task-tracking platform designed to promote accountability and transparency in collaborative academic projects. HIVE monitors individual contributions, task progress, and peer evaluations to encourage balanced participation and fairer performance assessments. ',
    status: 'online',
    role: 'QA Test Lead · Frontend Developer · UI/UX Designer',
    liveUrl: 'https://parti-hive.vercel.app/',
    caseStudy: hiveCaseStudy,
  },
  {
    title: 'Class Connect',
    image: `${import.meta.env.BASE_URL}images/projects/classconnect.png`,
    description: 'Class Connect an interactive classroom participation platform that replaces traditional index-card recitation with a digital student selection system. Using Weighted Random Sampling, Class Connect gives students with fewer participation counts a higher chance of being selected, encouraging more balanced classroom participation.',
    status: 'offline',
    role: 'Individual project · Design · Frontend development · Algorithm implementation · Testing · Project management',
  },
  {
    title: 'Archia World',
    image: null,
    description: 'Archia World is an upcoming pixel-art RPG adventure featuring world exploration, dungeon farming, and challenging boss battles. Planned features include multiplayer events, guild-based Castle Battles, territory expansion, and exclusive rewards, with its story and world lore still in development. ',
    status: 'in development',
    role: 'Individual game development project · Planned engine: Godot',
  },
  {
    title: 'Music Diary',
    image: null,
    description: 'Music Diary is a retro-inspired music journaling application where users can log and share songs that resonate with them, express their emotions through music, and preserve personal memories through daily song entries. It offers a creative space to connect feelings, music, and personal experiences.',
    status: 'in development',
    role: 'Individual project',
  },
]
