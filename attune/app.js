// Question Database - Easy to edit and expand!
const QUESTIONS = [
    {
        you: "For everyone: what do you sense about who I am, beyond what I've told you? Does this sense reflect something about me, or about you?"
    },
    {
        you: "For everyone: what do you sense about what I am most afraid of, beyond what I've told you? Does this sense reflect something about me, or about you?"
    },
    {
        you: "For everyone: what do you sense about what I am most proud of, beyond what I've told you? Does this sense reflect something about me, or about you?"
    },
    {
        you: "For everyone: what do you sense about who I want to be seen as, beyond what I've told you? Does this sense reflect something about me, or about you?"
    },
    {
        you: "For everyone: what do you sense about what I need, beyond what I've told you? Does this sense reflect something about me, or about you?"
    },
    {
        you: "For everyone: what do you sense about who I am afraid to be seen as, beyond what I've told you? Does this sense reflect something about me, or about you?"
    },
    {
        you: "What's one way you see yourself reflected in someone else here?"
    },
    {
        you: "What do you think we are hoping for from this experience?"
    },
    {
        you: "What's something you imagine everyone here understands about you without having to explain it?"
    },
    {
        you: "What do you alternate between having too much of and not enough of? What does each extreme protect you from feeling?"
    },
    {
        you: "Describe a recent moment when you caught yourself acting automatically. What was driving that automaticity?"
    },
    {
        you: "What are you seeking in other people that you're unwilling to find in yourself?"
    },
    {
        you: "Describe the part of you that feels like it's still searching. What is it looking for?"
    },
    {
        you: "What makes you feel most seen, and what makes you want to hide when you feel seen?"
    },
    {
        you: "When do you use love as a way to avoid love?"
    },
    {
        you: "Do you ever do things to feel special that make you feel more alone? What does that look like?"
    },
    {
        you: "Have you noticed times when giving becomes about control, or withholding becomes about connection?"
    },
    {
        you: "Are there ways you try to feel safe that backfire? What are they?"
    },
    {
        you: "Do you ever push away or reject the thing you want most? What is pushing you to do this?"
    },
    {
        you: "What do you desperately want to be understood about, and do you do anything that makes it difficult to understand?"
    },
    {
        you: "Have you ever betrayed yourself in an attempt to feel loved?"
    },
    {
        you: "Is there anything you reveal about yourself in order to hide something else?"
    },
    {
        you: "Get into a comfortable position, close your eyes, and let your mind wander.",
        partner: "Get into a comfortable position, watch your partners face, and let your mind wander with theirs. Let them know when to come back. Let them know what caused you to bring them back. Compare where your minds wandered."
    },
    {
        you: "Ask your partner what it is that they think you most need to hear right now.",
        partner: "Respond instinctively, with minimal thought or consideration."
    },
    {
        you: "For everyone: Describe my inner child."
    },
    {
        you: "Get into a comfortable position, close your eyes, and think of a strong memory without sharing it.",
        partner: "Copy your partner's posture and breathing rhythm. Pay attention to any sensations, images, memories, impulses, or meanings that come up for you. Share what you notice with your partner."
    },
    {
        you: "Find somewhere comfortable to stand, away from others.",
        partner: "Stand up and face your partner. Walk towards them slowly, and stop when you sense their personal boundary. Speak about what you noticed change within you or your partner when you reached the boundary."
    },
    {
        you: "Share an emotionally important memory.",
        partner: "Clarify the emotions that you believe your partner is communicating, as well as the emotions beyond what they are communicating."
    },
    {
        you: "Make an assumption about your partner.",
        partner: "Respond instinctively, with minimal thought or consideration."
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
        partner: "Attempt to make this story meaningful or noteworthy by using clarifying questions."
    },
    {
        you: "What is something most people misunderstand about you? What do they get wrong?"
    },
    {
        you: "What validation or reassurance are you secretly hoping for?"
    },
    {
        you: "What emotion in yourself feels most difficult to feel or express? What narratives do you have around this emotion? What do you do to avoid it? What would you need to feel safe to feel or express it?"
    },
    {
        you: "What emotion in others feels most difficult for you to sit with, without trying to change it? What narratives do you have around this emotion? What do you do to change this emotion in others? How does this emotion feel threatening?"
    },
    {
        you: "What emotion in yourself feels most welcome to be felt or expressed? What narratives do you have around this emotion? What do you do to chase this emotion? What feels safe about this emotion?"
    },
    {
        you: "What emotion in others feels most welcome to be in the presence of? What narratives do you have around this emotion? What do you do to influence others to feel this emotion? What don't you need to worry about in the presence of this emotion?"
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
        you: "What feels scary about feeling fundamentally misunderstood?"
    },
    {
        you: "What thoughts, emotions, or behaviours do you use to avoid other emotions?"
    },
    {
        you: "What feels comfortable about feeling fundamentally misunderstood?"
    },
    {
        you: "What feels scary about feeling deeply understood?"
    },
    {
        you: "What feels comfortable about feeling deeply understood?"
    },
    {
        you: "Describe a recent experience, but don't say anything about how you felt.",
        partner: "Watch your partner's face. Pause them every time you notice a feeling arise, and check whether you are accurate."
    },
    {
        you: "Describe an experience using only the emotions it made you feel.",
        partner: "Propose details about what the experience might have been, and check for accuracy."
    },
    {
        you: "Describe an experience using only the sensory details.",
        partner: "Propose details about what the experience might have been, and check for accuracy."
    },
    {
        you: "Describe a situation which you found challenging, but do not share why you found it challenging.",
        partner: "Let your partner know what you believe would be challenging about that situation for yourself, and what you imagine would have been challenging for them."
    },
    {
        you: "Describe an experience from the point of view of someone you know, without saying who it is.",
        partner: "Guess who this person is to your partner."
    },
    {
        you: "Find the part of yourself which feels uncomfortable receiving compliments. What would it say if you gave it a voice?"
    },
    {
        you: "Find the part of yourself which feels comfortable receiving criticism. What would it say if you gave it a voice?"
    },
    {
        you: "Find the part of yourself which feels most shameful or unlovable. What is it afraid of?"
    },
    {
        you: "Talk about something emotional which has happened to you.",
        partner: "Ignore your partner's words. Pay attention to their face, their body, and your own body. Share with your partner what you noticed."
    },
    {
        you: "Talk about a common, everyday experience you've had recently.",
        partner: "Attempt to make this story unique by asking clarifying questions."
    },
    {
        you: "Think of something you feel so confident explaining, that you could explain it to a 5 year old. Explain it to your partner as if they were a 5 year old.",
        partner: "Suggest something to your partner about what they have explained that you don't think they have thought about. Tell your partner to sit with the suggestion without dismissing it."
    },
    {
        you: "What behaviour in others makes you want to open up?"
    },
    {
        you: "What behaviour in others makes you want to close down?"
    },
    {
        you: "When have you chosen a certain misery over the misery of uncertainty?"
    },
    {
        you: "Tell your partner about a problem you would really like a solution to.",
        partner: "Respond in the most loving way possible, but don't mention a single possible solution."
    },
    {
        you: "Tell your partner something you would enjoy doing if you woke up tomorrow in their body.",
        partner: "Tell your partner something you would enjoy doing if you woke up tomorrow in their body."
    },
    {
        you: "What would you change about how you interact with people if you were completely safe, physically and emotionally?"
    },
    {
        you: "Speak about a time you went against your values out of fear.",
        partner: "Listen to your partner as if they were an innocent baby. Let them know your honest thoughts and feelings about what they have said."
    },
    {
        you: "When have you regretted being vulnerable?"
    },
    {
        you: "When has being vulnerable paid off?"
    },
    {
        you: "When have you regretted not being vulnerable?"
    },
    {
        you: "When has not being vulnerable paid off?"
    },
    {
        you: "Face your partner and look into their eyes. Invite an emotion to arise, without speaking about it.",
        partner: "Face your partner and look into their eyes. Pay attention to your body. Let your partner know when you feel something from them."
    },
    {
        you: "Face your partner and look into their eyes. Pay attention to their face and to where your mind wanders.",
        partner: "Do the same as your partner. Stop either when the eye contact becomes uncomfortable, or when it is clear that it won't become uncomfortable. Take turns sharing where your mind wandered, and notice any similarities."
    },
    {
        you: "Speak about an experience with the intent to be deceptive about one particular emotional response you had to the experience.",
        partner: "Pay attention to your partner's face, words, and body. Let your partner know which emotion was the deceptive one, and what they really felt instead."
    },
    {
        you: "Speak about something you judge others for. Now, dig deeper and speak about how that thing is a threat to you."
    },
    {
        you: "Describe the persona you are currently presenting, and what would happen if you dropped it."
    },
    {
        you: "Share something you are afraid of being judged for. Now, dig deeper and explain why this thing is beautiful."
    },
    {
        you: "Would anything in your relationships change if you no longer needed anything practical or emotional from anyone else?"
    },
    {
        you: "What feels scary about being with yourself? What do you do to avoid being with yourself?"
    },
];

