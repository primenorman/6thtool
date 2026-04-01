export interface PromptOption {
  value: string;
  label: string;
}

export interface Prompt {
  id: string;
  type: "text" | "long_text" | "slider" | "multi_select" | "single_select" | "toggle" | "number" | "multi_text" | "dual_slider";
  label: string;
  sublabel?: string;
  placeholder?: string;
  optional?: boolean;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  options?: PromptOption[];
  hasOther?: boolean;
  count?: number;
  label1?: string;
  label2?: string;
  defaultFrom?: string;
  condition?: (responses: Record<string, any>) => boolean;
}

export interface PromptSection {
  label: string;
  title: string;
  description?: string;
  prompts: Prompt[];
}

export interface ModeConfig {
  mode: string;
  label: string;
  sections: PromptSection[];
}

const PRE_GAME_PRIME: ModeConfig = {
  mode: "pre_game",
  label: "Pre-Game Prime",
  sections: [
    {
      label: "Command Check",
      title: "Where Are You Starting From?",
      prompts: [
        {
          id: "amygdala_scan",
          type: "slider",
          label: "Right now, on a gut level, rate your current mental state:",
          sublabel: "Don't think. First answer.",
          min: 1,
          max: 10,
          minLabel: "Fully amygdala — reactive, anxious, in my head",
          maxLabel: "Fully executive — clear, present, self-governed",
        },
        {
          id: "state_identifier",
          type: "multi_select",
          label: "What's the loudest thing in your head right now?",
          sublabel: "Check all that apply",
          options: [
            { value: "worried_outcome", label: "Worried about a specific outcome" },
            { value: "replaying_past", label: "Replaying a past performance" },
            { value: "others_expect", label: "Thinking about what others expect" },
            { value: "external_pressure", label: "Feeling pressure from external source" },
            { value: "comparison", label: "Comparison to someone else" },
            { value: "clear_focused", label: "Genuinely clear and focused" },
          ],
          hasOther: true,
        },
      ],
    },
    {
      label: "Value Alignment Activation",
      title: "What Are You Actually Playing For?",
      prompts: [
        {
          id: "highest_value_anchor",
          type: "long_text",
          label: 'Complete this sentence without overthinking it:\n\n"At my core, the reason I play baseball is..."',
          placeholder: "Write your authentic answer...",
        },
        {
          id: "todays_intention",
          type: "text",
          label: "Given your answer above, what is ONE thing you can do today in your at-bats that would be a direct expression of that?\n\nNot a stat. Not a result. A way of showing up.",
          placeholder: "One specific way of showing up today...",
        },
        {
          id: "voice_sorting",
          type: "text",
          label: "Is there a voice in your head today that sounds like it belongs to someone else — a coach, a parent, a scout, a social media post?\n\nWhat is it saying?",
          placeholder: "What is the voice saying...",
          optional: true,
        },
        {
          id: "voice_sorting_ownership",
          type: "toggle",
          label: "Is that YOUR standard or someone else's standard you've borrowed?",
          options: [
            { value: "mine", label: "Mine" },
            { value: "borrowed", label: "Borrowed" },
            { value: "not_sure", label: "Not Sure" },
          ],
          optional: true,
          condition: (r) => !!r["voice_sorting"],
        },
      ],
    },
    {
      label: "Anxiety Decoder",
      title: "What's Your Intuition Trying to Tell You?",
      prompts: [
        {
          id: "fantasy_check",
          type: "text",
          label: "What is the BEST possible outcome you're secretly hoping for today?\n\nBe honest — no one sees this but you.",
          placeholder: "Your best-case fantasy...",
        },
        {
          id: "nightmare_id",
          type: "text",
          label: "What is the WORST thing you're afraid might happen?",
          placeholder: "Your worst fear for today...",
        },
        {
          id: "equilibration",
          type: "long_text",
          label: "Your intuition generates anxiety to balance out the fantasy above. It's not your enemy — it's information.\n\nWhat would actually be USEFUL about the \"worst case\" you wrote above? What would you learn? What would it prove you could handle?",
          sublabel: "If you can find genuine benefit in the downside, your nervous system can release the anxiety and move into strategic mode.",
          placeholder: "Find the genuine benefit...",
        },
      ],
    },
    {
      label: "Neural Prime",
      title: "Activate Your Signal",
      prompts: [
        {
          id: "best_previous_rep",
          type: "long_text",
          label: "Close your eyes. Bring up the single best at-bat, pitch, or play you have EVER had. Not recently — your all-time best execution.\n\nDescribe it in detail. What did it feel like physically? What were you NOT thinking about?",
          placeholder: "Describe your best execution in detail...",
        },
        {
          id: "process_intention",
          type: "text",
          label: 'Today, the only thing you control is your PROCESS.\n\nWrite your process intention for this game in one sentence:\n\n"Today I commit to ________________________________"',
          placeholder: "Today I commit to...",
        },
        {
          id: "signal_quality_target",
          type: "slider",
          label: "On a scale of 1-10, what SIGNAL QUALITY are you going to bring to your nervous system today?",
          sublabel: "Signal quality = how clear, present, and committed each rep is. Low signal = distracted, managing, half-present. High signal = fully committed, decisive, locked in.",
          min: 1,
          max: 10,
          minLabel: "Low — distracted, managing",
          maxLabel: "High — fully committed, locked in",
        },
      ],
    },
  ],
};

