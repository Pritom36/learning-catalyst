let currentPracticeIndex = 0;
let currentExamIndex = 0;
let filteredCards = [];
let currentSet = [];
let reviewedCards = new Set();
let progress = 0;
let currentPage = 1;
const cardsPerPage = 6; // Number of flashcards per page
let correctAnswers = 0;
let incorrectAnswers = 0;
let incorrectFlashcards = [];
let examType = "meaning"; // Default exam type

let flashcardsData = [];
let allFlashcards = [];

const authUser = JSON.parse(localStorage.getItem('authUser')) || { noAds: false };

// Load the JSON file
fetch('flashcardsData.json')
    .then(response => response.json())
    .then(data => {
        flashcardsData = data;
        allFlashcards = flashcardsData.sets.flatMap(set => set.cards);
        renderFlashcards(allFlashcards); // Render the flashcards after loading
    })
    .catch(error => console.error('Error loading flashcards data:', error));

// Render flashcards with pagination
function renderFlashcards(cards, page = 1) {
    const container = document.getElementById('flashcardsContainer');
    container.innerHTML = '';

    const start = (page - 1) * cardsPerPage;
    const end = start + cardsPerPage;
    const paginatedCards = cards.slice(start, end);

    paginatedCards.forEach((card) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'col';
        cardElement.innerHTML = `
            <div class="card bg-white p-4 rounded-lg shadow">
                <h3 class="text-xl font-bold mb-2">${card.word}</h3>
                <p><strong>Example:</strong> ${card.example}</p>
                <p><strong>Meaning:</strong> ${card.meaning}</p>
                <p><strong>Synonym:</strong> ${card.synonym}</p>
                <p><strong>Antonym:</strong> ${card.antonym}</p>
                <div class="flex gap-2 mt-2">
                    <button onclick="playAudio('${card.word}')" class="bg-blue-400 text-white px-3 py-1 rounded">▶️</button>
                </div>
            </div>
        `;
        container.appendChild(cardElement);
    });

    renderPagination(cards, page);
}

// Render pagination buttons
function renderPagination(cards, currentPage) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    const totalPages = Math.ceil(cards.length / cardsPerPage);

    const createButton = (text, page) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'pagination-button';
        if (page === currentPage) {
            button.classList.add('active');
        }
        // Add the showRewardAd logic here
        button.addEventListener('click', () => {
            showRewardAd(() => {
                renderFlashcards(cards, page);
            });
        });
        return button;
    };

    // Previous button with ad logic
    if (currentPage > 1) {
        const prevButton = createButton('Previous', currentPage - 1);
        paginationContainer.appendChild(prevButton);
    }

    // Numbered buttons with ad logic
    for (let i = 1; i <= totalPages; i++) {
        const button = createButton(i, i);
        paginationContainer.appendChild(button);
    }

    // Next button with ad logic
    if (currentPage < totalPages) {
        const nextButton = createButton('Next', currentPage + 1);
        paginationContainer.appendChild(nextButton);
    }
}

// Add CSS for pagination
const style = document.createElement('style');
style.innerHTML = `
    .pagination-button {
        margin: 0 5px;
        padding: 8px 16px;
        border: none;
        background-color: #f0f0f0;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.3s;
    }
    .pagination-button:hover {
        background-color: #d0d0d0;
    }
    .pagination-button.active {
        background-color: #007bff;
        color: white;
    }
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 20px;
    }
`;
document.head.appendChild(style);

// Initialize female voice
let femaleVoice = null;
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        femaleVoice = voices.find(voice => 
            voice.name.includes('female') || 
            voice.name.includes('Female') || 
            voice.name.includes('Samantha') ||
            voice.name.includes('Microsoft Zira'));
    };
}

// Play audio for a word using Web Speech API
function playAudio(word) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        
        if (femaleVoice) {
            utterance.voice = femaleVoice;
        }
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Your browser does not support text-to-speech. Please use Chrome, Firefox, or Edge.");
    }
}
// Toggle card flip
function toggleFlip(button) {
    const flashcard = button.closest('.flashcard');
    flashcard.classList.toggle('flipped');
}

