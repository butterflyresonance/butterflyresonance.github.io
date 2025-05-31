// Question Database - Easy to edit and expand!
const QUESTIONS = [
    {
        you: "What moment in your childhood most shaped who you are today?"
    },
    {
        you: "If you could have dinner with anyone, living or dead, who would it be and why?"
    },
    {
        you: "Share something you've always wanted to try but haven't yet",
        partner: "Listen and ask a follow-up question about their dream experience"
    },
    {
        you: "What does home mean to you?"
    },
    {
        you: "When do you feel most creative?"
    },
    {
        you: "Describe a belief you once held strongly but later changed",
        partner: "Share your own experience of changing your mind about something important"
    },
    {
        you: "If you could master any skill instantly, what would it be?"
    },
    {
        you: "What's the most beautiful place you've ever been?"
    },
    {
        you: "Share something you're grateful for that others might take for granted",
        partner: "Share your own overlooked blessing and discuss how gratitude shapes your daily life"
    },
    {
        you: "What would you do differently if you knew no one would judge you?"
    },
    {
        you: "What's a small act of kindness that had a big impact on you?"
    },
    {
        you: "Give advice to your younger self",
        partner: "Share what advice you'd give your younger self, then discuss how you've both grown"
    },
    {
        you: "What's something you've learned recently that surprised you?"
    },
    {
        you: "What makes you lose track of time?"
    },
    {
        you: "Share a tradition from your family or culture that you cherish",
        partner: "Share one of your own cherished traditions, then create a new mini-tradition together right now"
    },
    {
        you: "If you could change one thing about the world, what would it be?"
    },
    {
        you: "What's something you're passionate about that others might not expect?"
    },
    {
        you: "Demonstrate your favorite way to show someone you care",
        partner: "Show your own way of expressing care, then practice both methods on each other"
    },
    {
        you: "What's a fear you've overcome or are working to overcome?"
    },
    {
        you: "What does success mean to you personally?"
    },
    {
        you: "Share something you wish people knew about you",
        partner: "Share your own hidden aspect, then take turns asking gentle questions to learn more"
    },
    {
        you: "If you could live anywhere in the world, where would it be and why?"
    },
    {
        you: "What's a book, movie, or song that changed your perspective?"
    },
    {
        you: "Show how you recharge when feeling drained",
        partner: "Demonstrate your own recharging method, then try each other's techniques together"
    },
    {
        you: "What's a memory that always makes you smile?"
    }
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
        this.resetSpinner();
    }
    
    hideSpinner() {
        this.spinnerModal.classList.remove('active');
    }
    
    performSpin() {
        this.spinBtn.disabled = true;
        
        // Reset any previous spin state
        this.spinnerCircle.classList.remove('spinning');
        this.spinnerCircle.style.removeProperty('--spin-degrees');
        
        // Force a reflow to ensure the reset takes effect
        this.spinnerCircle.offsetHeight;
        
        // Generate random spin (2-4 full rotations plus random degrees)
        const randomRotations = 720 + (Math.random() * 720); // 2-4 rotations
        
        // Set CSS custom property for animation
        this.spinnerCircle.style.setProperty('--spin-degrees', `${randomRotations}deg`);
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