/**
 * The five evidence-based features in MindMate, with the sources they are
 * built on. Shown on the About page and inside each feature, so users can see
 * exactly what each recommendation is based on and where its limits are.
 */
export const EVIDENCE = [
  {
    id: 'physical-activity',
    feature: 'movement',
    route: '/wellbeing/movement',
    title: 'Move your body',
    summary: 'Regular physical activity reduces symptoms of depression and anxiety, and some activity is better than none.',
    evidence:
      'WHO 2020 guidelines recommend 150–300 minutes of moderate (or 75–150 minutes of vigorous) activity per week for adults, and list reduced symptoms of anxiety and depression among the benefits. NICE guideline NG222 includes group exercise as a first-line option for less severe depression.',
    limits: 'Benefits build over weeks. Exercise is not a replacement for treatment of moderate or severe depression.',
    risks: 'Start gently if you are new to exercise, have a health condition, or are pregnant; check with a doctor if unsure. Avoid using exercise to punish yourself or compensate for eating.',
    sources: [
      { label: 'WHO Guidelines on Physical Activity and Sedentary Behaviour (2020)', url: 'https://www.ncbi.nlm.nih.gov/books/NBK566048/' },
      { label: 'NICE NG222: Depression in adults (2022)', url: 'https://www.nice.org.uk/guidance/ng222' },
    ],
  },
  {
    id: 'behavioural-activation',
    feature: 'plans',
    route: '/wellbeing/plans',
    title: 'Plan something good',
    summary: 'Scheduling small enjoyable or meaningful activities, then noticing how they affect your mood, can lift low mood.',
    evidence:
      'Behavioural activation (BA) is a structured psychological treatment. A meta-analysis of 26 randomised trials (1,524 participants) found a large effect versus controls (SMD −0.74). NICE NG222 lists BA as a first-line treatment for depression.',
    limits: 'MindMate offers BA-inspired self-help, not the full therapy delivered by a trained practitioner.',
    risks: 'Keep plans small and realistic. Missing a plan is not a failure; it is information.',
    sources: [
      { label: 'Ekers et al. (2014), PLoS ONE: Behavioural activation for depression', url: 'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0100100' },
      { label: 'NICE NG222: Depression in adults (2022)', url: 'https://www.nice.org.uk/guidance/ng222' },
    ],
  },
  {
    id: 'mindfulness',
    feature: 'mindfulness',
    route: '/wellbeing/mindfulness',
    title: 'Mindfulness & breathing',
    summary: 'Paying calm, non-judgemental attention to the present moment can reduce stress and anxiety.',
    evidence:
      'In a randomised trial of 276 adults with anxiety disorders, an 8-week Mindfulness-Based Stress Reduction course was non-inferior to the antidepressant escitalopram, with fewer side effects (JAMA Psychiatry, 2022). NICE NG222 includes group mindfulness and recommends mindfulness-based cognitive therapy to help prevent relapse.',
    limits: 'Trials studied structured 8-week courses; short app sessions are a gentler, lighter-touch version.',
    risks: 'For some people, especially with trauma, focusing inward can bring up distress. Keep your eyes open, shorten the session, or stop at any time.',
    sources: [
      { label: 'Hoge et al. (2022), JAMA Psychiatry: MBSR vs escitalopram', url: 'https://jamanetwork.com/journals/jamapsychiatry/fullarticle/2798510' },
      { label: 'NICE NG222: Depression in adults (2022)', url: 'https://www.nice.org.uk/guidance/ng222' },
    ],
  },
  {
    id: 'sleep',
    feature: 'sleep',
    route: '/wellbeing/sleep',
    title: 'Sleep & routine',
    summary: 'Sleep and mental health affect each other. A steady routine is one of the most reliable ways to sleep better.',
    evidence:
      'NHS self-help guidance, based on cognitive behavioural therapy for insomnia (CBT-I), recommends a consistent wake time, using the bed only for sleep, leaving bed if you can’t sleep after about 15 minutes, a wind-down without screens, and avoiding caffeine within 6 hours and alcohol within 4 hours of bed.',
    limits: 'A sleep diary helps you notice patterns; it doesn’t diagnose sleep disorders.',
    risks: 'Loud snoring, gasping at night, or insomnia lasting more than 3 months are worth discussing with a doctor.',
    sources: [
      { label: 'NHS Inform: Sleep problems and insomnia self-help guide', url: 'https://www.nhsinform.scot/illnesses-and-conditions/mental-health/mental-health-self-help-guides/sleep-problems-and-insomnia-self-help-guide/' },
    ],
  },
  {
    id: 'social-connection',
    feature: 'connection',
    route: '/wellbeing/connection',
    title: 'Stay connected',
    summary: 'Feeling connected to other people protects mental and physical health. Small moments of contact count.',
    evidence:
      'The US Surgeon General’s 2023 advisory on loneliness and isolation concludes that social connection predicts better physical and mental health and reduces the risk of premature death. The NHS “5 steps to mental wellbeing” begins with “Connect with other people”.',
    limits: 'The evidence is largely observational: connection and wellbeing go together, and each likely helps the other.',
    risks: 'Prioritise people who feel safe. If someone in your life is hurting you, support services can help.',
    sources: [
      { label: 'US Surgeon General: Our Epidemic of Loneliness and Isolation (2023)', url: 'https://www.hhs.gov/surgeongeneral/reports-and-publications/connection/index.html' },
      { label: 'NHS: 5 steps to mental wellbeing', url: 'https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/five-steps-to-mental-wellbeing/' },
    ],
  },
];

export const evidenceFor = (id) => EVIDENCE.find((e) => e.id === id);