// Start practice session
function startPractice() {
    if (allFlashcards.length === 0) {
        alert('Flashcards data is still loading. Please wait.');
        return;
    }
    document.getElementById('homeSection').style.display = 'none';
    document.getElementById('practiceSection').style.display = 'block';
    filteredCards = currentSet.length > 0 ? [...currentSet] : [...allFlashcards];
    currentPracticeIndex = 0;
    showPracticeCard();
}

// Show the current practice card
function showPracticeCard() {
    const container = document.getElementById('currentCard');
    const card = filteredCards[currentPracticeIndex];
    reviewedCards.add(card.word); // Track viewed cards
    updateProgress(); // Update progress bar
    
    container.innerHTML = `
        <div class="flashcard">
            <div class="flashcard-inner">
                <div class="flashcard-front bg-white">
                    <h3 class="text-xl font-bold mb-2">${card.word}</h3>
                    <div class="hint-message" id="practice-hint"></div>
                    <div class="flex gap-2 mt-auto">
                        <button onclick="showPracticeHint('${card.example}')" class="bg-blue-400 text-white px-3 py-1 rounded">💡</button>
                        <button onclick="toggleFlip(this)" class="bg-green-500 text-white px-3 py-1 rounded">Reveal</button>
                        <button onclick="playAudio('${card.word}')" class="bg-blue-400 text-white px-3 py-1 rounded">▶️</button>
                    </div>
                </div>
                <div class="flashcard-back bg-blue-50">
                    <p><strong>Meaning:</strong> ${card.meaning}</p>
                    <p><strong>Synonym:</strong> ${card.synonym}</p>
                    <p><strong>Antonym:</strong> ${card.antonym}</p>
                    <button onclick="toggleFlip(this)" class="bg-red-500 text-white px-3 py-1 rounded mt-2">Front</button>
                </div>
            </div>
        </div>
    `;
}

// Show a hint for the current practice card
function showPracticeHint(example) {
    const hintElement = document.getElementById('practice-hint');
    hintElement.textContent = `Example: ${example}`;
}

// Shuffle the cards for practice
function shuffleCards() {
    filteredCards.sort(() => Math.random() - 0.5);
    currentPracticeIndex = 0;
    showPracticeCard();
}

