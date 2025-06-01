// Question Database - Easy to edit and expand!
const QUESTIONS = [
    {
        everyone: "What do you sense about who I am, beyond what I've told you? Does this sense reflect something about me, or about you?"
    },
    {
        everyone: "What do you sense about what I am most afraid of, beyond what I've told you? Does this sense reflect something about me, or about you?"
    },
    {
        everyone: "What do you sense about what I am most proud of, beyond what I've told you? Does this sense reflect something about me, or about you?"
    },
    {
        everyone: "What do you sense about who I want to be seen as, beyond what I've told you? Does this sense reflect something about me, or about you?"
    },
    {
        everyone: "What do you sense about what I need, beyond what I've told you? Does this sense reflect something about me, or about you?"
    },
    {
        everyone: "What do you sense about who I am afraid to be seen as, beyond what I've told you? Does this sense reflect something about me, or about you?"
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
        everyone: "For everyone: Describe my inner child."
    },
    {
        you: "Get into a comfortable position, close your eyes, and think of a strong memory without sharing it.",
        partner: "Copy your partner's posture and breathing rhythm. Pay attention to any sensations, images, memories, impulses, or meanings that come up for you. Share what you notice with your partner."
    },
    {
        you: "Find somewhere comfortable to stand, away from others.",
        partner: "Stand up and face your partner. Walk towards them slowly, and stop when you sense a personal boundary. Speak about what you noticed change within you or your partner when you reached the boundary. Figure out whose boundary it was."
    },
    {
        you: "Share an emotionally important memory.",
        partner: "Clarify the emotions that you believe your partner is communicating, as well as the emotions beyond what they are communicating."
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
    }
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
        
        this.initializeElements();
        this.bindEvents();
        this.loadQuestions();
        
        // Debug mode - set to true to see debug info
        this.debug = false;
        this.log('Game initialized');
    }
    
    log(message) {
        if (this.debug) {
            const debugEl = document.getElementById('debug');
            if (debugEl) {
                debugEl.style.display = 'block';
                debugEl.innerHTML += message + '<br>';
                // Keep only last 10 messages
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
        
        this.log('Elements initialized');
    }
    
    bindEvents() {
        this.beginBtn.addEventListener('click', () => this.startGame());
        
        // Touch events for swiping
        this.cardContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.cardContainer.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.cardContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Tap zones
        this.tapLeft.addEventListener('click', () => {
            this.log('Tap left clicked');
            this.addBackToDeck();
        });
        this.tapRight.addEventListener('click', () => {
            this.log('Tap right clicked');
            this.nextCard();
        });
        
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
        
        // Prevent context menu on long press
        this.cardContainer.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Keyboard support for accessibility
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        this.log('Events bound');
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
        
        this.log(`Touch start: ${this.touchStartX}, ${this.touchStartY}`);
    }
    
    handleTouchMove(e) {
        if (this.isAnimating) return;
        
        e.preventDefault();
        
        const touch = e.touches[0];
        this.touchCurrentX = touch.clientX;
        this.touchCurrentY = touch.clientY;
        
        const deltaX = this.touchCurrentX - this.touchStartX;
        const deltaY = this.touchCurrentY - this.touchStartY;
        
        // Check if we've moved enough to be considered a drag
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
        
        this.log(`Touch end: deltaX=${deltaX}, deltaY=${deltaY}, hasMoved=${this.hasMoved}`);
        
        // If no significant movement, treat as a tap
        if (!this.hasMoved) {
            const tapX = this.touchStartX;
            const screenWidth = window.innerWidth;
            
            if (tapX < screenWidth / 2) {
                this.log('Tap left detected');
                this.addBackToDeck();
            } else {
                this.log('Tap right detected');
                this.nextCard();
            }
            this.vibrate(50);
            return;
        }
        
        // Determine swipe direction
        const swipeThreshold = 80;
        
        if (absDeltaX > absDeltaY && absDeltaX > swipeThreshold) {
            // Horizontal swipe
            if (deltaX > 0) {
                this.log('Swipe right detected');
                this.swipeRight(); // Next card
            } else {
                this.log('Swipe left detected');
                this.swipeLeft(); // Add back
            }
        } else if (absDeltaY > swipeThreshold) {
            // Vertical swipe
            if (deltaY < 0) {
                this.log('Swipe up detected');
                this.swipeUp(); // Restart
            } else {
                this.log('Swipe down detected');
                this.swipeDown(); // Spinner or restart
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
        this.log(`Loaded ${this.activeDeck.length} questions`);
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
        this.log('Starting game');
        this.startScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        this.loadQuestions();
        this.displayCurrentCard();
    }
    
    displayCurrentCard() {
        if (this.activeDeck.length === 0) {
            this.showGameComplete();
            return;
        }
        
        this.currentCard = this.activeDeck[0];
        const question = this.currentCard;
        
        this.log(`Displaying card: ${question.you || question.everyone || 'partner card'}`);
        
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
        this.log('Next card');
        this.swipeRight();
    }
    
    addBackToDeck() {
        if (this.isAnimating || this.activeDeck.length === 0) return;
        this.log('Add back to deck');
        this.activeDeck.push(this.activeDeck[0]); // Move current to end
        this.swipeLeft();
    }
    
    swipeLeft() {
        this.isAnimating = true;
        const cardElement = document.getElementById('current-card');
        if (cardElement) {
            cardElement.classList.add('swipe-left');
        }
        
        setTimeout(() => {
            this.activeDeck.shift(); // Remove first card
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
            this.activeDeck.shift(); // Remove first card
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
            // For now, just restart the game - can add spinner later
            this.restartGame();
            this.isAnimating = false;
        }, 300);
    }
    
    restartGame() {
        this.log('Restarting game');
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
        this.log('Game complete');
        if (this.completeModal) {
            this.completeModal.classList.add('active');
        } else {
            // Fallback if modal doesn't exist
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