// Question Database - Easy to edit and expand!
const QUESTIONS = [
    {
        everyone: "What do you sense about who I am, beyond what I've told you? Do you think this sense reflects something about me, or about you?"
    },
    {
        everyone: "What do you sense about what I am most afraid of, beyond what I've told you? Do you think this sense reflects something about me, or about you?"
    },
    {
        everyone: "What do you sense about what I am most proud of, beyond what I've told you? Do you think this sense reflects something about me, or about you?"
    },
    {
        everyone: "What do you sense about who I want to be seen as, beyond what I've told you? Do you think this sense reflects something about me, or about you?"
    },
    {
        everyone: "What do you sense about what I need, beyond what I've told you? Do you think this sense reflects something about me, or about you?"
    },
    {
        everyone: "What do you sense about who I am afraid to be seen as, beyond what I've told you? Do you think this sense reflects something about me, or about you?"
    },
    {
        you: "What's one way you see yourself reflected in someone else here?"
    },
    {
        you: "What do you think we are hoping for, from this experience?"
    },
    {
        you: "What's something you imagine everyone here understands about you, without having to explain it?"
    },
    {
        you: "Is there something you do or feel which alternates bewteen two extremes? Does each extreme protect you from anything?"
    },
    {
        you: "Describe a recent moment when you caught yourself acting automatically. What was driving that automaticity?"
    },
    {
        you: "What are you seeking from other people?"
    },
    {
        you: "Describe the part of you that feels like it's seeking something. What is it looking for?"
    },
    {
        you: "What makes you feel most seen? Is there anything scary about this?"
    },
    {
        you: "What do you do to feel special? Does it ever end up making you feel more isolated?"
    },
    {
        you: "What do you do to feel more safe or connected? Do any of these attempts backfire?"
    },
    {
        you: "Do you ever push away or reject the thing you believe you want most? What can you say about what is driving you to do this?"
    },
    {
        you: "What would you like people to understand about you? Is there anything you do to make this difficult for people?"
    },
    {
        you: "Get into a comfortable position, close your eyes, and let your mind wander.",
        partner: "Get into a comfortable position, watch your partner's face, and let your mind wander with theirs. Let them know when to come back. Discuss what caused you to bring them back, and where your minds wandered."
    },
    {
        everyone: "Describe my inner child."
    },
    {
        you: "Get into a comfortable position, close your eyes, and think of a strong memory without sharing it.",
        partner: "Copy your partner's posture and breathing rhythm. Pay attention to any sensations, images, memories, impulses, or meanings that come up for you. Share what you notice."
    },
    {
        you: "Find somewhere comfortable to stand, away from others.",
        partner: "Stand up and face your partner. Walk towards them slowly, and stop when you sense a personal boundary. Speak about what you noticed change within you or your partner when you reached the boundary. Figure out whose boundary it was."
    },
    {
        you: "Share an emotionally important memory.",
        partner: "Reflect back your understanding of the emotional significance of what your partner is sharing. Reflect back anything you are picking up beyond what they are sharing."
    },
    {
        you: "Take a few moments to drop into your body. What sensations are you noticing inside?"
    },
    {
        you: "What feels most alive or true for you right now?"
    },
    {
        you: "How do you want to be seen right now? Why is this important to you? What do you do to encourage people to see you in this way?"
    },
    {
        you: "How are you afraid of being seen right now? Why is this scary for you? What do you do to avoid being seen this way?"
    },
    {
        you: "Talk about one of the most mundane things that have happened to you this week.",
        partner: "Attempt to make this story meaningful or noteworthy by asking clarifying questions. Was the end result surprising in any way?"
    },
    {
        you: "What is something most people misunderstand about you?"
    },
    {
        you: "What validation or reassurance are you secretly hoping for?"
    },
    {
        you: "What emotion in yourself feels most difficult to feel or express? What experiences do you have around this emotion? What do you do to avoid it? What would you need to feel safe to feel or express it?"
    },
    {
        you: "What emotion in others feels most difficult for you to sit with, without trying to change it? What experiences do you have around this emotion? What do you do to change this emotion in others? How does this emotion feel threatening?"
    },
    {
        you: "What emotion in yourself feels most welcome to be felt or expressed? What experiences do you have around this emotion? What do you do to chase this emotion? What feels safe or enjoyable about this emotion?"
    },
    {
        you: "What emotion in others feels most welcome to be in the presence of? What experiences do you have around this emotion? What do you do to influence others to feel this emotion? What feels safe or enjoyable about being in the presence of this emotion?"
    },
    {
        you: "Speak about a time that someone who you trusted let you down. Did this change how you relate to people? What are the tradeoffs of this change?"
    },
    {
        you: "Speak about a time a relationship or friendship ended, from the perspective of the other person."
    },
    {
        you: "Think about your previous relationships or friendships. Are there any common themes? Are there any themes that are completely absent?"
    },
    {
        you: "What does it feel like to be misunderstood?"
    },
    {
        you: "Do you use any thoughts, emotions, or behaviours to avoid other emotions?"
    },
    {
        you: "Does anything feel scary about feeling deeply understood?"
    },
    {
        you: "What does it feel like to be deeply understood?"
    },
    {
        you: "Describe a recent experience, but don't say anything about how you felt.",
        partner: "Watch your partner's face. Pause them every time you sense a feeling arise, and check whether you are accurate."
    },
    {
        you: "Describe an experience using only the emotions it made you feel. Don't mention anything about what happened externally.",
        partner: "See whether you can figure out the details of what happened."
    },
    {
        you: "Describe an experience using only the sensory details. Don't mention anything about what happened externally.",
        partner: "See whether you can figure out the details of what happened."
    },
    {
        you: "Describe a situation which you found challenging, but do not share why you found it challenging.",
        partner: "Let your partner know whether there would be anything challenging about that situation for yourself, and what you imagine would have been challenging for them."
    },
    {
        you: "Describe an experience you shared with someone, from the point of view of the other person, without saying who it is.",
        partner: "Talk about what you sense about the relationship your partner has with this person."
    },
    {
        you: "Find the part of yourself which feels uncomfortable receiving compliments. What would it say if you gave it a voice?"
    },
    {
        you: "Find the part of yourself which feels uncomfortable receiving criticism. What would it say if you gave it a voice?"
    },
    {
        you: "Find the part of yourself which tells you to move away from connection or success. What is it afraid of?"
    },
    {
        you: "Talk about something emotional which has happened to you.",
        partner: "Ignore your partner's words. Pay attention to their face, their body, and your own body. Share with your partner what you noticed."
    },
    {
        you: "Talk about a common, everyday experience you've had recently.",
        partner: "Attempt to make this story unique by asking clarifying questions. Was the end result surprising in any way?"
    },
    {
        you: "Explain something you are an expert on, using simple language.",
        partner: "Make a suggestion, or ask a question, that will cause your partner to question where the edge of their knowledge is."
    },
    {
        you: "What behaviour in others makes you want to open up and connect?"
    },
    {
        you: "What behaviour in others makes you want to close off and withdraw?"
    },
    {
        you: "When have you either believed a situation was worse than it is, or acted to make a situation worse than it may have been, to avoid the uncertainty of now knowing?"
    },
    {
        you: "Tell your partner about a problem you would really like a solution to.",
        partner: "Respond in the most loving, curious, and reflective way you can, without suggesting a single solution."
    },
    {
        you: "Would you change anything about how you interact with people if you were completely safe, physically and emotionally?"
    },
    {
        you: "Speak about a time you went against your values out of fear.",
        partner: "Listen to your partner as if they were an innocent child. Let them know your honest thoughts and feelings about what they have said."
    },
    {
        you: "When has being vulnerable led to being hurt?"
    },
    {
        you: "When has being vulnerable led to feeling connected or seen?"
    },
    {
        you: "When have you regretted protecting yourself?"
    },
    {
        you: "When have you been glad you protected yourself?"
    },
    {
        you: "Face your partner and look into their eyes. Invite an emotion to arise, without speaking about it.",
        partner: "Face your partner and look into their eyes. Pay attention to your body. Let your partner know when you sense something."
    },
    {
        you: "Face your partner and look into their eyes. Pay attention to their face and to where your mind wanders.",
        partner: "Do the same as your partner. Stop either when the eye contact becomes uncomfortable, or when it is clear that it won't become uncomfortable. Take turns sharing where your mind wandered. Were there any similarities in detail, theme, or meaning?"
    },
    {
        you: "Speak about an experience with the intent to be deceptive about one particular emotional response you had in the experience.",
        partner: "Pay attention to your partner's face, words, and body. Let your partner know which emotion they are being deceptive about, and what they really felt instead."
    },
    {
        you: "Speak about something you judge others for. Pause for a moment. Is there any way this thing could hurt you?"
    },
    {
        you: "Describe the persona you are currently presenting, and what would happen if you dropped it."
    },
    {
        you: "Share something you are afraid of being judged for. Pause for a moment. Is there any way this thing could be loved?"
    },
    {
        you: "Would anything in your relationships change if you no longer needed anything practical or emotional from anyone else?"
    },
    {
        you: "What happens when you are alone with yourself, without any distractions. How do you feel about this?"
    },

    {
        you: "Have you attained anything that you once idealised? How do you feel about it now?"
    },
    {
        you: "Imagine that your senses point inside rather than outside. What can you tell us about what you are noticing?"
    },
    {
        you: "Have you ever had two different people tell you contradictory things about yourself? What did they tell you and who were they?"
    },
    {
        you: "What is something that your persona could never do?"
    },
    {
        you: "Do you have an ideal that you aspire to? How does that ideal differ from who you really are?"
    },
    {
        you: "How much trust do you have in yourself? Explain."
    },
    {
        you: "What is something you strongly believe about yourself? How does this influence your actions or choices?"
    },
    {
        you: "What is something you strongly believe about others? How does this influence your actions or choices?"
    },
    {
        you: "Are you running from yourself?"
    },
    {
        you: "When someone expresses love, care, or appreciation for you, is there any part of you which rejects it? What does this part want to say?"
    },
    {
        you: "If everyone were to treat you the way you treat yourself, how would you want that to be? Do you treat yourself this way now?"
    },
    {
        you: "When have you been a 'good person' (mature, disciplined etc) beyond what felt true for you? What happened as a result? Did this cost you anything?"
    },
    {
        you: "What do you want for your future, that you are sacrificing something now for? What do you want and what are you sacrificing?"
    },
    {
        you: "Is there something you imagine happening in the future that is making you suffer in the present?"
    },
    {
        you: "Imagine that constructive criticism and boundaries extinguish your resentment, creating a vacuum which draws people closer. Is there anyone you would like to draw closer in this way?"
    },
    {
        you: "Talk about how much you idealise people or other external things."
    },
    {
        you: "What would change in how you relate to people, if everyone had a different temperament every day?"
    },
    {
        you: "How do you balance expectations and growth in relationships?"
    },
    {
        you: "Speak about someone you love in this moment, not for your shared history or imagined future, but for who they are to you in this moment"
    },
    {
        you: "Speak about a protection that separated you from something good"
    },
    {
        you: "Speak about a time that an emotion wanted to speak through you, but you couldn't find the words. What happened? What would have happened if you'd had the words?"
    },
    {
        you: "Have you ever encountered a familiar situation and realised that both the situation, and yourself, are different from every other time you've encountered it? How did you come to realise this?"
    },
    {
        you: "Speak to a young version of yourself who is scared of the future."
    },
    {
        you: "Speak to an older version of yourself who regrets the past."
    },
    {
        you: "Close your eyes before a partner is chosen. Try to figure out who was chosen.",
        partner: "silently place your partner's hands on your face."
    },
    {
        you: "Close your eyes before a partner is chosen. Try to figure out who was chosen.",
        partner: "make the 'om/aum' sound ('ummm')"
    },
    {
        you: "imagine you are the personification of shame. Now imagine a child in front of you, and tell them what they need to know about themselves.",
        partner: "Imagine you are the personification of love. Speak to this same child."
    },
    {
        you: "sit in silence with your partner. Pay attention to them and try to communicate without speaking or gesturing.",
        partner: "sit in silence and pay attention to receiving what your partner is trying to communicate. What do you sense? Does what you imagined or pick up reveal anything about you?"
    },
    {
        you: "tell your partner something you believe is different about who they are as a person, between when you first met them, and now",
        partner: "tell your partner something which is actually different."
    },
    {
        you: "What do you believe about yourself based only on what other people have told you?"
    },
    {
        you: "Who would you be if no one had told you who you are or who you should be?"
    },
    {
        you: "When have you listened to someone else over your own instincts?"
    },
    {
        you: "When have you listened to your instincts over what someone told you?"
    },
    {
        you: "What do you think should make you happy, but doesn't?"
    },
    {
        you: "When did you last hide how you felt or what you thought? What did you hide and why?"
    },
    {
        you: "What happened in your past, that you are still guarding yourself from? What are you doing to protect yourself?"
    },
    {
        you: "What assumption about yourself are you most invested in being true? What if it weren't true?"
    },
    {
        you: "Is there something you imagine happening in the future that is making you suffer in the present?"
    },
    {
        you: "Have you ever felt lonely while surrounded by people? Do you know what was missing?"
    },
    {
        you: "Have you ever felt connected while alone? What did you feel connected to?"
    },
    {
        you: "How do you know when you're connecting with someone from a place of wholeness versus a place of emptiness?"
    },
    {
        you: "How do you treat people you don't need anything from?"
    },
    {
        you: "Has sadness ever led to nourishment?"
    },
    {
        you: "Has grief ever been cathartic?"
    },
    {
        you: "Has anger ever led to empowerment?"
    },
    {
        you: "Has boredom ever led to creation?"
    },
    {
        you: "Has loneliness ever led to self-discovery?"
    },
    {
        you: "Has confusion ever led to invention?"
    },
    {
        you: "Has excitement ever led to regret?"
    },
    {
        you: "When have you tried to change someone? What happened?"
    },
    {
        you: "Use a word to describe a part of your personality you feel is consistent. When have you acted in contradiction to this?"
    },
    {
        you: "Tell your partner something you dislike about yourself.",
        partner: "Reflect back any beauty or humanity in the part of themselves that your partner shared."
    },
    {
        you: "Talk about something that you were unable to change until you stopped trying to, and something that wouldn't change unless you tried to. What made these two different?"
    },
    {
        you: "Has conflict ever strengthened one of your relationships? How did this happen?"
    },
    



    





    {
        you: "Speak about a spitiual experience which changed your life."
    },
    {
        you: "What would you say to your younger self?"
    },
    {
        you: "What would your younger self think about you?"
    },
    {
        you: "What is your closest encounter with death?"
    },
    {
        you: "When have you refused to admit you were wrong, despite knowing that you were?"
    },
    {
        you: "How do you experience conflict?"
    },
    {
        you: "How do you experience loneliness?"
    },
    {
        you: "Speak about a time you have hurt someone."
    },
    {
        you: "Speak about something you want but struggle to ask for."
    },
    {
        you: "Speak about a time you have cheated on someone, been cheated on by someone, or someone cheated with you."
    },
    {
        you: "Speak about a time someone broke your trust."
    },
    {
        you: "Speak about a difficult conversation you've had with someone."
    },
    {
        you: "Speak about a time you've felt lost in life."
    },
    {
        you: "What is calling out to you that you are ignoring?"
    },
    {
        you: "What dream have you given up on?"
    },
    {
        you: "What is a dealbreaker in relationships or friendships?"
    },
    {
        you: "What is your dream job?"
    },
    {
        you: "Speak about a promise you regret breaking."
    },
    {
        you: "Is there someone you haven't forgiven, or someone you wish would forgive you?"
    },
    {
        you: "What do you need right now?"
    },
    {
        you: "Speak about a loss you never thought you would get over."
    },
    {
        you: "How do you feel about affirmations?"
    },
    {
        you: "What is the best way to help someone? Is it possible?"
    },
    {
        you: "What are you grieving at the moment?"
    },
    {
        you: "What is the one thing right now that you tell yourself would make you happy?"
    },
    {
        you: "What does emotional healing look like for you?"
    },
    {
        you: "What attachment wound has stayed with you?"
    },
    {
        you: "What have you been avoiding? Why?"
    },
    {
        you: "Do you unconditionally love yourself? If no, why? If yes, how?"
    },
    {
        you: "Someone who loves you takes over your body for a week. What would they do?"
    },
    {
        everyone: "What is something you don't understand about me?"
    },
    {
        everyone: "What is something that intrigues you about me?"
    },
    {
        everyone: "If you were to buy me a present, what would it be?"
    },
    {
        everyone: "Which actor would play me in a movie?"
    },
    {
        everyone: "Make a deduction about me based on details you can observe right now, Sherlock style."
    },
    {
        everyone: "What compliment do you think I get the most?"
    },
    {
        everyone: "What compliment do you think I need to hear more?"
    },
    {
        everyone: "Do I remind you of anyone?"
    },
    {
        everyone: "Close your eyes. What colour are my eyes?"
    },
    {
        everyone: "What is my body language telling you right now?"
    },
    {
        everyone: "What do you think is the hardest part of my job?"
    },
    {
        everyone: "Why do you think I am doing my job?"
    },
    {
        you: "Are you missing anyone right now? Do you think they are missing you?"
    },
    {
        you: "When you're asked how you are, how often do you answer truthfully?"
    },
    {
        you: "What do you want more of?"
    },
    {
        you: "Today is your last day alive. What are you thinking, feeling, and what will you do?"
    },
    {
        you: "What about your life would surprise your younger self?"
    },
    {
        you: "What does the word 'love' mean to you?"
    },
    {
        you: "What question are you trying to answer most in your life right now?"
    },
    {
        you: "Pick someone and ask them any question you'd like to."
    },
    {
        you: "How are you, really?"
    },
    {
        you: "Is there a feeling you miss?"
    },
    {
        you: "What is the most unexplainable thing that has ever happened to you?"
    },
    {
        you: "What in your life has hurt you the most?"
    },
    {
        you: "What in your life has made you feel loved or accepted the most?"
    },
    {
        you: "Is there anything you are trying to prove to yourself or someone else?"
    },
    {
        you: "How have your parents shaped who you are?"
    },
    {
        you: "What do you admire about a parent?"
    },
    {
        you: "What part of your life works? What part of your life hurts?"
    },
    {
        you: "How do people see you? How do you see yourself? If there is a difference, why?"
    },
    {
        everyone: "What parts of yourself do you see in me?"
    },
    {
        everyone: "What do you think my superpower would be?"
    },
    {
        everyone: "What do I need?"
    },
    {
        everyone: "What would make you feel closer to me?"
    },
    {
        everyone: "Do you think we met for a reason?"
    },
    {
        everyone: "How would you describe me to a stranger?"
    },
    {
        everyone: "What would allow you to feel safe enough to be vulnerable with me?"
    },
    {
        everyone: "What can I help you with?"
    },
    {
        everyone: "What about me most surprised you?"
    },
    {
        everyone: "Is there any way that our personalities complement each other?"
    },
    {
        everyone: "What do you think I fear the most?"
    },
    {
        everyone: "What do you think I should know about myself that I'm unaware of?"
    },
    {
        everyone: "When have you felt most connected to me?"
    },
    {
        everyone: "What do you admire most about me?"
    },
    {
        everyone: "What have you learnt from me?"
    },
];

