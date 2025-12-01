const PRIORITY_QUESTIONS = [
    // Add your must-have questions here with both languages
    // Example:
    // { 
    //     english: "Your question in English",
    //     russian: "Ваш вопрос на русском"
    // }
];

// Question Database - Replace with your bilingual questions
const QUESTIONS = [
    { 
        english: "Imagine you walk into a room with everyone you've ever met. Who do you look for first?",
        russian: "Представь, что ты заходишь в комнату со всеми, кого когда-либо встречал. Кого ты ищешь первым?"
    },
    { 
        english: "What aspects of yourself do you hide from others, and how would your life change if you stopped hiding?",
        russian: "Какие аспекты себя ты скрываешь от других, и как изменилась бы твоя жизнь, если бы ты перестал скрывать?"
    },
    // Add the rest of your questions here in the same format
    // Each question should have both 'english' and 'russian' properties
];

class WakeLockManager {
    constructor() {
        this.wakeLock = null;
        this.isSupported = 'wakeLock' in navigator;
    }

    async requestWakeLock() {
        if (!this.isSupported) {
            console.log('Wake Lock API not supported');
            return false;
        }

        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            return true;
        } catch (err) {
            console.error(`${err.name}, ${err.message}`);
            return false;
        }
    }

    async releaseWakeLock() {
        if (this.wakeLock) {
            await this.wakeLock.release();
            this.wakeLock = null;
        }
    }

    handleVisibilityChange() {
        if (this.wakeLock !== null && document.visibilityState === 'visible') {
            this.requestWakeLock();
        }
    }
}

class AttuneGame {
    constructor() {
        this.questions = [...QUESTIONS];
        this.allQuestions = [];
        this.currentIndex = 0;
        this.currentCard = null;
        this.isAnimating = false;
        
        // Touch handling
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
        this.hasMoved = false;
        
        // Debug mode
        this.debug = false;

        this.wakeLockManager = new WakeLockManager();
        this.setupWakeLock();
        
        this.initializeElements();
        this.bindEvents();
    }

    setupWakeLock() {
        document.addEventListener('visibilitychange', () => {
            this.wakeLockManager.handleVisibilityChange();
        });
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
        this.completeModal = document.getElementById('complete-modal');
    }
    
    bindEvents() {
        this.beginBtn.addEventListener('click', () => this.startGame());
        
        // Tap zones
        if (this.tapLeft) {
            this.tapLeft.addEventListener('click', () => {
                this.previousCard();
            });
        }
        if (this.tapRight) {
            this.tapRight.addEventListener('click', () => {
                this.nextCard();
            });
        }
        
        // Complete modal
        if (this.completeModal) {
            this.completeModal.addEventListener('click', () => this.restartGame());
        }
        
        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }
    
    bindActionButtons() {
        const restartBtn = document.getElementById('restart-btn');
        const shareBtn = document.getElementById('share-btn');
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restartGame();
            });
        }

        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareCurrentQuestion();
            });
        }
    }

    async shareCurrentQuestion() {
        if (!this.currentCard) return;

        const question = this.currentCard;
        const englishText = question.english || '';
        const russianText = question.russian || '';
        
        // Russian first, then English
        const shareText = `${russianText}\n\n${englishText}`;

        // Check if Web Share API is supported
        if (navigator.share) {
            try {
                await navigator.share({
                    text: shareText
                });
            } catch (err) {
                // User cancelled or error occurred
                if (err.name !== 'AbortError') {
                    this.fallbackCopyToClipboard(shareText);
                }
            }
        } else {
            // Fallback to clipboard
            this.fallbackCopyToClipboard(shareText);
        }
    }

    async fallbackCopyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            // Show a brief notification
            this.showCopyNotification();
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    showCopyNotification() {
        // Create a simple notification element
        const notification = document.createElement('div');
        notification.textContent = 'Copied to clipboard!';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
            font-family: 'Inter', sans-serif;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    handleKeyPress(e) {
        if (this.isAnimating) return;
        
        switch(e.key) {
            case 'ArrowRight':
                this.nextCard();
                break;
            case 'ArrowLeft':
                this.previousCard();
                break;
            case 'ArrowUp':
                this.restartGame();
                break;
        }
    }
    
    vibrate(duration) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    loadQuestions() {
        const shuffledPriority = this.shuffleArray([...PRIORITY_QUESTIONS]);
        const shuffledRegular = this.shuffleArray([...this.questions]);
        
        this.allQuestions = [...shuffledPriority, ...shuffledRegular];
        this.currentIndex = 0;
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
        
        setTimeout(() => {
            this.bindActionButtons();
        }, 100);
        this.wakeLockManager.requestWakeLock();
    }

    cleanup() {
        this.wakeLockManager.releaseWakeLock();
    }
    
    displayCurrentCard() {
        if (this.currentIndex >= this.allQuestions.length) {
            this.showGameComplete();
            return;
        }
        
        this.currentCard = this.allQuestions[this.currentIndex];
        const question = this.currentCard;
                
        // Reset visibility
        this.youSection.style.display = 'none';
        this.partnerSection.style.display = 'none';
        this.everyoneSection.style.display = 'none';
        this.dividerSection.style.display = 'none';
        
        // Display card type and both languages
        this.cardType.textContent = 'solo';
        
        // Create bilingual text with Russian first
        const englishText = question.english || '';
        const russianText = question.russian || '';
        const bilingualText = `${russianText}<br><br>${englishText}`;
        
        this.youText.innerHTML = bilingualText;
        this.youSection.style.display = 'flex';
        
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
        if (this.isAnimating || this.currentIndex >= this.allQuestions.length) return;
        this.swipeRight();
    }
    
    previousCard() {
        if (this.isAnimating) return;
        this.swipeLeft();
    }
    
    swipeLeft() {
        if (this.currentIndex === 0) {
            return;
        }
        
        this.isAnimating = true;
        const cardElement = document.getElementById('current-card');
        if (cardElement) {
            cardElement.classList.add('swipe-left');
        }
        
        setTimeout(() => {
            this.currentIndex--;
            
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
            this.currentIndex++;
            
            if (cardElement) {
                cardElement.classList.remove('swipe-right');
            }
            this.displayCurrentCard();
            this.updateCardsCount();
            this.isAnimating = false;
        }, 300);
    }
    
    restartGame() {
        this.currentIndex = 0;
        this.loadQuestions();
        this.displayCurrentCard();
        this.hideCompleteModal();
    }
    
    updateCardsCount() {
        if (this.cardsCount) {
            const remaining = this.allQuestions.length - this.currentIndex;
            this.cardsCount.textContent = remaining;
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
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AttuneGame();
});