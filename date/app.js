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
    english: "How emotionally available do I seem, and why?",
    russian: "Насколько я кажусь эмоционально доступным/доступной, и почему?"
},
{ 
    english: "How would you describe our time together, using one word?",
    russian: "Как бы ты описал(а) наше время вместе одним словом?"
},
{ 
    english: "Is there a part of my personality you have noticed that you think others might not?",
    russian: "Есть ли какая-то часть моей личности, которую ты заметил(а), но которую другие могут не замечать?"
},
{ 
    english: "Which songs, movies, tv shows, books, poems, or pieces of art are meaningful to you and you would like to share?",
    russian: "Какие песни, фильмы, сериалы, книги, стихи или произведения искусства значимы для тебя и которыми ты хотел(а) бы поделиться?"
},
{ 
    english: "Based on what you know about me, what do you think I am attracted to?",
    russian: "Основываясь на том, что ты знаешь обо мне, что, по-твоему, меня привлекает?"
},
{ 
    english: "Can you describe my energy or vibe? How do you feel when you are around me?",
    russian: "Можешь описать мою энергию или атмосферу? Что ты чувствуешь, когда находишься рядом со мной?"
},
{ 
    english: "If you were to write a review of me, what would it be?",
    russian: "Если бы ты писал(а) отзыв обо мне, каким бы он был?"
},
{ 
    english: "What do you find most attractive about me physically, and what do you find most attractive beyond the physical?",
    russian: "Что тебе кажется самым привлекательным во мне физически, и что самым привлекательным за пределами физического?"
},
{ 
    english: "What is something you absolutely need in your life?",
    russian: "Что тебе абсолютно необходимо в твоей жизни?"
},
{ 
    english: "What have you learnt about love from the relationships you grew up around?",
    russian: "Что ты узнал(а) о любви из отношений, которые видел(а) в детстве?"
},
{ 
    english: "Is there any relationship advice you would give your younger self?",
    russian: "Есть ли какой-то совет об отношениях, который ты бы дал(а) своему младшему себе?"
},
{ 
    english: "What do you feel that others misunderstand most about you?",
    russian: "Что, по-твоему, другие больше всего неправильно понимают в тебе?"
},
{ 
    english: "What has being single taught you about yourself?",
    russian: "Чему тебя научило то, что ты был(а) один/одна?"
},
{ 
    english: "How emotionally available do you feel in this moment, and in your life generally?",
    russian: "Насколько эмоционально доступным/доступной ты чувствуешь себя сейчас и в своей жизни в целом?"
},
{ 
    english: "What have you tolerated from others in the past that you no longer have space for?",
    russian: "Что ты терпел(а) от других в прошлом, но больше не готов(а) терпеть?"
},
{ 
    english: "What is something you've learnt about yourself recently?",
    russian: "Что ты недавно узнал(а) о себе?"
},
{ 
    english: "Who in your life do you feel most like yourself around? Why?",
    russian: "Рядом с кем в твоей жизни ты чувствуешь себя наиболее собой? Почему?"
},
{ 
    english: "Stare into each other's eyes for 60 seconds. Notice which feelings come up, and whether they change.",
    russian: "Смотрите друг другу в глаза 60 секунд. Замечайте, какие чувства возникают и меняются ли они."
},
{ 
    english: "What does the word love mean to you?",
    russian: "Что означает для тебя слово любовь?"
},
{ 
    english: "What's the most difficult thing about dating you?",
    russian: "Что самое сложное в отношениях с тобой?"
},
{ 
    english: "What kind of person do you aspire to be in a relationship, and does it differ from the kind of person your feelings push you to be?",
    russian: "Каким человеком ты стремишься быть в отношениях, и отличается ли это от того, каким человеком тебя заставляют быть твои чувства?"
},
{ 
    english: "Which part of your life is most meaningful or energising to you? Why?",
    russian: "Какая часть твоей жизни наиболее значима или придает тебе энергию? Почему?"
},
{ 
    english: "Which part of your life is most draining to you? Why?",
    russian: "Какая часть твоей жизни больше всего истощает тебя? Почему?"
},
{ 
    english: "How would your friends describe me?",
    russian: "Как бы твои друзья описали меня?"
},
{ 
    english: "How much physical contact and passion do you want, or not want? Why?",
    russian: "Сколько физического контакта и страсти ты хочешь или не хочешь? Почему?"
},
{ 
    english: "If someone felt affectionate and caring towards you, what is the best way they could demonstrate this to you?",
    russian: "Если бы кто-то чувствовал нежность и заботу к тебе, каким был бы лучший способ показать это тебе?"
},
{ 
    english: "How do you know when you are wanting a connection out of loneliness or fear, and when you are wanting a specific connection because of the other person?",
    russian: "Как ты понимаешь, когда ты хочешь связи из-за одиночества или страха, и когда ты хочешь конкретной связи из-за другого человека?"
},
{ 
    english: "What is something I have done that annoyed or hurt you? Can you understand why I did it? Can you explain why it annoyed or hurt you?",
    russian: "Что я сделал(а), что раздражало или ранило тебя? Можешь понять, почему я это сделал(а)? Можешь объяснить, почему это тебя раздражало или ранило?"
},
{ 
    english: "What is my ideal partner? What kind of person would I need to be, to be their ideal partner?",
    russian: "Кто мой идеальный партнер? Каким человеком мне нужно быть, чтобы стать их идеальным партнером?"
},
{ 
    english: "Is there a part of your first impression of me which you have since found to be incorrect? What was it based on?",
    russian: "Была ли какая-то часть твоего первого впечатления обо мне, которая оказалась неправильной? На чем она была основана?"
},
{ 
    english: "If someone who didn't know me saw me, what would they guess was my occupation?",
    russian: "Если бы кто-то, кто меня не знает, увидел меня, какую профессию, по-твоему, он бы мне приписал?"
},
{ 
    english: "What does home feel like to you?",
    russian: "Каким для тебя ощущается дом?"
},
{ 
    english: "What makes you feel seen and understood?",
    russian: "Что заставляет тебя чувствовать себя увиденным/увиденной и понятым/понятой?"
},
{ 
    english: "If we could spend a whole day together doing anything, what would you want to do?",
    russian: "Если бы мы могли провести целый день вместе, занимаясь чем угодно, чем бы ты хотел(а) заниматься?"
},
{ 
    english: "What's something about your culture or upbringing that's important for me to understand?",
    russian: "Что-то из твоей культуры или воспитания, что важно для меня понять?"
},
{ 
    english: "What boundary of yours do you want me to know about?",
    russian: "О какой твоей границе ты хочешь, чтобы я знал(а)?"
},
{ 
    english: "What do you need when you're feeling vulnerable or overwhelmed?",
    russian: "Что тебе нужно, когда ты чувствуешь себя уязвимым/уязвимой или перегруженным/перегруженной?"
},
{ 
    english: "When you're asked how you are, how often do you answer truthfully?",
    russian: "Когда тебя спрашивают, как дела, как часто ты отвечаешь правдиво?"
},
{ 
    english: "What gives you comfort?",
    russian: "Что дает тебе утешение?"
},
{ 
    english: "What is your most cherished memory?",
    russian: "Какое твое самое дорогое воспоминание?"
},
{ 
    english: "What question are you trying to answer in your life right now?",
    russian: "На какой вопрос ты пытаешься ответить в своей жизни прямо сейчас?"
},
{ 
    english: "What does intimacy mean to you, beyond the physical? How does it develop?",
    russian: "Что означает для тебя близость, помимо физического? Как она развивается?"
},
{ 
    english: "What parts of yourself do you hide in order to be loved, and what would it feel like to be loved without hiding?",
    russian: "Какие части себя ты скрываешь, чтобы быть любимым/любимой, и каково было бы быть любимым/любимой, не скрываясь?"
},
{ 
    english: "When do you feel most free with me, and when do you feel most constrained?",
    russian: "Когда ты чувствуешь себя наиболее свободным/свободной со мной, а когда наиболее скованным/скованной?"
},
{ 
    english: "What would change between us if neither of us was trying to become anything other than what we are?",
    russian: "Что изменилось бы между нами, если бы никто из нас не пытался стать кем-то другим, кроме того, кто мы есть?"
},
{ 
    english: "Can you want me without needing me? What's the difference?",
    russian: "Можешь ли ты хотеть меня, не нуждаясь во мне? В чём разница?"
},
{ 
    english: "What do you think would happen if we cared for each other deeply and still allowed each other complete freedom?",
    russian: "Что, по-твоему, произошло бы, если бы мы глубоко заботились друг о друге и при этом давали друг другу полную свободу?"
},
{ 
    english: "What are you afraid would happen if you stopped trying to hold onto this connection and just let it unfold?",
    russian: "Чего ты боишься, что произойдёт, если ты перестанешь пытаться удержать эту связь и просто позволишь ей раскрыться?"
},
{ 
    english: "Close your eyes and feel into your body. What is it telling you about us right now?",
    russian: "Закрой глаза и почувствуй своё тело. Что оно говорит тебе о нас прямо сейчас?"
},
{ 
    english: "What does your intuition know about me that your mind hasn't caught up to yet?",
    russian: "Что твоя интуиция знает обо мне, до чего твой разум ещё не дошёл?"
},
{ 
    english: "If you could only trust your body's wisdom and not your thoughts, what would you do differently in this connection?",
    russian: "Если бы ты мог(ла) доверять только мудрости своего тела, а не своим мыслям, что бы ты делал(а) по-другому в этой связи?"
},
{ 
    english: "How do you stay connected to yourself when you're with me?",
    russian: "Как ты остаёшься в связи с собой, когда ты со мной?"
},
{ 
    english: "What do you need from solitude that you can't get from being together?",
    russian: "Что тебе нужно от одиночества, чего ты не можешь получить от того, чтобы быть вместе?"
},
{ 
    english: "Can you be alone while being with me? What does that feel like?",
    russian: "Можешь ли ты быть одиноким/одинокой, находясь со мной? Каково это?"
},
{ 
    english: "What are you feeling right now, in this exact moment, without referencing the past or future?",
    russian: "Что ты чувствуешь прямо сейчас, в этот точный момент, без ссылок на прошлое или будущее?"
},
{ 
    english: "If this moment between us was the last, what would you need from it?",
    russian: "Если бы этот момент между нами был последним, что тебе было бы нужно от него?"
},
{ 
    english: "What pulls you out of the present moment when we're together?",
    russian: "Что вытаскивает тебя из настоящего момента, когда мы вместе?"
},
{ 
    english: "What is the scariest thing you could tell me right now?",
    russian: "Что самое страшное ты мог(ла) бы мне сейчас сказать?"
},
{ 
    english: "What risk do you want to take with me but haven't yet?",
    russian: "Какой риск ты хочешь предпринять со мной, но ещё не предпринял(а)?"
},
{ 
    english: "Show me, without words, how you're feeling right now.",
    russian: "Покажи мне без слов, что ты сейчас чувствуешь."
},
{ 
    english: "What part of you are you most afraid I'll discover?",
    russian: "Какую часть себя ты больше всего боишься, что я открою?"
},
{ 
    english: "What would unconditional acceptance from me feel like in your body?",
    russian: "Каким было бы безусловное принятие от меня в твоём теле?"
},
{ 
    english: "Is there something about me that triggers you? Can you stay with that feeling instead of fixing it?",
    russian: "Есть ли что-то во мне, что тебя триггерит? Можешь ли ты остаться с этим чувством, вместо того чтобы исправлять его?"
},
{ 
    english: "What do you believe about yourself that might not be true? How does that belief shape what you notice and what you miss?",
    russian: "Во что ты веришь о себе, что может быть неправдой? Как эта вера формирует то, что ты замечаешь и что упускаешь?"
},
{ 
    english: "What story are you telling yourself about me? What might you be overlooking because of that story?",
    russian: "Какую историю ты рассказываешь себе обо мне? Что ты можешь упускать из-за этой истории?"
},
{ 
    english: "What patterns do you expect to see in relationships? How might those expectations shape what you notice and what you ignore?",
    russian: "Какие паттерны ты ожидаешь увидеть в отношениях? Как эти ожидания могут формировать то, что ты замечаешь и что игнорируешь?"
},
{ 
    english: "In moments of closeness, do you prefer to lead, to follow, or to flow back and forth? What does that feel like in your body?",
    russian: "В моменты близости ты предпочитаешь вести, следовать или переходить туда-сюда? Как это ощущается в твоём теле?"
},
{ 
    english: "When do you feel most alive - when you're directing the energy between us, or when you're surrendering to it?",
    russian: "Когда ты чувствуешь себя наиболее живым/живой - когда ты направляешь энергию между нами или когда ты сдаёшься ей?"
},
{ 
    english: "Do you prefer to pursue what you want, or to be pursued? What draws you to that?",
    russian: "Ты предпочитаешь преследовать то, что хочешь, или чтобы тебя преследовали? Что тебя привлекает в этом?"
},
{ 
    english: "When you think about connection, are you more drawn to initiating or to receiving initiative?",
    russian: "Когда ты думаешь о связи, тебя больше привлекает инициировать или принимать инициативу?"
},
{ 
    english: "Do you feel more yourself when you're holding space for someone, or when someone is holding space for you?",
    russian: "Ты больше чувствуешь себя собой, когда ты держишь пространство для кого-то, или когда кто-то держит пространство для тебя?"
},
{ 
    english: "What kind of presence do you want from a partner - more grounding and steady, or more open and receptive?",
    russian: "Какое присутствие ты хочешь от партнёра - более заземлённое и устойчивое, или более открытое и принимающее?"
},
{ 
    english: "Do you feel more energised by giving direction or by receiving it? Does that change depending on the context?",
    russian: "Тебе больше энергии даёт направлять или получать направление? Меняется ли это в зависимости от контекста?"
},
{ 
    english: "What kind of energy do you want to bring to connection - more structure or more flow, more initiation or more reception?",
    russian: "Какую энергию ты хочешь привнести в связь - больше структуры или больше потока, больше инициации или больше принятия?"
},
{ 
    english: "In a dance between two people, would you rather be the one creating the rhythm or moving with it?",
    russian: "В танце между двумя людьми ты бы предпочёл(ла) создавать ритм или двигаться с ним?"
},
{ 
    english: "What feels more natural to you - to penetrate into depth or to invite someone into your depth?",
    russian: "Что для тебя ощущается более естественным - проникать в глубину или приглашать кого-то в свою глубину?"
},
{ 
    english: "When it comes to decisions and direction in a relationship, do you energise by choosing the path or by trusting someone else's choice?",
    russian: "Когда дело доходит до решений и направления в отношениях, ты получаешь энергию от выбора пути или от доверия к чьему-то выбору?"
}
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