class AttuneGame {
    constructor() {
        this.questions = [...QUESTIONS];
        this.activeDeck = [];
        this.currentCard = null;
        this.isAnimating = false;
        
        // Touch handling
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
        this.hasMoved = false;
        
        // Debug mode - set to true to see debug info
        this.debug = false;
        
        this.initializeElements();
        this.bindEvents();
    }
    
    log(message) {
        if (this.debug) {
            const debugEl = document.getElementById('debug');
            if (debugEl) {
                debugEl.style.display = 'block';
                debugEl.innerHTML += message + '<br>';
                const lines = debugEl.innerHTML.split('<br>');
                if (lines.length > 10) {
                    debugEl.innerHTML = lines.slice(-10).join('<br>');
                }
            }
        }
        console.log('AttuneGame:', message);
    }
    
    initializeElements() {
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.beginBtn = document.getElementById('begin-btn');
        this.cardsCount = document.getElementById('cards-count');
        this.cardContainer = document.getElementById('card-container');
        
        this.cardType = document.querySelector('.card-type');
        this.youSection = document.querySelector('.you-section');
        this.partnerSection = document.querySelector('.partner-section');
        this.everyoneSection = document.querySelector('.everyone-section');
        this.dividerSection = document.querySelector('.divider-section');
        this.youText = document.querySelector('.you-text');
        this.partnerText = document.querySelector('.partner-text');
        this.everyoneText = document.querySelector('.everyone-text');
        
        this.tapLeft = document.querySelector('.tap-left');
        this.tapRight = document.querySelector('.tap-right');
        
        // Modals
        this.spinnerModal = document.getElementById('spinner-modal');
        this.completeModal = document.getElementById('complete-modal');
        this.spinBtn = document.getElementById('spin-btn');
        this.closeSpinnerBtn = document.getElementById('close-spinner-btn');
        this.spinnerCircle = document.querySelector('.spinner-circle');
    }
    