const POST_GAME_DOWNLOAD: ModeConfig = {
  mode: "post_game",
  label: "Post-Game Download",
  sections: [
    {
      label: "Raw Download",
      title: "What Happened — Unfiltered",
      prompts: [
        {
          id: "first_read",
          type: "long_text",
          label: "In your own words, describe today's performance.\nDon't filter. Don't explain. Just download.",
          placeholder: "Download your performance...",
        },
        {
          id: "emotional_tag",
          type: "single_select",
          label: "The DOMINANT emotion I'm carrying right now is:",
          options: [
            { value: "pride", label: "Pride / elation" },
            { value: "relief", label: "Relief" },
            { value: "frustration", label: "Frustration" },
            { value: "embarrassment", label: "Embarrassment" },
            { value: "anger", label: "Anger" },
            { value: "numbness", label: "Numbness / flat" },
            { value: "satisfaction", label: "Genuine satisfaction" },
            { value: "confused", label: "Confused" },
            { value: "grateful", label: "Grateful" },
          ],
        },
      ],
    },
    {
      label: "Amygdala / Executive Sort",
      title: "Where Were You Making Decisions From?",
      prompts: [
        {
          id: "executive_percent",
          type: "dual_slider",
          label: "In your honest assessment, what percentage of your at-bats were you operating from your executive center vs. your amygdala?",
          label1: "Executive (clear, present, process-focused)",
          label2: "Amygdala (reactive, managing, outcome-focused)",
        },
        {
          id: "trigger_moment",
          type: "text",
          label: "Was there a specific moment when you felt yourself shift OUT of executive mode?\n\nWhat happened right before it?",
          placeholder: "Describe the trigger moment or 'No clear shift'...",
        },
        {
          id: "recovery_yn",
          type: "toggle",
          label: "When you got triggered or fell into reactive mode... Did you recover during the game?",
          options: [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
            { value: "partially", label: "Partially" },
          ],
          optional: true,
        },
        {
          id: "recovery_how",
          type: "text",
          label: "What brought you back? (or what did you keep doing instead of resetting?)",
          placeholder: "How did you recover or what kept you stuck...",
          optional: true,
          condition: (r) => !!r["recovery_yn"],
        },
      ],
    },
    {
      label: "Perception Equilibration",
      title: "Seeing the Whole Picture",
      description: "These questions are designed to bring the 'missing information' back into your awareness.",
      prompts: [
        {
          id: "downside_activation",
          type: "long_text",
          label: "What went LESS well than your highlight reel version of today? Be specific. What were the cracks?",
          sublabel: "Your amygdala wants to lock onto one side and filter out the rest. Let's see the whole picture.",
          placeholder: "Be honest about what didn't go well...",
          condition: (r) => ["pride", "relief", "satisfaction", "grateful"].includes(r["emotional_tag"]),
        },
        {
          id: "gratitude_audit",
          type: "text",
          label: "Who or what made today's performance possible that you might not be giving credit to?",
          sublabel: "Teammates, conditions, preparation, luck, a coach's adjustment...",
          placeholder: "Who helped make today possible...",
          optional: true,
          condition: (r) => ["pride", "relief", "satisfaction", "grateful"].includes(r["emotional_tag"]),
        },
        {
          id: "upside_activation",
          type: "long_text",
          label: "What did you learn today that you genuinely could not have learned from a good performance?",
          sublabel: "Your amygdala is currently making this performance mean something it may not actually mean. Let's find the other side.",
          placeholder: "What did this teach you...",
          condition: (r) => ["frustration", "embarrassment", "anger", "numbness", "confused"].includes(r["emotional_tag"]),
        },
        {
          id: "hidden_order",
          type: "long_text",
          label: "If this exact performance had to happen to build something important in you — what would that be?\n\nDon't force it. If you genuinely can't find it, write that. The question is more important than a neat answer.",
          placeholder: "What is this building in you...",
          optional: true,
          condition: (r) => ["frustration", "embarrassment", "anger", "numbness", "confused"].includes(r["emotional_tag"]),
        },
        {
          id: "void_reflection",
          type: "long_text",
          label: 'What is the DEEPER thing this performance is making you feel threatened about? Not the stats — the identity underneath the stats.\n\n"I\'m afraid this proves that I am ___________________"',
          placeholder: "Name the deeper fear...",
          optional: true,
          condition: (r) => ["frustration", "embarrassment", "anger", "numbness", "confused"].includes(r["emotional_tag"]),
        },
        {
          id: "void_reality_check",
          type: "text",
          label: "Is that actually what it proves? Or is your amygdala pattern-matching to an old story?",
          placeholder: "Check the reality...",
          optional: true,
          condition: (r) => !!r["void_reflection"],
        },
      ],
    },
    {
      label: "Myelination Signal Review",
      title: "What Got Stronger Today?",
      prompts: [
        {
          id: "high_signal_moments",
          type: "multi_text",
          label: "Identify 2-3 moments today where your process was CLEAN — fully committed, clear decision, complete execution regardless of result.\n\nThese are your myelination events. Name them.",
          count: 3,
        },
        {
          id: "circuit_identification",
          type: "text",
          label: "Of the above, which one surprised you most? Which one showed you a circuit that's getting stronger?",
          placeholder: "Which circuit is getting stronger...",
        },
        {
          id: "signal_quality_post",
          type: "slider",
          label: "Overall signal quality today:",
          sublabel: "Rate the QUALITY of your neural signal — not the results. A 10-signal day can produce poor stats. A 1-signal day can produce accidental success. Rate the process.",
          min: 1,
          max: 10,
          minLabel: "Low signal quality",
          maxLabel: "High signal quality",
        },
      ],
    },
    {
      label: "Tomorrow's Prime",
      title: "What Does Tomorrow Need?",
      prompts: [
        {
          id: "tomorrow_need",
          type: "text",
          label: "Based on everything in this session, the ONE thing I need to bring differently tomorrow is:",
          placeholder: "One thing for tomorrow...",
        },
        {
          id: "nightly_replay",
          type: "text",
          label: "Tonight, before sleep, I will spend 2 minutes replaying my HIGH-SIGNAL moments from today.\n\nThe moments I will replay are:",
          placeholder: "Moments to replay tonight...",
          defaultFrom: "high_signal_moments",
          optional: true,
        },
      ],
    },
  ],
};

