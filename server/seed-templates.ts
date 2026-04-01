import { db } from "./db";
import { templates } from "@shared/schema";

async function seedTemplates() {
  console.log("Seeding templates...");

  await db.delete(templates);
  console.log("Cleared existing templates");

  const metastoryConfig = JSON.stringify({
    steps: [
      {
        id: "step_1",
        stepNumber: 1,
        label: "Location/Situation",
        fields: [
          {
            id: "location",
            label: "Where are you?",
            type: "textarea",
            placeholder: "I am standing in the batter's box at Yankee Stadium. The dirt is freshly raked, the chalk lines are bright white, and I can feel the packed clay under my cleats...",
            helpText: "Describe the specific location and situation in vivid, present-tense detail. Include the environment, time of day, weather, and context of the moment. Write as if you are there right now.",
            minLength: 50,
            required: true
          }
        ]
      },
      {
        id: "step_2",
        stepNumber: 2,
        label: "Physical Sensations",
        fields: [
          {
            id: "physical_sensations",
            label: "What do you feel in your body?",
            type: "textarea",
            placeholder: "My hands grip the bat firmly but without tension. I feel the weight of the bat balanced perfectly. My legs are coiled with energy, knees slightly bent. My core is engaged and I feel grounded through my back foot...",
            helpText: "Describe every physical sensation you experience in this moment. Include muscle tension, temperature, weight distribution, breathing pattern, and any other bodily feelings. The more specific, the more powerful the metastory.",
            minLength: 50,
            required: true
          }
        ]
      },
      {
        id: "step_3",
        stepNumber: 3,
        label: "Visual Details",
        fields: [
          {
            id: "visual_details",
            label: "What do you see?",
            type: "textarea",
            placeholder: "I see the pitcher on the mound, his glove tucked close. The ball is bright white against the green grass. I can see the red seams as he begins his windup. The stadium lights create a clear, focused tunnel between me and the pitcher...",
            helpText: "Describe everything you see in rich visual detail. Include colors, lighting, distances, and the clarity of your vision. Focus on what stands out most vividly. Describe the ball, the field, the pitcher, and your peripheral vision.",
            minLength: 50,
            required: true
          }
        ]
      },
      {
        id: "step_4",
        stepNumber: 4,
        label: "Kinesthetic Feelings",
        fields: [
          {
            id: "kinesthetic_feelings",
            label: "What movement and balance do you feel?",
            type: "textarea",
            placeholder: "I feel my weight shift smoothly from back foot to front as I load. My hips begin to rotate with explosive power. My hands are whipping through the zone on a perfect plane. The bat connects and I feel the sweet vibration of solid contact...",
            helpText: "Describe the feeling of movement in your body. Include weight shifts, rotational forces, the feeling of acceleration, and the moment of contact. This is about the internal experience of motion, not what it looks like from outside.",
            minLength: 50,
            required: true
          }
        ]
      },
      {
        id: "step_5",
        stepNumber: 5,
        label: "Auditory Elements",
        fields: [
          {
            id: "auditory_elements",
            label: "What do you hear?",
            type: "textarea",
            placeholder: "I hear the crack of the bat - that perfect, clean sound that tells me the ball was hit on the barrel. The crowd roars. I hear my own steady breathing. My teammates are shouting from the dugout...",
            helpText: "Describe every sound in this moment. Include the sound of the bat, the crowd, your own breathing, your heartbeat, the pitcher's grunt, the ball cutting through air. Both loud and subtle sounds make the experience vivid.",
            minLength: 30,
            required: true
          }
        ]
      },
      {
        id: "step_6",
        stepNumber: 6,
        label: "Emotional Response",
        fields: [
          {
            id: "emotional_response",
            label: "What emotions are you experiencing?",
            type: "textarea",
            placeholder: "I feel absolute certainty and calm confidence. There is no doubt, no anxiety. I feel powerful and in complete control. A deep sense of belonging - this is exactly where I am supposed to be, doing exactly what I was built to do...",
            helpText: "Describe the emotional landscape of this moment. Include feelings of confidence, certainty, joy, power, calm, or any other emotions present. Be honest about the intensity - this should reflect your ideal emotional state during peak performance.",
            minLength: 40,
            required: true
          }
        ]
      },
      {
        id: "step_7",
        stepNumber: 7,
        label: "Cognitive Insight",
        fields: [
          {
            id: "cognitive_insight",
            label: "What do you know to be true in this moment?",
            type: "textarea",
            placeholder: "I know with absolute certainty that I can hit any pitch this pitcher throws. I know that my preparation has been thorough and my body is perfectly calibrated. I know that this is simply what I do - I am a hitter, and hitting is my natural expression...",
            helpText: "Describe the thoughts and beliefs active in this moment. These should be deeply held convictions, not hopes or wishes. What knowledge feels absolutely certain? What understanding about yourself and your ability is present?",
            minLength: 40,
            required: true
          }
        ]
      },
      {
        id: "step_8",
        stepNumber: 8,
        label: "Identity Statement",
        fields: [
          {
            id: "identity_statement",
            label: "Who are you in this moment?",
            type: "textarea",
            placeholder: "I am an elite hitter. I am the player who comes through in big moments. I am someone who trusts his body completely and lets his training express itself. I am a bio-computer operating at peak capacity...",
            helpText: "Write a powerful identity statement that captures who you are at your absolute best. This is not about what you do - it is about who you ARE. This statement should feel deeply true and create a physical response when you read it.",
            minLength: 30,
            required: true
          }
        ]
      }
    ],
    outputTemplate: "METASTORY: {{location}}\n\nPHYSICAL SENSATIONS: {{physical_sensations}}\n\nVISUAL DETAILS: {{visual_details}}\n\nKINESTHETIC FEELINGS: {{kinesthetic_feelings}}\n\nAUDITORY ELEMENTS: {{auditory_elements}}\n\nEMOTIONAL RESPONSE: {{emotional_response}}\n\nCOGNITIVE INSIGHT: {{cognitive_insight}}\n\nIDENTITY STATEMENT: {{identity_statement}}"
  });

  const epsiConfig = JSON.stringify({
    steps: [
      {
        id: "step_1",
        stepNumber: 1,
        label: "Moment Identification",
        fields: [
          {
            id: "moment_identification",
            label: "Identify your endpoint success moment",
            type: "textarea",
            placeholder: "The moment I want to capture is the split second after I've driven a ball into the gap in a crucial at-bat. It's the bottom of the 7th, tie game, runner on second, and I've just ripped a line drive into right-center...",
            helpText: "Describe the specific moment of peak success you want to program into your unconscious. This should be a single, crystal-clear moment - not a sequence of events. Choose the exact instant where success is undeniable.",
            minLength: 50,
            required: true
          }
        ]
      },
      {
        id: "step_2",
        stepNumber: 2,
        label: "Physical/Kinesthetic Layer",
        fields: [
          {
            id: "physical_layer",
            label: "What does your body feel in this moment?",
            type: "textarea",
            placeholder: "I feel the residual vibration of perfect contact still humming through my hands. My body is extended through the swing, perfectly balanced. My legs are driving powerfully. Every muscle feels coordinated and alive. There is zero tension - only flowing power...",
            helpText: "Layer in every physical and kinesthetic sensation. Include muscle tension, temperature, vibration, balance, breathing, heart rate, and the feeling of power or relaxation. Make this so vivid that reading it triggers physical sensations in your body.",
            minLength: 80,
            required: true
          }
        ]
      },
      {
        id: "step_3",
        stepNumber: 3,
        label: "Visual Layer",
        fields: [
          {
            id: "visual_layer",
            label: "What do you see in crystal clarity?",
            type: "textarea",
            placeholder: "I see the ball rocketing off the bat in a perfect line drive trajectory. The white of the ball against the green outfield grass. I see the outfielders turning and running back. The runner rounding third. My teammates rising from the dugout...",
            helpText: "Describe everything visible in this moment with photographic clarity. Include colors, lighting, distances, facial expressions, movement of others, and the trajectory of the ball. Your visual description should read like a high-definition slow-motion replay.",
            minLength: 80,
            required: true
          }
        ]
      },
      {
        id: "step_4",
        stepNumber: 4,
        label: "Auditory Layer",
        fields: [
          {
            id: "auditory_layer",
            label: "What sounds fill this moment?",
            type: "textarea",
            placeholder: "The CRACK of the bat is unmistakable - pure, clean barrel contact. The crowd erupts immediately. I hear my teammates shouting. The sound of my cleats on the dirt as I begin running. My own breathing, steady and controlled...",
            helpText: "Capture every sound in this moment. Include the bat sound, crowd reaction, teammate reactions, your own sounds (breathing, heartbeat), and ambient sounds. Layer them from loudest to most subtle.",
            minLength: 50,
            required: true
          }
        ]
      },
      {
        id: "step_5",
        stepNumber: 5,
        label: "Emotional Layer (10/10 Intensity)",
        fields: [
          {
            id: "emotional_layer",
            label: "What emotions surge through you at maximum intensity?",
            type: "textarea",
            placeholder: "PURE ELATION. Absolute certainty that I am exactly who I trained to be. Joy so intense it fills my entire body. Triumph - not over the opponent, but over every doubt that ever tried to limit me. I feel ALIVE, POWERFUL, UNSTOPPABLE...",
            helpText: "This is the most critical layer. Describe your emotional state at 10/10 intensity. Do not hold back. Use capital letters, exclamation points, whatever conveys the raw power of this emotional experience. The unconscious responds to emotional intensity above all else.",
            minLength: 80,
            required: true
          }
        ]
      },
      {
        id: "step_6",
        stepNumber: 6,
        label: "Cognitive/Meaning Layer",
        fields: [
          {
            id: "cognitive_layer",
            label: "What does this moment mean about who you are?",
            type: "textarea",
            placeholder: "This moment proves what I've always known deep down - I am an elite performer. All the training, all the preparation, all the daily reps have led to this. This is not luck. This is who I am at my core. I am someone who delivers when it matters most...",
            helpText: "Describe the deep meaning and significance of this moment. What does it prove about your identity? What beliefs does it confirm? This layer connects the experience to your deepest sense of self.",
            minLength: 60,
            required: true
          }
        ]
      },
      {
        id: "step_7",
        stepNumber: 7,
        label: "Key Elements Integration",
        fields: [
          {
            id: "key_elements",
            label: "Identify 3-5 key sensory anchors from your EPSI",
            type: "textarea",
            placeholder: "1. The vibration of perfect contact in my hands\n2. The CRACK sound of barrel meeting ball\n3. The surge of certainty in my chest\n4. The visual of the ball rocketing into the gap\n5. The feeling of unstoppable power in my legs",
            helpText: "Extract the most vivid and emotionally charged sensory details from the previous layers. These become your rapid-access anchors - the elements you can recall instantly to activate the full EPSI experience during performance.",
            minLength: 50,
            required: true
          }
        ]
      },
      {
        id: "step_8",
        stepNumber: 8,
        label: "Complete Narrative Synthesis",
        fields: [
          {
            id: "narrative_synthesis",
            label: "Write the complete EPSI as one flowing narrative",
            type: "textarea",
            placeholder: "I am standing in the box, bottom of the 7th, tie game. My body is coiled with controlled power. I see the pitcher begin his windup and everything slows down. The ball leaves his hand and I see it with absolute clarity - fastball, middle-in. My body moves with explosive precision, hips rotating, hands whipping through the zone. CRACK - the sound of perfect contact sends electricity through my hands. The ball rockets into the right-center gap on a perfect line. I KNOW before I even start running...",
            helpText: "Combine all layers into one seamless, present-tense narrative. This is your complete Endpoint Success Image - the multi-sensory experience your unconscious will use as its target. Write it as if you are living it RIGHT NOW. This should be at least 300 characters of vivid, emotionally intense narrative.",
            minLength: 300,
            required: true
          }
        ]
      }
    ],
    outputTemplate: "ENDPOINT SUCCESS IMAGE (EPSI)\n\nMOMENT: {{moment_identification}}\n\nPHYSICAL/KINESTHETIC: {{physical_layer}}\n\nVISUAL: {{visual_layer}}\n\nAUDITORY: {{auditory_layer}}\n\nEMOTIONAL (10/10): {{emotional_layer}}\n\nCOGNITIVE/MEANING: {{cognitive_layer}}\n\nKEY ANCHORS:\n{{key_elements}}\n\nCOMPLETE EPSI NARRATIVE:\n{{narrative_synthesis}}"
  });

  const saObjectiveConfig = JSON.stringify({
    steps: [
      {
        id: "step_1",
        stepNumber: 1,
        label: "Objective Statement",
        fields: [
          {
            id: "objective_statement",
            label: "What is your Super Achievement Objective?",
            type: "textarea",
            placeholder: "I will hit .400 over the next 30 games with at least 10 extra-base hits, demonstrating consistent elite-level contact and power in every at-bat...",
            helpText: "Write a clear, specific objective that feels slightly beyond what you believe is possible. A Super Achievement Objective should stretch your Unconscious Performance Limit (UPL). It must be stated in the positive (what you WILL do, not what you won't do).",
            minLength: 30,
            required: true
          },
          {
            id: "objective_positive_check",
            label: "Is this stated in the positive? (what you WILL achieve)",
            type: "select",
            placeholder: "",
            helpText: "The objective must describe what you want, not what you want to avoid. 'I will hit .400' is positive. 'I won't strike out' is negative.",
            required: true,
            options: ["Yes - stated in the positive", "No - needs revision"]
          }
        ]
      },
      {
        id: "step_2",
        stepNumber: 2,
        label: "Measurability Check",
        fields: [
          {
            id: "measurement_criteria",
            label: "How will you measure success?",
            type: "textarea",
            placeholder: "Batting average tracked per game (.400 target). Extra-base hits counted per game (minimum 10 over 30 games). Quality at-bat percentage (70%+ target). Exit velocity average on tracked swings...",
            helpText: "Define specific, quantifiable metrics for your objective. You must be able to look at your results and definitively say 'I achieved this' or 'I did not achieve this.' Include primary and secondary metrics.",
            minLength: 30,
            required: true
          },
          {
            id: "measurement_frequency",
            label: "How often will you measure?",
            type: "select",
            placeholder: "",
            helpText: "Choose how frequently you will track your progress toward this objective.",
            required: true,
            options: ["After every game", "Weekly", "Bi-weekly", "After every 5 games"]
          }
        ]
      },
      {
        id: "step_3",
        stepNumber: 3,
        label: "Timeline Definition",
        fields: [
          {
            id: "start_date",
            label: "Start date",
            type: "text",
            placeholder: "March 15, 2026",
            helpText: "When does this objective period begin?",
            minLength: 5,
            required: true
          },
          {
            id: "end_date",
            label: "End date",
            type: "text",
            placeholder: "April 25, 2026",
            helpText: "When does this objective period end? The timeline should be specific and realistic.",
            minLength: 5,
            required: true
          },
          {
            id: "timeline_reasoning",
            label: "Why this timeline?",
            type: "textarea",
            placeholder: "This 30-game window covers the first month of conference play. It's long enough to demonstrate consistency but short enough to maintain urgency and focus...",
            helpText: "Explain why you chose this specific timeline. A good timeline is long enough to demonstrate real change but short enough to maintain urgency.",
            minLength: 20,
            required: true
          }
        ]
      },
      {
        id: "step_4",
        stepNumber: 4,
        label: "120% Buffer Calculator",
        fields: [
          {
            id: "current_upl",
            label: "What is your current Unconscious Performance Limit?",
            type: "textarea",
            placeholder: "My current UPL is hitting around .300. When I approach .320 or higher, I notice myself unconsciously sabotaging - taking hittable pitches, swinging at bad pitches, losing focus at critical moments...",
            helpText: "Identify the performance level where you tend to plateau or self-sabotage. This is your current UPL - the ceiling your unconscious considers 'normal' for you.",
            minLength: 30,
            required: true
          },
          {
            id: "buffer_calculation",
            label: "What is 120% of your target? (The buffer objective)",
            type: "textarea",
            placeholder: "My target is .400. 120% of that intent means I set my INTERNAL target at .480. By aiming for .480 internally, my unconscious treats .400 as well within the achievable range rather than at the edge of my limit...",
            helpText: "Calculate 120% of your stated objective. This buffer ensures your unconscious doesn't hit the brakes as you approach your real target. Your internal target should be 20% beyond your stated objective.",
            minLength: 30,
            required: true
          }
        ]
      },
      {
        id: "step_5",
        stepNumber: 5,
        label: "UPL Identification",
        fields: [
          {
            id: "upl_evidence",
            label: "What evidence shows your current UPL?",
            type: "textarea",
            placeholder: "1. Last season I started hot (.380 through 15 games) then 'corrected' back to .290\n2. In big moments I feel myself tighten up and swing defensively\n3. When I'm hitting well, I catch myself thinking 'this can't last'\n4. My career average is .295 which feels like a ceiling...",
            helpText: "List specific evidence of your current UPL in action. Include times you've plateaued, self-sabotaged, or experienced the unconscious 'correction' that pulled you back to your comfort zone.",
            minLength: 50,
            required: true
          },
          {
            id: "upl_blockers",
            label: "What beliefs maintain this UPL?",
            type: "textarea",
            placeholder: "1. 'Hitting .400 is unrealistic at this level'\n2. 'Hot streaks always end'\n3. 'I'm a .300 hitter, that's who I am'\n4. 'If I set big goals and fail, it means I'm not good enough'",
            helpText: "Identify the specific beliefs, stories, or assumptions that keep your UPL in place. These are often disguised as 'realistic expectations' or 'common sense.'",
            minLength: 30,
            required: true
          }
        ]
      },
      {
        id: "step_6",
        stepNumber: 6,
        label: "Final Formatted Objective",
        fields: [
          {
            id: "final_objective",
            label: "Write your complete, formatted Super Achievement Objective",
            type: "textarea",
            placeholder: "SUPER ACHIEVEMENT OBJECTIVE:\nI will hit .400 over my next 30 conference games (March 15 - April 25, 2026) with at least 10 extra-base hits and a 70%+ quality at-bat rate.\n\nINTERNAL TARGET (120%): .480 batting average\nMEASUREMENT: Tracked after every game\nKEY METRICS: BA, XBH count, QAB%\nUPL BEING RAISED FROM: .300 to .400+",
            helpText: "Combine all elements into a single, complete Super Achievement Objective statement. This should include the objective, timeline, metrics, internal buffer target, and the UPL you are raising. This becomes the document you review daily.",
            minLength: 100,
            required: true
          }
        ]
      }
    ],
    outputTemplate: "SUPER ACHIEVEMENT OBJECTIVE\n\nOBJECTIVE: {{objective_statement}}\nPositive Statement: {{objective_positive_check}}\n\nMEASURABILITY:\n{{measurement_criteria}}\nFrequency: {{measurement_frequency}}\n\nTIMELINE: {{start_date}} to {{end_date}}\nReasoning: {{timeline_reasoning}}\n\n120% BUFFER:\nCurrent UPL: {{current_upl}}\nBuffer Calculation: {{buffer_calculation}}\n\nUPL ANALYSIS:\nEvidence: {{upl_evidence}}\nLimiting Beliefs: {{upl_blockers}}\n\nFINAL FORMATTED OBJECTIVE:\n{{final_objective}}"
  });

  const rnbrConfig = JSON.stringify({
    steps: [
      {
        id: "step_1",
        stepNumber: 1,
        label: "BBF Identification",
        fields: [
          {
            id: "bbf_description",
            label: "Describe the Blocker Body Feeling (BBF)",
            type: "textarea",
            placeholder: "When I step into the box with runners in scoring position, I feel a tight knot in my stomach, like a fist clenching. My shoulders rise toward my ears, my grip tightens, and I feel a buzzing anxiety in my chest...",
            helpText: "Describe the specific physical sensation that arises when you experience performance anxiety or blocking. Be as precise as possible about WHERE in your body you feel it and WHAT it feels like. This is the physical signature of unconscious resistance.",
            minLength: 50,
            required: true
          },
          {
            id: "bbf_intensity",
            label: "BBF Intensity (1-10)",
            type: "number",
            placeholder: "7",
            helpText: "Rate the intensity of this Blocker Body Feeling on a scale of 1 (barely noticeable) to 10 (overwhelming). Be honest - this helps track your progress.",
            required: true,
            options: []
          },
          {
            id: "bbf_trigger",
            label: "What situation triggers this BBF?",
            type: "textarea",
            placeholder: "Runners in scoring position, two outs, close game. Also when facing a dominant pitcher or when coaches/scouts are watching. Essentially any high-pressure at-bat where I feel the outcome 'matters'...",
            helpText: "Identify the specific situations, contexts, or conditions that trigger this Blocker Body Feeling. Be specific about the external circumstances and internal thoughts that precede it.",
            minLength: 30,
            required: true
          }
        ]
      },
      {
        id: "step_2",
        stepNumber: 2,
        label: "Time Machine Memory Recall",
        fields: [
          {
            id: "earliest_memory",
            label: "Travel back - when did you FIRST feel this sensation?",
            type: "textarea",
            placeholder: "I'm 9 years old, playing in the Little League championship. Bases loaded, two outs, and I step up to the plate. I see my dad in the stands leaning forward intensely. My coach says 'Just relax, buddy' but I can hear the tension in his voice. I feel that same stomach knot, that same shoulder tightness...",
            helpText: "Close your eyes, feel the BBF, and let your mind travel back to the earliest time you can remember feeling this EXACT same sensation. It may be a baseball memory or it may be from everyday life. Describe the scene in present tense, as if you are there now. Include who is there, what is happening, and what you are feeling.",
            minLength: 80,
            required: true
          },
          {
            id: "child_age",
            label: "How old were you in this memory?",
            type: "text",
            placeholder: "9 years old",
            helpText: "Specify your age in the earliest memory you recalled.",
            minLength: 1,
            required: true
          },
          {
            id: "child_belief",
            label: "What did your younger self conclude from this experience?",
            type: "textarea",
            placeholder: "I decided that when people are watching and expectations are high, I will fail. I concluded that pressure means danger. I believed that if I fail in a big moment, I will disappoint the people I love and they won't be proud of me...",
            helpText: "What belief or decision did your younger self form in response to this experience? Children make meaning from events, and those meanings become unconscious programs that run automatically. What was the 'lesson' your child-self learned?",
            minLength: 40,
            required: true
          }
        ]
      },
      {
        id: "step_3",
        stepNumber: 3,
        label: "Reframing Exercise",
        fields: [
          {
            id: "adult_perspective",
            label: "What does your adult self understand now that your child self didn't?",
            type: "textarea",
            placeholder: "I understand now that one at-bat doesn't define me. My dad's intensity was his excitement, not judgment. My coach's nervousness was about HIS anxiety, not a reflection of my ability. Failure in one moment doesn't mean I'm a failure as a person...",
            helpText: "Using your adult understanding, wisdom, and experience, reframe the original memory. What do you know now that your child self couldn't have known? What alternative explanations exist for what happened? How would you comfort and educate your younger self about this experience?",
            minLength: 60,
            required: true
          },
          {
            id: "new_belief",
            label: "What is the new, updated belief?",
            type: "textarea",
            placeholder: "Pressure moments are OPPORTUNITIES, not threats. The people watching WANT me to succeed. My value is not determined by any single outcome. I am safe regardless of what happens in this at-bat. Big moments are where I SHINE...",
            helpText: "Write the new belief that replaces the old one. This should be stated in the positive, feel emotionally true (not just intellectually), and directly counter the limiting belief identified earlier.",
            minLength: 30,
            required: true
          }
        ]
      },
      {
        id: "step_4",
        stepNumber: 4,
        label: "Amplification Counter",
        fields: [
          {
            id: "positive_evidence",
            label: "List 5+ times you SUCCEEDED under pressure",
            type: "textarea",
            placeholder: "1. Walk-off single in last year's regional tournament\n2. 3-for-4 game when college scouts were watching in September\n3. Clutch double in summer league championship\n4. Game-tying hit in the 9th inning against our rivals\n5. Going 2-for-3 in my first varsity start...",
            helpText: "Your unconscious has been selectively storing 'evidence' that supports the old belief. Counter this by listing every time you SUCCEEDED in the type of situation that usually triggers your BBF. The more examples, the stronger the reframe.",
            minLength: 80,
            required: true
          },
          {
            id: "success_feelings",
            label: "How did you FEEL during those successes?",
            type: "textarea",
            placeholder: "I felt calm, focused, almost quiet inside. The noise faded away. My body moved automatically. I felt confident and certain. Time slowed down. I was completely present...",
            helpText: "Describe the emotional and physical state you experienced during your pressure successes. This is evidence that you CAN perform under pressure - and it describes the state your unconscious needs to recreate.",
            minLength: 40,
            required: true
          }
        ]
      },
      {
        id: "step_5",
        stepNumber: 5,
        label: "Adult-to-Child Integration",
        fields: [
          {
            id: "message_to_child",
            label: "What would you say to your younger self?",
            type: "textarea",
            placeholder: "Hey buddy, I know that felt scary. I know you thought you had to be perfect for everyone. But listen - you're going to be okay. One at-bat doesn't define you. Those people in the stands love you no matter what. And here's the thing - you're actually going to become an amazing hitter. The pressure you feel? It's going to become your superpower...",
            helpText: "Write a compassionate, loving message from your current adult self to the child in the memory. Speak directly to them. Acknowledge their fear, validate their experience, and share what you know now. This is the integration moment where the old belief begins to dissolve.",
            minLength: 80,
            required: true
          },
          {
            id: "integration_feeling",
            label: "What do you feel in your body as you deliver this message?",
            type: "textarea",
            placeholder: "I feel warmth spreading through my chest. The stomach knot loosens. My shoulders drop. I feel compassion and tenderness. There might be tears. I feel the old tension releasing and being replaced by a sense of peace and safety...",
            helpText: "Notice and describe the physical sensations that arise as you connect with your younger self. This somatic shift is the key indicator that genuine reframing is occurring at the unconscious level.",
            minLength: 40,
            required: true
          }
        ]
      },
      {
        id: "step_6",
        stepNumber: 6,
        label: "Before/After Assessment",
        fields: [
          {
            id: "bbf_intensity_after",
            label: "BBF Intensity After RNBR (1-10)",
            type: "number",
            placeholder: "3",
            helpText: "Re-rate the intensity of the Blocker Body Feeling now. Think about the triggering situation and notice what you feel. Has the intensity changed? Most people experience a significant reduction (2-5 points) after a thorough RNBR process.",
            required: true,
            options: []
          },
          {
            id: "shifts_noticed",
            label: "What shifts do you notice?",
            type: "textarea",
            placeholder: "The knot in my stomach has loosened significantly. When I imagine the pressure situation now, I feel more curiosity than fear. My shoulders feel relaxed. I notice I can think about pressure at-bats without the same physical contraction...",
            helpText: "Describe any changes you notice in your body, emotions, or thoughts after completing this process. Include physical changes, emotional shifts, and any new perspectives or beliefs that feel natural.",
            minLength: 40,
            required: true
          },
          {
            id: "follow_up_plan",
            label: "What is your follow-up plan?",
            type: "textarea",
            placeholder: "I will revisit this RNBR worksheet in 3 days to check if the BBF has further reduced. If it's still above a 3, I will do another round going deeper into the memory. I will also notice when the BBF arises in real situations and practice applying the new belief in the moment...",
            helpText: "RNBR sometimes requires multiple passes to fully resolve a deep pattern. Plan your follow-up: when will you reassess? What will you do if the BBF remains elevated? How will you practice the new belief in real situations?",
            minLength: 30,
            required: true
          }
        ]
      }
    ],
    outputTemplate: "RNBR WORKSHEET\n\nBLOCKER BODY FEELING:\n{{bbf_description}}\nIntensity: {{bbf_intensity}}/10\nTrigger: {{bbf_trigger}}\n\nTIME MACHINE:\nEarliest Memory: {{earliest_memory}}\nAge: {{child_age}}\nChild's Conclusion: {{child_belief}}\n\nREFRAMING:\nAdult Perspective: {{adult_perspective}}\nNew Belief: {{new_belief}}\n\nAMPLIFICATION:\nSuccess Evidence: {{positive_evidence}}\nSuccess Feelings: {{success_feelings}}\n\nINTEGRATION:\nMessage to Child: {{message_to_child}}\nIntegration Feeling: {{integration_feeling}}\n\nASSESSMENT:\nBBF After: {{bbf_intensity_after}}/10\nShifts Noticed: {{shifts_noticed}}\nFollow-up Plan: {{follow_up_plan}}"
  });

  const successFailureLogConfig = JSON.stringify({
    steps: [
      {
        id: "step_1",
        stepNumber: 1,
        label: "Event Description",
        fields: [
          {
            id: "event_type",
            label: "Event Type",
            type: "select",
            placeholder: "",
            helpText: "Was this a success or a failure/setback? Be honest - both are equally valuable for programming your bio-computer.",
            required: true,
            options: ["Success", "Failure/Setback"]
          },
          {
            id: "event_description",
            label: "Describe what happened",
            type: "textarea",
            placeholder: "Bottom of the 5th, 1-2 count against a lefty throwing sliders. I recognized the spin out of his hand, stayed back, and drove a line drive into the left-center gap for an RBI double...",
            helpText: "Describe the specific event in detail. Include the situation (count, inning, game context), what you did, and the outcome. Write in past tense but include enough detail to re-experience the moment.",
            minLength: 40,
            required: true
          },
          {
            id: "event_context",
            label: "Game/Practice context",
            type: "text",
            placeholder: "Conference game vs. State University, March 22",
            helpText: "Provide the context: what game or practice, opponent, date.",
            minLength: 5,
            required: true
          }
        ]
      },
      {
        id: "step_2",
        stepNumber: 2,
        label: "Success Amplification OR Failure Reframe",
        fields: [
          {
            id: "success_amplification",
            label: "FOR SUCCESS: What did you do RIGHT? Amplify it.",
            type: "textarea",
            placeholder: "I recognized the slider spin early because I was soft-focused on the release point. My breathing was steady. I stayed back on my rear leg and let the ball travel deeper than usual. My hands were quick and I trusted my swing. I felt CALM and CERTAIN...",
            helpText: "If this was a success: describe in detail what you did right physically, mentally, and emotionally. What state were you in? What allowed this to happen? The more you amplify successes, the more your unconscious codes them as 'normal.' Leave blank if logging a failure.",
            minLength: 0,
            required: false
          },
          {
            id: "failure_reframe",
            label: "FOR FAILURE: What can you learn and reframe?",
            type: "textarea",
            placeholder: "I was thinking about mechanics ('keep my hands back') instead of seeing the ball. My left brain was dominant. The BBF was present (stomach knot, 6/10). REFRAME: This at-bat showed me I need to activate my IAP before stepping in when I notice the BBF...",
            helpText: "If this was a failure: identify the system that was creating interference (left brain chatter, midbrain activation, conflicting programming). Then reframe: what did this teach you? What will you do differently? Failures are diagnostic data, not character flaws. Leave blank if logging a success.",
            minLength: 0,
            required: false
          }
        ]
      },
      {
        id: "step_3",
        stepNumber: 3,
        label: "IAP Anchor",
        fields: [
          {
            id: "iap_connection",
            label: "Connect this to your Inner Anchor Point",
            type: "textarea",
            placeholder: "FOR SUCCESS: As I recall this moment, I activate my IAP - I feel the warmth in my chest, the grounded weight in my legs, the quiet certainty. This success IS my IAP in action.\n\nFOR FAILURE: I notice the BBF and consciously activate my IAP to reset. I feel the shift from tension to calm, from doubt to certainty...",
            helpText: "Whether this was a success or failure, connect it to your Inner Anchor Point. For successes: recognize that your IAP was active during this moment and strengthen the connection. For failures: practice activating your IAP now as you reflect, building the habit of using it as a reset.",
            minLength: 30,
            required: true
          }
        ]
      },
      {
        id: "step_4",
        stepNumber: 4,
        label: "Reflection",
        fields: [
          {
            id: "key_takeaway",
            label: "One key takeaway from this event",
            type: "textarea",
            placeholder: "When I trust my preparation and stay out of my own way, my body knows exactly what to do. The key is activating my IAP before the at-bat begins, not trying to fix things during the at-bat...",
            helpText: "Distill this event into a single, powerful insight. What is the most important thing this event taught you? This becomes part of your growing database of self-knowledge that accelerates your development.",
            minLength: 20,
            required: true
          },
          {
            id: "tomorrow_intention",
            label: "What will you do differently tomorrow?",
            type: "textarea",
            placeholder: "Tomorrow I will activate my IAP during my pre-game breathing routine. I will check in with my body before each at-bat and notice if the BBF is present. If it is, I will step out and reset before stepping back in...",
            helpText: "Based on this reflection, set one specific intention for your next game or practice. Make it actionable and concrete.",
            minLength: 20,
            required: true
          }
        ]
      }
    ],
    outputTemplate: "SUCCESS/FAILURE LOG\n\nEvent Type: {{event_type}}\nContext: {{event_context}}\n\nEVENT:\n{{event_description}}\n\nANALYSIS:\n{{success_amplification}}{{failure_reframe}}\n\nIAP CONNECTION:\n{{iap_connection}}\n\nREFLECTION:\nKey Takeaway: {{key_takeaway}}\nTomorrow's Intention: {{tomorrow_intention}}"
  });

  const templateData = [
    {
      templateType: "metastory",
      slug: "metastory",
      name: "Metastory Construction",
      description: "Create a vivid, multi-sensory metastory that programs your unconscious mind with a peak performance blueprint. A metastory is an edited memory - a real experience enhanced and amplified to serve as a precision target for your bio-computer.",
      moduleId: 3,
      instructions: "A Metastory is a carefully constructed narrative built from a real peak performance memory. You will edit and enhance this memory across 8 sensory and cognitive dimensions to create a vivid, present-tense experience that your unconscious can use as a performance target.\n\nIMPORTANT GUIDELINES:\n- Write everything in PRESENT TENSE (\"I am\" not \"I was\")\n- Use first person (\"I feel\" not \"You feel\")\n- Be as specific and vivid as possible - vague descriptions produce vague results\n- Draw from a REAL memory, then enhance it to represent your ideal state\n- Read your completed metastory aloud daily for 25 days to imprint it\n- If you feel physical sensations while writing, that means it's working\n\nThe unconscious mind responds to experiential coordinates, not abstract goals. Your metastory provides those coordinates.",
      exampleCompleted: "I am standing in the batter's box at Championship Field. The late afternoon sun casts long shadows across the diamond. The dirt is freshly raked and I can feel the firm, packed clay under my cleats. The chalk lines are bright white...\n\nMy hands wrap around the bat handle with firm but relaxed pressure. I feel the grain of the tape under my fingers. My weight is balanced, slightly loaded on my back leg. My core is engaged, coiled with potential energy...\n\nI see the pitcher clearly - every detail of his windup, the white of the ball against his dark glove. As he releases, the ball seems to slow down. I can see the four-seam rotation, the red seams spinning against the white leather...\n\nThe CRACK of perfect contact resonates through the bat into my hands. The crowd erupts. I hear my own steady breathing underneath it all...\n\nI feel absolute certainty. Calm power. This is exactly where I belong.\n\nI know that I am an elite hitter. This is what I do.",
      templateConfig: metastoryConfig,
      isPublished: true,
      version: 1,
    },
    {
      templateType: "epsi",
      slug: "epsi",
      name: "EPSI Creation",
      description: "Build your Endpoint Success Image - a multi-layered, emotionally intense mental blueprint of your peak success moment that programs your unconscious with a clear target destination.",
      moduleId: 4,
      instructions: "The Endpoint Success Image (EPSI) is the most powerful programming tool in the 6th Tool system. It creates a multi-sensory, emotionally intense experience of your desired outcome that your unconscious uses as a navigation target.\n\nKEY PRINCIPLES:\n- Your EPSI must capture a SINGLE MOMENT of peak success, not a sequence\n- Build the experience in layers: physical, visual, auditory, emotional, cognitive\n- The emotional layer MUST be at 10/10 intensity - do not hold back\n- The final narrative synthesis should flow as one continuous present-tense experience\n- Read/experience your EPSI daily during your 15-minute routine\n- Update your EPSI as your goals evolve\n\nThe unconscious speaks in experiences, not words. Your EPSI translates your goals into the language your unconscious actually processes.\n\nIMPORTANT: The emotional intensity is what makes the EPSI work. A calm, detached description will not program your unconscious. You need to FEEL it at maximum intensity.",
      exampleCompleted: "THE MOMENT: Split second after driving a ball into the gap, bottom of the 7th, tie game, runner on second.\n\nPHYSICAL: The vibration of perfect barrel contact still resonating through my hands. Body fully extended through the swing, balanced and powerful. Every muscle coordinated and alive.\n\nVISUAL: The ball rocketing off the bat in a perfect line drive. White against green. Outfielders turning and running. The runner rounding third.\n\nAUDITORY: CRACK of pure barrel contact. Crowd erupting. Teammates shouting. My own steady breathing.\n\nEMOTIONAL: ABSOLUTE ELATION. Certainty. Joy filling my entire body. UNSTOPPABLE.\n\nMEANING: This is who I AM. All the preparation led here. This is my natural expression.\n\nFULL NARRATIVE: I am in the box, bottom of the 7th, tie game...",
      templateConfig: epsiConfig,
      isPublished: true,
      version: 1,
    },
    {
      templateType: "sa_objective",
      slug: "sa-objective",
      name: "SA Objective",
      description: "Create a Super Achievement Objective that stretches beyond your current Unconscious Performance Limit (UPL). This structured process ensures your objective meets all 11 criteria for effective unconscious programming.",
      moduleId: 2,
      instructions: "A Super Achievement Objective is a precisely formatted goal that bypasses your Unconscious Performance Limit (UPL) - the invisible ceiling that keeps you performing at your 'normal' level.\n\nTHE 11 CRITERIA FOR SA OBJECTIVES:\n1. Stated in the positive (what you WILL do)\n2. Specific and measurable\n3. Has a defined timeline\n4. Slightly beyond what you believe possible\n5. Includes a 120% internal buffer\n6. Identifies the current UPL being raised\n7. Includes measurement frequency\n8. Addresses limiting beliefs\n9. Connected to your EPSI and Metastory\n10. Reviewed daily during practice routine\n11. Updated based on Success/Failure log data\n\nIMPORTANT: The 120% buffer is critical. If your objective is to hit .400, your INTERNAL target should be .480. This prevents your unconscious from hitting the brakes as you approach your stated goal.\n\nYour SA Objective should feel slightly uncomfortable - if it feels completely achievable, it's not stretching your UPL enough. If it feels completely impossible, scale it back slightly.",
      exampleCompleted: "SUPER ACHIEVEMENT OBJECTIVE:\nI will hit .400 over my next 30 conference games (March 15 - April 25, 2026) with at least 10 extra-base hits and a 70%+ quality at-bat rate.\n\nINTERNAL TARGET (120%): .480 batting average\nMEASUREMENT: Tracked after every game\nCURRENT UPL: .300 (evidence: career average plateau, hot-streak corrections)\nUPL BEING RAISED TO: .400+\nLIMITING BELIEFS ADDRESSED: 'Hot streaks always end,' 'I'm a .300 hitter'",
      templateConfig: saObjectiveConfig,
      isPublished: true,
      version: 1,
    },
    {
      templateType: "rnbr",
      slug: "rnbr",
      name: "RNBR Worksheet",
      description: "Root Normal Base Reframing - a guided process to identify, trace, and permanently resolve Blocker Body Feelings (BBFs) that create unconscious performance interference.",
      moduleId: 5,
      instructions: "The RNBR (Root Normal Base Reframing) protocol is designed to permanently resolve the unconscious patterns that create performance interference.\n\nEMOTIONAL SAFETY NOTICE:\nThis process involves accessing early memories that may carry emotional charge. This is normal and expected. If at any point you feel overwhelmed:\n- Take a break and do your breathing exercise\n- Ground yourself by feeling your feet on the floor\n- Remember: you are safe, you are an adult revisiting a memory, not reliving it\n- Consider working with a coach or therapist if deep trauma surfaces\n\nAUTO-SAVE IS CRITICAL:\nYour work is automatically saved as you go. This is important because:\n- Emotional processing can be tiring and you may need to take breaks\n- You can return and continue where you left off\n- The process may take multiple sessions to complete fully\n\nPROCESS OVERVIEW:\n1. Identify the BBF (physical sensation of blocking)\n2. Use the Time Machine to trace it to its earliest memory\n3. Reframe the memory with adult understanding\n4. Counter the old belief with success evidence\n5. Integrate by speaking to your younger self\n6. Assess the shift in BBF intensity\n\nMost BBFs require 1-3 rounds of RNBR to fully resolve. A reduction of 2-5 points per session is normal and expected.",
      exampleCompleted: "BBF: Tight knot in stomach, shoulders rising, grip tightening. Intensity: 7/10.\nTrigger: High-pressure at-bats with runners in scoring position.\n\nEARLIEST MEMORY: Age 9, Little League championship, bases loaded...\n\nCHILD'S CONCLUSION: 'When people watch and expect me to perform, I will fail.'\n\nADULT REFRAME: One at-bat doesn't define me. Dad's intensity was excitement, not judgment.\n\nNEW BELIEF: Pressure moments are OPPORTUNITIES where I SHINE.\n\nSUCCESS EVIDENCE: Walk-off single, 3-for-4 with scouts watching, clutch double in championship...\n\nMESSAGE TO CHILD: 'Hey buddy, you're going to be okay. You're actually going to become amazing...'\n\nBBF AFTER: 3/10. Significant reduction in stomach tension.",
      templateConfig: rnbrConfig,
      isPublished: true,
      version: 1,
    },
    {
      templateType: "success_failure_log",
      slug: "success-failure-log",
      name: "Success/Failure Log",
      description: "Log and process successes and failures immediately after games and practice. This daily feedback tool programs your unconscious by amplifying successes and reframing failures as diagnostic data.",
      moduleId: null,
      instructions: "The Success/Failure Log is your daily feedback mechanism - the tool that keeps your bio-computer calibrated and continuously improving.\n\nTIMING IS CRITICAL:\nLog your entries as soon as possible after the game or practice session. The closer to the event, the more vivid and accurate your recall will be. Ideally within 30 minutes.\n\nFOR SUCCESSES:\n- Describe what happened in detail\n- Identify what you did RIGHT (physically, mentally, emotionally)\n- Amplify the positive feelings - let yourself fully experience the success\n- Connect it to your IAP and EPSI\n- The more you amplify successes, the more your unconscious treats them as 'normal'\n\nFOR FAILURES/SETBACKS:\n- Describe what happened without judgment\n- Identify which brain system was creating interference\n- Diagnose the root cause (left brain chatter? midbrain activation? BBF?)\n- Reframe: what did this teach you? What system needs adjustment?\n- Failures are DIAGNOSTIC DATA, not evidence of inadequacy\n\nBOTH successes and failures should be connected to your IAP practice. This builds the habit of using your Inner Anchor Point as a performance reset tool.",
      exampleCompleted: "EVENT TYPE: Success\nCONTEXT: Conference game vs. State University, March 22\n\nEVENT: Bottom of the 5th, 1-2 count against a lefty throwing sliders. Recognized the spin, stayed back, drove a line drive into left-center for an RBI double.\n\nAMPLIFICATION: I was soft-focused on the release point. Breathing was steady. Stayed back on rear leg. Trusted my swing. Felt CALM and CERTAIN.\n\nIAP: This success IS my IAP in action. I feel the warmth, the grounded weight, the quiet certainty.\n\nTAKEAWAY: When I trust my preparation and stay out of my own way, my body knows what to do.\n\nTOMORROW: Activate IAP during pre-game breathing routine.",
      templateConfig: successFailureLogConfig,
      isPublished: true,
      version: 1,
    },
  ];

  await db.insert(templates).values(templateData);
  console.log("Inserted 5 templates");

  console.log("Templates seeded successfully");
}

export { seedTemplates };

if (require.main === module) {
  seedTemplates().then(() => process.exit(0)).catch((err) => {
    console.error("Error seeding templates:", err);
    process.exit(1);
  });
}