class AttuneGame {
    constructor() {
        this.questions = [];
        this.activeDeck = [];
        
        // Initialize DOM elements
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.cardDisplay = document.getElementById('card-display');
        
        this.beginBtn = document.getElementById('begin-btn');
        this.nextCardBtn = document.getElementById('next-card-btn');
        this.startAgainBtn = document.getElementById('start-again-btn');
        this.showSpinnerBtn = document.getElementById('show-spinner-btn');
        
        this.cardElement = document.getElementById('current-card');
        this.cardType = document.querySelector('.card-type');
        this.youText = document.querySelector('.you-text');
        this.partnerText = document.querySelector('.partner-text');
        this.partnerSection = document.querySelector('.partner-section');
        this.cardsRemaining = document.getElementById('cards-remaining');
        
        // Spinner modal elements
        this.spinnerModal = document.getElementById('spinner-modal');
        this.spinnerCircle = document.querySelector('.spinner-circle');
        this.spinBtn = document.getElementById('spin-btn');
        this.closeSpinnerBtn = document.getElementById('close-spinner-btn');
        
        this.init();
    }
    
    init() {
        this.loadQuestions();
        this.bindEvents();
    }
    
    loadQuestions() {
        // Use the questions from the JavaScript array
        this.questions = [...QUESTIONS];
    }
    