const SLUMP_PROTOCOL: ModeConfig = {
  mode: "slump_protocol",
  label: "Slump Protocol",
  sections: [
    {
      label: "Biological Reset Audit",
      title: "Checking Your Biology",
      description: "A slump is not a character problem. It is a signal problem — the circuitry is noisy, the perception is distorted, and the biology is running on too much cortisol. This protocol addresses all three. Take your time. There are no right answers — only honest ones.",
      prompts: [
        {
          id: "sleep_quality",
          type: "slider",
          label: "In the past 2 weeks, rate your sleep quality:",
          min: 1,
          max: 10,
          minLabel: "Terrible — restless, anxious",
          maxLabel: "Excellent — deep, restorative",
        },
        {
          id: "sleep_hours",
          type: "number",
          label: "Average hours per night:",
          placeholder: "e.g. 7",
        },
        {
          id: "sleep_notes",
          type: "text",
          label: "Notes on sleep quality (late nights, anxiety, waking up, etc.):",
          placeholder: "Anything affecting your sleep...",
          optional: true,
        },
        {
          id: "cortisol_load",
          type: "multi_select",
          label: "Check every box that has been TRUE in the past 2 weeks:",
          options: [
            { value: "night_waking", label: "Waking up in the middle of the night thinking about baseball" },
            { value: "replaying", label: "Replaying at-bats or pitches involuntarily" },
            { value: "tight_body", label: "Feeling physically tight or contracted before games" },
            { value: "cant_switch_off", label: "Difficulty \"switching off\" after poor performances" },
            { value: "eating_poorly", label: "Eating poorly or inconsistently" },
            { value: "avoiding_practice", label: "Avoiding practice or dreading it" },
            { value: "comparing", label: "Comparing your performance to teammates obsessively" },
            { value: "checking_stats", label: "Checking stats or social media more than usual" },
            { value: "every_game_test", label: "Feeling like every game is a test of who you are" },
          ],
        },
      ],
    },
    {
      label: "Identity Audit",
      title: "What Does This Slump Mean to You?",
      description: "These questions examine the value injections and identity distortions driving the slump.",
      prompts: [
        {
          id: "slump_meaning",
          type: "text",
          label: 'Complete this sentence as quickly as possible:\n\n"This slump means I am ___________________________"',
          sublabel: "First instinct only",
          placeholder: "This slump means I am...",
        },
        {
          id: "voice_trace",
          type: "long_text",
          label: "That belief you just wrote — whose voice does it sound like?\n\nWhen is the first time someone made you feel that way?",
          placeholder: "Trace the voice...",
        },
        {
          id: "injected_standard",
          type: "text",
          label: "What standard are you currently measuring yourself against?",
          placeholder: "The standard you're using...",
        },
        {
          id: "standard_source",
          type: "single_select",
          label: "Whose standard is that originally?",
          options: [
            { value: "mine", label: "Genuinely mine — I developed it from my own values" },
            { value: "coach", label: "A coach or mentor I admire" },
            { value: "player", label: "A player I compare myself to" },
            { value: "family", label: "A parent or family member" },
            { value: "social", label: "Social media / cultural expectation" },
            { value: "past_self", label: "A previous version of myself" },
            { value: "not_sure", label: "Not sure" },
          ],
        },
        {
          id: "authentic_standard",
          type: "long_text",
          label: "If you stripped away every external opinion, expectation, and comparison — what would YOUR standard for yourself actually be?\n\nNot what you think it should be. What feels deeply and authentically TRUE.",
          placeholder: "Your authentic standard...",
        },
      ],
    },
    {
      label: "Equilibration Sequence",
      title: "Finding the Hidden Order in the Slump",
      description: "These questions are designed to bring the 'missing information' back into your awareness. The slump looks like pure negative from inside the amygdala. These prompts will activate the other side — not to feel better artificially, but to see accurately.",
      prompts: [
        {
          id: "max_benefits",
          type: "multi_text",
          label: "List every GENUINE benefit this slump has produced or could produce.\n\nNo silver-lining spin. Only things you actually believe.",
          sublabel: "Keep going until you feel something shift.",
          count: 5,
        },
        {
          id: "who_benefited",
          type: "long_text",
          label: "Who specifically has benefited from you going through this slump?\n\nYour teammates who got more ABs? A coach learning something? Younger players watching how you handle adversity? Your own future self who will need this experience?",
          placeholder: "Who has benefited...",
        },
        {
          id: "equal_opposite",
          type: "text",
          label: "The area of my life or game that has actually been SOLID during this slump (that I haven't given credit to) is:",
          placeholder: "What's been solid...",
        },
        {
          id: "gratitude_test",
          type: "single_select",
          label: "Read back everything you've written in this section.\n\nCan you find a single moment of genuine gratitude for what this slump has given you — not fake positivity, but real recognition of a hidden benefit?",
          options: [
            { value: "yes", label: "Yes — I can feel something real" },
            { value: "partially", label: "Partially — starting to see it" },
            { value: "not_yet", label: "Not yet — still too close to it" },
          ],
        },
        {
          id: "gratitude_recognition",
          type: "text",
          label: "What is that recognition?",
          placeholder: "Name what you're grateful for...",
          optional: true,
          condition: (r) => r["gratitude_test"] === "yes" || r["gratitude_test"] === "partially",
        },
      ],
    },
    {
      label: "Neural Repair Protocol",
      title: "Rebuilding the Signal",
      prompts: [
        {
          id: "lost_circuit",
          type: "text",
          label: "Name one mechanical or mental skill that was automatic BEFORE this slump — something you didn't have to think about.",
          sublabel: "This is the circuit we're going to target for remyelination.",
          placeholder: "The skill that was automatic...",
        },
        {
          id: "contamination",
          type: "long_text",
          label: "What HAS changed about how you execute this skill?\n\nNot the result — the PROCESS. What are you doing differently or thinking about that you weren't before?",
          sublabel: "This is where the signal degradation lives.",
          placeholder: "What changed in the process...",
        },
        {
          id: "simplicity_target",
          type: "text",
          label: "What is the SIMPLEST, most reduced version of this skill you could practice — in a LOW-PRESSURE environment — to begin re-grooving the clean signal?\n\nNot a complex drill. The most BASIC version of the right pattern.",
          placeholder: "The simplest version of the skill...",
        },
        {
          id: "myelin_env_location",
          type: "text",
          label: "Design one practice session this week that creates a low-cortisol, high-focus environment.\n\nLocation:",
          placeholder: "Where...",
        },
        {
          id: "myelin_env_who",
          type: "text",
          label: "Who's there (or not there):",
          placeholder: "Who...",
        },
        {
          id: "myelin_env_duration",
          type: "text",
          label: "Duration:",
          placeholder: "How long...",
        },
        {
          id: "myelin_env_focus",
          type: "text",
          label: "The one thing I'm focused on:",
          placeholder: "Single focus...",
        },
        {
          id: "myelin_env_signal",
          type: "text",
          label: "How I'll know the signal was clean:",
          placeholder: "Clean signal indicator...",
        },
      ],
    },
    {
      label: "Commitment",
      title: "The Other Side",
      prompts: [
        {
          id: "other_side",
          type: "long_text",
          label: "On the other side of this slump is a player who knows something that he didn't know before it started.\n\nWhat will that player know?",
          placeholder: "What you'll know on the other side...",
        },
        {
          id: "commitment_action",
          type: "text",
          label: "The single most important action I'm committing to in the next 48 hours is:",
          placeholder: "Your 48-hour commitment...",
        },
      ],
    },
  ],
};