    bindEvents() {
        this.beginBtn.addEventListener('click', () => this.startGame());
        
        // Touch events for swiping
        if (this.cardContainer) {
            this.cardContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            this.cardContainer.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            this.cardContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            this.cardContainer.addEventListener('contextmenu', (e) => e.preventDefault());
        }
        
        // Tap zones
        if (this.tapLeft) {
            this.tapLeft.addEventListener('click', () => {
                this.addBackToDeck();
            });
        }
        if (this.tapRight) {
            this.tapRight.addEventListener('click', () => {
                this.nextCard();
            });
        }
        
        // Spinner events
        if (this.spinBtn) {
            this.spinBtn.addEventListener('click', () => this.performSpin());
        }
        if (this.closeSpinnerBtn) {
            this.closeSpinnerBtn.addEventListener('click', () => this.hideSpinner());
        }
        if (this.spinnerModal) {
            this.spinnerModal.addEventListener('click', (e) => {
                if (e.target === this.spinnerModal) this.hideSpinner();
            });
        }
        
        // Complete modal
        if (this.completeModal) {
            this.completeModal.addEventListener('click', () => this.restartGame());
        }
        
        // Keyboard support for accessibility
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    bindActionButtons() {
        // Bind action buttons after game screen is shown
        const restartBtn = document.getElementById('restart-btn');
        const spinnerBtn = document.getElementById('spinner-btn');
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {

                this.restartGame();
            });
        }
        