    bindEvents() {
        this.beginBtn.addEventListener('click', () => this.startGame());
        this.nextCardBtn.addEventListener('click', () => this.drawNextCard());
        this.startAgainBtn.addEventListener('click', () => this.restartGame());
        this.showSpinnerBtn.addEventListener('click', () => this.showSpinner());
        this.spinBtn.addEventListener('click', () => this.performSpin());
        this.closeSpinnerBtn.addEventListener('click', () => this.hideSpinner());
        
        // Close spinner when clicking outside modal
        this.spinnerModal.addEventListener('click', (e) => {
            if (e.target === this.spinnerModal) {
                this.hideSpinner();
            }
        });
        
        // Close spinner with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.spinnerModal.classList.contains('active')) {
                this.hideSpinner();
            }
        });
    }
    
    // Seeded random number generator using current time
    seedRandom(seed = Date.now()) {
        this.seed = seed;
        return () => {
            this.seed = (this.seed * 9301 + 49297) % 233280;
            return this.seed / 233280;
        };
    }
    
    // Fisher-Yates shuffle with seeded random
    shuffleArray(array) {
        const random = this.seedRandom();
        const shuffled = [...array];
        
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        return shuffled;
    }
    
    cloneQuestionsToActiveDeck() {
        // Clone questions and shuffle them using current time as seed
        this.activeDeck = this.shuffleArray(this.questions);
        this.updateCardsRemaining();
    }
    
    startGame() {
        // Hide start screen, show game screen
        this.startScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        this.cardDisplay.classList.add('active');
        
        // Clone questions to active deck
        this.cloneQuestionsToActiveDeck();
        
        // Draw first card
        this.drawNextCard();
    }
    
    drawNextCard() {
        if (this.activeDeck.length === 0) {
            this.showGameComplete();
            return;
        }
        
        // Add flip animation
        this.cardElement.classList.add('flipping');
        
        setTimeout(() => {
            // Select random card from active deck using current time as additional entropy
            const randomIndex = Math.floor((Date.now() % 1000) / 1000 * this.activeDeck.length);
            const selectedQuestion = this.activeDeck[randomIndex];
            
            // Remove the selected question from active deck
            this.activeDeck.splice(randomIndex, 1);
            
            // Display the card
            this.displayCard(selectedQuestion);
            this.updateCardsRemaining();
            
            // Remove flip animation
            this.cardElement.classList.remove('flipping');
        }, 300);
    }
    
    displayCard(question) {
        // Set card type based on whether partner field exists
        this.cardType.textContent = question.partner ? 'Both Players' : 'Solo';
        
        // Set you text
        this.youText.textContent = question.you;
        
        // Handle partner section
        if (question.partner) {
            this.partnerText.textContent = question.partner;
            this.partnerSection.style.display = 'block';
        } else {
            this.partnerSection.style.display = 'none';
        }
    }
    
    restartGame() {
        // Reset spinner state
        this.resetSpinner();
        
        // Clone questions back to active deck
        this.cloneQuestionsToActiveDeck();
        
        // Draw first card
        this.drawNextCard();
    }
    
    updateCardsRemaining() {
        this.cardsRemaining.textContent = this.activeDeck.length;
    }
    
    showGameComplete() {
        this.cardType.textContent = 'Complete!';
        this.youText.textContent = "🎉 All cards completed! Click 'Start Again' to shuffle and play another round.";
        this.partnerSection.style.display = 'none';
        this.updateCardsRemaining();
    }
    
    // Spinner functionality
    showSpinner() {
        this.spinnerModal.classList.add('active');
        this.spinnerModal.setAttribute('aria-hidden', 'false');
        this.resetSpinner();
        
        // Focus the spin button for accessibility
        this.spinBtn.focus();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    hideSpinner() {
        this.spinnerModal.classList.remove('active');
        this.spinnerModal.setAttribute('aria-hidden', 'true');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to spinner button
        this.showSpinnerBtn.focus();
    }
    
    performSpin() {
        if (this.spinBtn.disabled) return; // Prevent multiple clicks
        
        this.spinBtn.disabled = true;
        
        // Reset any previous spin state
        this.spinnerCircle.classList.remove('spinning');
        this.spinnerCircle.style.removeProperty('--spin-degrees');
        
        // Force a reflow to ensure the reset takes effect
        this.spinnerCircle.offsetHeight;
        
        // Generate random spin (2-4 full rotations plus random degrees)
        const baseRotations = 720; // 2 full rotations minimum
        const extraRotations = Math.random() * 720; // Up to 2 more rotations
        const randomDegrees = Math.random() * 360; // Final position
        const totalRotation = baseRotations + extraRotations + randomDegrees;
        
        // Set CSS custom property for animation
        this.spinnerCircle.style.setProperty('--spin-degrees', `${totalRotation}deg`);
        this.spinnerCircle.classList.add('spinning');
        
        setTimeout(() => {
            this.spinBtn.disabled = false;
        }, 3000);
    }
    
    resetSpinner() {
        this.spinnerCircle.classList.remove('spinning');
        this.spinnerCircle.style.removeProperty('--spin-degrees');
        this.spinBtn.disabled = false;
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AttuneGame();
});

// Add some visual flair - subtle background animation
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    let mouseX = 0;
    let mouseY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;
        
        body.style.setProperty('--mouse-x', mouseX);
        body.style.setProperty('--mouse-y', mouseY);
    });
});

// Add touch support for mobile devices
document.addEventListener('DOMContentLoaded', () => {
    // Prevent zoom on double tap for iOS
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Add haptic feedback on button press (if supported)
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        });
    });
});