const VALUE_AUDIT: ModeConfig = {
  mode: "value_audit",
  label: "Value Audit",
  sections: [
    {
      label: "Life Demonstration Inventory",
      title: "Where Did Your Time Actually Go?",
      description: "Don't think about what you WANT your values to be. Look at what your life DEMONSTRATES your values actually are.",
      prompts: [
        {
          id: "time_baseball",
          type: "number",
          label: "Baseball-related extra work (hours this week):",
          placeholder: "Hours...",
        },
        {
          id: "time_social",
          type: "number",
          label: "Social / relationship (hours this week):",
          placeholder: "Hours...",
        },
        {
          id: "time_recovery",
          type: "number",
          label: "Recovery / sleep / health (hours this week):",
          placeholder: "Hours...",
        },
        {
          id: "time_entertainment",
          type: "number",
          label: "Entertainment / phone / media (hours this week):",
          placeholder: "Hours...",
        },
        {
          id: "time_mental",
          type: "number",
          label: "Mental training / journaling (hours this week):",
          placeholder: "Hours...",
        },
        {
          id: "time_other",
          type: "text",
          label: "Other (describe + hours):",
          placeholder: "e.g. Music 3 hours...",
          optional: true,
        },
        {
          id: "gap_analysis",
          type: "long_text",
          label: "Compare your time distribution above to what you say your priorities are.\n\nWhere is the BIGGEST gap between what you say matters and where your time actually went?",
          placeholder: "The biggest gap...",
        },
        {
          id: "gap_meaning",
          type: "text",
          label: "What does that gap tell you — honestly?",
          placeholder: "What it means...",
        },
      ],
    },
    {
      label: "Authentic Value Discovery",
      title: "What Do Your Actions Say?",
      prompts: [
        {
          id: "observer_conclusion",
          type: "text",
          label: "If someone watched everything you did this past week without hearing a single word you said —\n\nWhat would they conclude you value most?",
          placeholder: "What they'd conclude...",
        },
        {
          id: "energy_moment",
          type: "long_text",
          label: "In the past week, when did you feel the most ALIVE and energized?\n\nDescribe the moment and what you were doing.",
          placeholder: "Your most alive moment...",
        },
        {
          id: "energy_why",
          type: "text",
          label: "What specifically about that moment lit you up?",
          sublabel: "This is a signal pointing directly at your highest value.",
          placeholder: "What lit you up...",
        },
        {
          id: "spontaneous_actions",
          type: "long_text",
          label: "What actions this week required NO external motivation?\nYou just... did them. No one had to tell you. You wanted to.",
          placeholder: "Actions you chose without prompting...",
        },
        {
          id: "forced_actions",
          type: "long_text",
          label: "What actions this week required the MOST willpower or external pressure?",
          sublabel: "The first list is your hierarchy. The second is where you're living below it.",
          placeholder: "Actions that needed willpower...",
        },
      ],
    },
    {
      label: "Void-to-Value Mapping",
      title: "What Triggers You — and Why",
      description: "Demartini's core mechanics: The players who trigger you the most are showing you something you haven't fully owned about yourself.",
      prompts: [
        {
          id: "judge_others",
          type: "long_text",
          label: "What do you JUDGE most in other baseball players?\n\nThe things that annoy you, that you consider weaknesses or flaws.\n\nBe honest. No one sees this.",
          placeholder: "What you judge...",
        },
        {
          id: "mirror_own",
          type: "long_text",
          label: "Take one thing from your list above. Where do YOU do that same thing?\n\nNot identically — but in essence, in some context or form.",
          sublabel: "This is not about shame. It's about completeness. Every trait you see is inside you. Owning the full spectrum is what gives you stability no external performance can shake.",
          placeholder: "Where you do the same thing...",
        },
        {
          id: "void_identification",
          type: "long_text",
          label: "What is the EMPTINESS underneath your drive in baseball?\n\nWhat is the thing you're most trying to PROVE, ESCAPE, or FILL through this sport?",
          placeholder: "Name the void...",
        },
        {
          id: "void_awareness",
          type: "single_select",
          label: "Is this void conscious (you know about it) or did you just discover it by answering this question?",
          options: [
            { value: "known", label: "I've known this for a while" },
            { value: "sensed", label: "I've sensed it but never named it directly" },
            { value: "new", label: "This is new — I just found it now" },
          ],
        },
      ],
    },
    {
      label: "Hierarchy Calibration",
      title: "Ranking Your Values",
      description: "Based on everything in this session, rank these areas as your life CURRENTLY DEMONSTRATES (not how you wish they ranked).",
      prompts: [
        {
          id: "current_ranking",
          type: "multi_text",
          label: "Rank these 7 areas from 1 (highest demonstrated) to 7 (lowest demonstrated) by typing them in order:\n\n- Mental/Intellectual performance\n- Physical body and health\n- Baseball/Vocational excellence\n- Financial awareness\n- Family relationships\n- Social relationships & community\n- Spiritual/Purpose/Meaning",
          sublabel: "Type each area in your current order, highest first.",
          count: 7,
        },
        {
          id: "desired_ranking",
          type: "multi_text",
          label: "Now rank them as they SHOULD be ranked for where you want your life to go in the next 3 years:",
          count: 7,
        },
        {
          id: "alignment_score",
          type: "slider",
          label: "How aligned are those two rankings?",
          min: 1,
          max: 10,
          minLabel: "Completely misaligned — living a different life than I want",
          maxLabel: "Nearly identical — living in alignment with what matters",
        },
        {
          id: "alignment_shift",
          type: "text",
          label: "What is ONE specific shift that would close the biggest gap?",
          placeholder: "One shift to close the gap...",
        },
      ],
    },
    {
      label: "High-Priority Design",
      title: "Architecting Your Week",
      prompts: [
        {
          id: "high_priority_actions",
          type: "multi_text",
          label: "Name the 3 HIGHEST PRIORITY actions you could take this week that are direct expressions of your authentic highest value in baseball:",
          count: 3,
        },
        {
          id: "low_priority_steal",
          type: "text",
          label: "What LOWER-PRIORITY activities are currently taking the time those three things should occupy?",
          placeholder: "What's stealing your time...",
        },
        {
          id: "eliminate_compress",
          type: "text",
          label: "One thing I can delegate, eliminate, or compress to make room:",
          placeholder: "What to remove or compress...",
        },
      ],
    },
  ],
};