        if (spinnerBtn) {
            spinnerBtn.addEventListener('click', () => {
                this.showSpinner();
            });
        }
    }
    
    handleTouchStart(e) {
        if (this.isAnimating) return;
        
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchCurrentX = this.touchStartX;
        this.touchCurrentY = this.touchStartY;
        this.hasMoved = false;
        
        const currentCardElement = document.getElementById('current-card');
        if (currentCardElement) {
            currentCardElement.classList.add('swiping');
        }
        
    }
    
    handleTouchMove(e) {
        if (this.isAnimating) return;
        
        e.preventDefault();
        
        const touch = e.touches[0];
        this.touchCurrentX = touch.clientX;
        this.touchCurrentY = touch.clientY;
        
        const deltaX = this.touchCurrentX - this.touchStartX;
        const deltaY = this.touchCurrentY - this.touchStartY;
        
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            this.hasMoved = true;
        }
        
        const currentCardElement = document.getElementById('current-card');
        if (!currentCardElement) return;
        
        // Show directional hints
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 30) {
                currentCardElement.classList.add('show-right-hint');
                currentCardElement.classList.remove('show-left-hint');
            } else if (deltaX < -30) {
                currentCardElement.classList.add('show-left-hint');
                currentCardElement.classList.remove('show-right-hint');
            }
        } else {
            currentCardElement.classList.remove('show-left-hint', 'show-right-hint');
        }
        
        // Apply transform for visual feedback
        const rotation = deltaX * 0.1;
        const scale = 1 - Math.abs(deltaX) * 0.0002;
        currentCardElement.style.transform = `translateX(${deltaX * 0.5}px) translateY(${deltaY * 0.3}px) rotate(${rotation}deg) scale(${scale})`;
    }
    
    handleTouchEnd(e) {
        if (this.isAnimating) return;
        
        const currentCardElement = document.getElementById('current-card');
        if (currentCardElement) {
            currentCardElement.classList.remove('swiping', 'show-left-hint', 'show-right-hint');
            currentCardElement.style.transform = '';
        }
        
        const deltaX = this.touchCurrentX - this.touchStartX;
        const deltaY = this.touchCurrentY - this.touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        
        // If no significant movement, treat as a tap
        if (!this.hasMoved) {
            const tapX = this.touchStartX;
            const screenWidth = window.innerWidth;
            
            if (tapX < screenWidth / 2) {
                this.addBackToDeck();
            } else {
                this.nextCard();
            }
            this.vibrate(50);
            return;
        }
        
        // Determine swipe direction
        const swipeThreshold = 80;
        
        if (absDeltaX > absDeltaY && absDeltaX > swipeThreshold) {
            if (deltaX > 0) {
                this.swipeRight();
            } else {
                this.swipeLeft();
            }
        } else if (absDeltaY > swipeThreshold) {
            if (deltaY < 0) {
                this.swipeUp();
            } else {
                this.swipeDown();
            }
        }
        
        this.vibrate(50);
    }
    
    handleKeyPress(e) {
        if (this.isAnimating) return;
        
        switch(e.key) {
            case 'ArrowRight':
                this.nextCard();
                break;
            case 'ArrowLeft':
                this.addBackToDeck();
                break;
            case 'ArrowUp':
                this.restartGame();
                break;
            case 'ArrowDown':
                this.showSpinner();
                break;
            case 'Escape':
                if (this.spinnerModal && this.spinnerModal.classList.contains('active')) {
                    this.hideSpinner();
                }
                break;
        }
    }
    
    vibrate(duration) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }
    
    loadQuestions() {
        this.activeDeck = this.shuffleArray([...this.questions]);
        this.updateCardsCount();
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    startGame() {
        this.startScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        
        this.loadQuestions();
        this.displayCurrentCard();
        
        // Bind action buttons after game screen is visible
        setTimeout(() => {
            this.bindActionButtons();
        }, 100);
    }
    
    displayCurrentCard() {
        if (this.activeDeck.length === 0) {
            this.showGameComplete();
            return;
        }
        
        this.currentCard = this.activeDeck[0];
        const question = this.currentCard;
                
        // Reset visibility
        this.youSection.style.display = 'none';
        this.partnerSection.style.display = 'none';
        this.everyoneSection.style.display = 'none';
        this.dividerSection.style.display = 'none';
        
        if (question.everyone) {
            this.cardType.textContent = 'everyone';
            this.everyoneText.textContent = question.everyone;
            this.everyoneSection.style.display = 'flex';
        } else if (question.partner) {
            this.cardType.textContent = 'both players';
            this.youText.textContent = question.you;
            this.partnerText.textContent = question.partner;
            this.youSection.style.display = 'flex';
            this.dividerSection.style.display = 'block';
            this.partnerSection.style.display = 'flex';
        } else {
            this.cardType.textContent = 'solo';
            this.youText.textContent = question.you;
            this.youSection.style.display = 'flex';
        }
        
        // Add flip in animation
        const cardElement = document.getElementById('current-card');
        if (cardElement) {
            cardElement.classList.add('flip-in');
            setTimeout(() => {
                cardElement.classList.remove('flip-in');
            }, 600);
        }
    }
    
    nextCard() {
        if (this.isAnimating || this.activeDeck.length === 0) return;
        this.swipeRight();
    }
    
    addBackToDeck() {
        if (this.isAnimating || this.activeDeck.length === 0) return;
        this.activeDeck.push(this.activeDeck[0]);
        this.swipeLeft();
    }
    
    swipeLeft() {
        this.isAnimating = true;
        const cardElement = document.getElementById('current-card');
        if (cardElement) {
            cardElement.classList.add('swipe-left');
        }
        
        setTimeout(() => {
            this.activeDeck.shift();
            if (cardElement) {
                cardElement.classList.remove('swipe-left');
            }
            this.displayCurrentCard();
            this.updateCardsCount();
            this.isAnimating = false;
        }, 300);
    }
    
    swipeRight() {
        this.isAnimating = true;
        const cardElement = document.getElementById('current-card');
        if (cardElement) {
            cardElement.classList.add('swipe-right');
        }
        
        setTimeout(() => {
            this.activeDeck.shift();
            if (cardElement) {
                cardElement.classList.remove('swipe-right');
            }
            this.displayCurrentCard();
            this.updateCardsCount();
            this.isAnimating = false;
        }, 300);
    }
    
    swipeUp() {
        this.isAnimating = true;
        const cardElement = document.getElementById('current-card');
        if (cardElement) {
            cardElement.classList.add('swipe-up');
        }
        
        setTimeout(() => {
            if (cardElement) {
                cardElement.classList.remove('swipe-up');
            }
            this.restartGame();
            this.isAnimating = false;
        }, 300);
    }
    
    swipeDown() {
        this.isAnimating = true;
        const cardElement = document.getElementById('current-card');
        if (cardElement) {
            cardElement.classList.add('swipe-down');
        }
        
        setTimeout(() => {
            if (cardElement) {
                cardElement.classList.remove('swipe-down');
            }
            this.restartGame();
            this.isAnimating = false;
        }, 300);
    }
    
    restartGame() {
        this.loadQuestions();
        this.displayCurrentCard();
        this.hideCompleteModal();
    }
    
    updateCardsCount() {
        if (this.cardsCount) {
            this.cardsCount.textContent = this.activeDeck.length;
        }
    }
    
    showGameComplete() {
        if (this.completeModal) {
            this.completeModal.classList.add('active');
        } else {
            alert('🎉 All cards completed! Tap to restart.');
            this.restartGame();
        }
    }
    
    hideCompleteModal() {
        if (this.completeModal) {
            this.completeModal.classList.remove('active');
        }
    }
    
    showSpinner() {
        if (this.spinnerModal) {
            this.spinnerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    hideSpinner() {
        if (this.spinnerModal) {
            this.spinnerModal.classList.remove('active');
            document.body.style.overflow = '';
            this.resetSpinner();
        }
    }
    
    performSpin() {
        if (!this.spinBtn || this.spinBtn.disabled) return;
        
        this.spinBtn.disabled = true;
        if (this.spinnerCircle) {
            this.spinnerCircle.classList.remove('spinning');
            this.spinnerCircle.style.removeProperty('--spin-degrees');
            
            // Force reflow
            this.spinnerCircle.offsetHeight;
            
            const totalRotation = 720 + Math.random() * 1440 + Math.random() * 360;
            this.spinnerCircle.style.setProperty('--spin-degrees', `${totalRotation}deg`);
            this.spinnerCircle.classList.add('spinning');
        }
        
        setTimeout(() => {
            if (this.spinBtn) {
                this.spinBtn.disabled = false;
            }
        }, 3000);
        
        this.vibrate(100);
    }
    
    resetSpinner() {
        if (this.spinnerCircle) {
            this.spinnerCircle.classList.remove('spinning');
            this.spinnerCircle.style.removeProperty('--spin-degrees');
        }
        if (this.spinBtn) {
            this.spinBtn.disabled = false;
        }
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AttuneGame();
});