// Update progress bar
function updateProgress() {
    progress = (reviewedCards.size / allFlashcards.length) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

// Show available sets
function showSets() {
    if (flashcardsData.sets.length === 0) {
        alert('Flashcards data is still loading. Please wait.');
        return;
    }
    document.getElementById('homeSection').style.display = 'none';
    document.getElementById('setsContainer').style.display = 'block';
    const setsList = document.getElementById('setsList');
    setsList.innerHTML = '';
    
    flashcardsData.sets.forEach((set, index) => {
        const setElement = document.createElement('div');
        setElement.className = 'col';
        setElement.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-xl font-bold mb-2">${set.name}</h3>
                <button onclick="loadSet(${index})" class="bg-blue-500 text-white px-4 py-2 rounded-lg">📥</button>
            </div>
        `;
        setsList.appendChild(setElement);
    });
}

// Load a specific set
function loadSet(index) {
    currentSet = [...flashcardsData.sets[index].cards];
    startPractice();
}

// Start exam session
function startExam() {
    if (allFlashcards.length === 0) {
        alert('Flashcards data is still loading. Please wait.');
        return;
    }
    document.getElementById('homeSection').style.display = 'none';
    document.getElementById('examSection').style.display = 'block';
    document.getElementById('examResult').style.display = 'none';
    filteredCards = currentSet.length > 0 ? [...currentSet] : [...allFlashcards];
    currentExamIndex = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    incorrectFlashcards = [];
    examType = document.getElementById('examType').value;
    updateInputFields();
    showExamCard();
}

// Update input fields based on exam type
function updateInputFields() {
    const singleInput = document.getElementById('singleInput');
    const combinedInputs = document.getElementById('combinedInputs');
    if (examType === "combined") {
        singleInput.style.display = "none";
        combinedInputs.style.display = "block";
    } else {
        singleInput.style.display = "block";
        combinedInputs.style.display = "none";
    }
}

// Show the current exam card
function showExamCard() {
    const container = document.getElementById('examCard');
    const card = filteredCards[currentExamIndex];
    
    container.innerHTML = `
        <div class="flashcard">
            <div class="flashcard-inner">
                <div class="flashcard-front bg-white">
                    <h3 class="text-xl font-bold mb-2">${card.word}</h3>
                    <div class="hint-message" id="exam-hint"></div>
                </div>
                <div class="flashcard-back bg-blue-50">
                    <p><strong>Meaning:</strong> ${card.meaning}</p>
                    <p><strong>Synonym:</strong> ${card.synonym}</p>
                    <p><strong>Antonym:</strong> ${card.antonym}</p>
                </div>
            </div>
        </div>
    `;
}

// Shuffle the cards for exam
function shuffleCards2() {
    filteredCards.sort(() => Math.random() - 0.5);
    currentExamIndex = 0;
    showExamCard();
}

// Check the user's answer
function checkAnswer() {
    const card = filteredCards[currentExamIndex];
    let isCorrect = false;

    if (examType === "combined") {
        const meaningInput = document.getElementById('meaningInput').value.trim().toLowerCase();
        const synonymInput = document.getElementById('synonymInput').value.trim().toLowerCase();
        const antonymInput = document.getElementById('antonymInput').value.trim().toLowerCase();

        const correctMeanings = card.meaning.toLowerCase().split(',').map(m => m.trim());
        const correctSynonyms = card.synonym.toLowerCase().split(',').map(s => s.trim());
        const correctAntonyms = card.antonym.toLowerCase().split(',').map(a => a.trim());

        if (correctMeanings.includes(meaningInput) && correctSynonyms.includes(synonymInput) && correctAntonyms.includes(antonymInput)) {
            isCorrect = true;
        }
    } else {
        const userAnswer = document.getElementById('answerInput').value.trim().toLowerCase();
        let correctAnswers;

        switch (examType) {
            case "meaning":
                correctAnswers = card.meaning.toLowerCase().split(',').map(m => m.trim());
                break;
            case "synonym":
                correctAnswers = card.synonym.toLowerCase().split(',').map(s => s.trim());
                break;
            case "antonym":
                correctAnswers = card.antonym.toLowerCase().split(',').map(a => a.trim());
                break;
        }

        isCorrect = correctAnswers.includes(userAnswer);
    }

    if (isCorrect) {
        correctAnswers++;
        alert("Correct!");
    } else {
        incorrectAnswers++;
        incorrectFlashcards.push(card);
        alert(`Incorrect! The correct answer is: ${card.meaning} (Meaning), ${card.synonym} (Synonym), ${card.antonym} (Antonym)`);
    }

    // Clear input fields
    if (examType === "combined") {
        document.getElementById('meaningInput').value = '';
        document.getElementById('synonymInput').value = '';
        document.getElementById('antonymInput').value = '';
    } else {
        document.getElementById('answerInput').value = '';
    }

    moveToNextCard();
}

// Move to the next card in the exam
function moveToNextCard() {
    if (currentExamIndex < filteredCards.length - 1) {
        currentExamIndex++;
        showExamCard();
    } else {
        endExam();
    }
}

// End the exam and show results
function endExam() {
    document.getElementById('examResult').style.display = 'block';
    document.getElementById('correctAnswers').textContent = correctAnswers;
    document.getElementById('incorrectAnswers').textContent = incorrectAnswers;

    const incorrectList = document.getElementById('incorrectList');
    incorrectList.innerHTML = '';
    incorrectFlashcards.forEach(card => {
        const li = document.createElement('li');
        li.textContent = `${card.word}: Meaning - ${card.meaning}, Synonym - ${card.synonym}, Antonym - ${card.antonym}`;
        incorrectList.appendChild(li);
    });
}

// Retry the exam
function retryExam() {
    document.getElementById('examResult').style.display = 'none';
    startExam();
}

// Go back to the home screen
function goHome() {
    document.getElementById('homeSection').style.display = 'block';
    document.getElementById('practiceSection').style.display = 'none';
    document.getElementById('setsContainer').style.display = 'none';
    document.getElementById('examSection').style.display = 'none';
    renderFlashcards(allFlashcards);
}

// Show feedback modal
function showFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

// Close feedback modal
function closeFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Show reward ad and handle reward logic
function showRewardAd(callback) {
    if (authUser.noAds) {
        // Skip ads for authenticated users
        callback();
        return;
    }

    // Show the Adsterra ad
    const adContainer = document.createElement('div');
    adContainer.id = 'adContainer';
    adContainer.style.position = 'fixed';
    adContainer.style.top = '0';
    adContainer.style.left = '0';
    adContainer.style.width = '100%';
    adContainer.style.height = '100%';
    adContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    adContainer.style.zIndex = '1000';
    adContainer.innerHTML = `
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
            <iframe src="${adsterraDirectLink}" width="300" height="250" frameborder="0" allowfullscreen></iframe>
        </div>
    `;
    document.body.appendChild(adContainer);

    // Simulate a 5-second ad duration
    setTimeout(() => {
        document.body.removeChild(adContainer);
        callback();
    }, 5000);
}

// Add logout function
function logout() {
    localStorage.removeItem('authUser');
    window.location.href = 'login.html';
}

// Event Listeners
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filteredCards = allFlashcards.filter(card => 
        card.word.toLowerCase().includes(searchTerm) ||
        card.meaning.toLowerCase().includes(searchTerm) ||
        card.synonym.toLowerCase().includes(searchTerm) ||
        card.antonym.toLowerCase().includes(searchTerm)
    );
    renderFlashcards(filteredCards);
});

document.getElementById('examBtn').addEventListener('click', () => {
    showRewardAd(startExam);
});

document.getElementById('setsBtn').addEventListener('click', () => {
    showRewardAd(showSets);
});

document.getElementById('homeBtn').addEventListener('click', () => {
    showRewardAd(goHome);
});

document.getElementById('homeBtn2').addEventListener('click', () => {
    showRewardAd(goHome);
});

document.getElementById('homeBtnExam').addEventListener('click', () => {
    showRewardAd(goHome);
});

document.getElementById('shuffleBtn').addEventListener('click', shuffleCards);
document.getElementById('shuffleBtn2').addEventListener('click', shuffleCards2);
document.getElementById('feedbackBtn').addEventListener('click', showFeedbackModal);
document.getElementById('closeFeedbackModal').addEventListener('click', closeFeedbackModal);

document.getElementById('submitAnswer').addEventListener('click', checkAnswer);
document.getElementById('nextCard2').addEventListener('click', moveToNextCard);
document.getElementById('prevCard2').addEventListener('click', () => {
    if (currentExamIndex > 0) {
        currentExamIndex--;
        showExamCard();
    }
});
document.getElementById('submitExam').addEventListener('click', endExam);
document.getElementById('retryExam').addEventListener('click', retryExam);

document.getElementById('examType').addEventListener('change', () => {
    examType = document.getElementById('examType').value;
    updateInputFields();
});

document.getElementById('nextCard').addEventListener('click', () => {
    if (currentPracticeIndex < filteredCards.length - 1) {
        currentPracticeIndex++;
        showPracticeCard();
    }
});

document.getElementById('prevCard').addEventListener('click', () => {
    if (currentPracticeIndex > 0) {
        currentPracticeIndex--;
        showPracticeCard();
    }
});

document.getElementById('logoutBtn').addEventListener('click', logout);


// Check for saved user preference, if any, on load of the website
if (localStorage.getItem('dark-mode') === 'true') {
    body.classList.add('dark-mode');
    darkModeToggle.textContent = '☀️';
}

// Save user preference in local storage
body.addEventListener('classlistchange', () => {
    localStorage.setItem('dark-mode', body.classList.contains('dark-mode'));
});

// Initial render
renderFlashcards(allFlashcards);