const NIGHTLY_MYELINATION: ModeConfig = {
  mode: "nightly_myelination",
  label: "Nightly Myelination",
  sections: [
    {
      label: "Signal Review",
      title: "What Gets Consolidated Tonight",
      description: "Myelin is built during sleep. What you review right before sleep is what your brain consolidates first. These questions prime your nervous system to write the right circuits into your biology tonight.",
      prompts: [
        {
          id: "cleanest_moment_1",
          type: "text",
          label: "Name the 1-2 moments from today where your process was CLEANEST.\n\nNot the best result — the clearest signal. The moment you felt most like yourself.\n\nMoment 1:",
          placeholder: "Your cleanest moment...",
        },
        {
          id: "cleanest_moment_2",
          type: "text",
          label: "Moment 2:",
          placeholder: "Second moment (if any)...",
          optional: true,
        },
        {
          id: "sensory_feel",
          type: "long_text",
          label: "For your best moment above:\n\nClose your eyes and replay it for 30 seconds before writing.\n\nWhat did it FEEL LIKE physically? (Not what happened — the sensation)",
          placeholder: "The physical sensation...",
        },
        {
          id: "sensory_not_thinking",
          type: "text",
          label: "What were you NOT thinking about in that moment?",
          placeholder: "What was absent from your mind...",
        },
      ],
    },
    {
      label: "Cognitive Offload",
      title: "Clear Your Mind for Sleep",
      prompts: [
        {
          id: "unresolved_thought",
          type: "long_text",
          label: "What unresolved thought about today's performance is most likely to keep you in light sleep?\n\nWrite it down completely. Get it out of your head and onto the screen.",
          placeholder: "Get it out of your head...",
        },
        {
          id: "unresolved_resolve",
          type: "single_select",
          label: "Does this need to be solved tonight, or can tomorrow handle it?",
          options: [
            { value: "tomorrow", label: "Tomorrow can handle it — I'm releasing it for the night" },
            { value: "tonight", label: "It needs a quick resolution" },
          ],
        },
        {
          id: "quick_resolution",
          type: "text",
          label: "Quick resolution:",
          placeholder: "Resolve it briefly...",
          optional: true,
          condition: (r) => r["unresolved_resolve"] === "tonight",
        },
      ],
    },
    {
      label: "Closing Calibration",
      title: "Set Tomorrow's Blueprint",
      prompts: [
        {
          id: "signal_quality_nightly",
          type: "slider",
          label: "Today's overall signal quality:",
          min: 1,
          max: 10,
          minLabel: "Low signal",
          maxLabel: "High signal",
        },
        {
          id: "one_word_process",
          type: "text",
          label: "One word that describes today's performance from a PROCESS perspective:",
          placeholder: "One word...",
        },
        {
          id: "tomorrow_anchor",
          type: "text",
          label: 'Before you sleep, set one clear intention for tomorrow.\nNot a goal. An orientation. A way of showing up.\n\n"Tomorrow I enter as someone who ___________________________"',
          placeholder: "Tomorrow I enter as someone who...",
        },
      ],
    },
  ],
};

const MODE_CONFIGS: Record<string, ModeConfig> = {
  pre_game: PRE_GAME_PRIME,
  post_game: POST_GAME_DOWNLOAD,
  slump_protocol: SLUMP_PROTOCOL,
  value_audit: VALUE_AUDIT,
  nightly_myelination: NIGHTLY_MYELINATION,
};

export function getModeConfig(mode: string): ModeConfig | undefined {
  return MODE_CONFIGS[mode];
}
