// Define the DOM element variables
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const startQuizButton = document.getElementById('start-quiz-btn');
const timeContainer = document.getElementById('time-container'); // Time Container

let socket;
let countdownInterval; // Global Variable for timer
let correctAnswersCount = 0;

nameForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const userName = nameInput.value.trim(); // 获取用户输入的名字
    nameInput.disabled = true;
    document.getElementById('prompt').innerHTML=`Hello！${userName}`// update the prompt to the

    if (userName) {
        // socket connection initialization
        socket = io();

        // send the username
        socket.emit('userName', userName);

        // server ask for start the quiz in frontend 
        socket.on('connect', () => {
            console.log('Connected to the server');
            startQuizButton.disabled = true; // disable the button
            startQuizButton.innerText = 'Quiz started.';
            const quizContainer = document.getElementById('quiz-container');
            quizContainer.style.opacity = '1'; // set the containers visible
            const buttonContainer = document.getElementById('button-container');
            buttonContainer.style.opacity = '1';
            const timeContainer = document.getElementById('time-container');
            timeContainer.style.opacity = '1';
            document.getElementById('score-container').style.opacity='1';
            document.getElementById('score-container').style.margin='20px auto';
            document.getElementById('score-container').style.padding='20px';
            socket.emit('startQuiz');
        });

        // if an question was sent by the server
        socket.on('question', (question) => {
            // render the question
            const quizContainer = document.getElementById('quiz-container');
            quizContainer.innerHTML = `<h2>${question.question}</h2>`;
            const buttonContainer = document.getElementById('button-container');
            buttonContainer.innerHTML = '';
            question.choices.forEach((choice, index) => {
                buttonContainer.innerHTML += `<button onclick="submitAnswer(${index})">${choice}</button>`;
            });

            // start a timer
            startCountdown(15);
        });

        // wait the server fot the result.
        socket.on('result', (isCorrect) => {
            // render
            const quizContainer = document.getElementById('quiz-container');
            if (isCorrect) {
                // update the correct number.
                correctAnswersCount++;
                document.getElementById('score-container').innerText = `Correct：${correctAnswersCount}`;
                quizContainer.innerHTML = "<p>Your Anwser is correct！</p>";
            } else {
                quizContainer.innerHTML = "<p>Sorry, The anwser is incorrect.</p>";
            }

            // next question
            const buttonContainer = document.getElementById('button-container');
            buttonContainer.innerHTML = '<button onclick="nextQuestion()">Next!</button>';

            // stop the countdown
            clearInterval(countdownInterval);
        });

        // if the server stop the quiz
        socket.on('quizEnd', (statistics) => {
            // render the info
            console.log(statistics)
            const quizContainer = document.getElementById('quiz-container');
            quizContainer.innerHTML = "<h2>Quiz End！</h2>";
            document.getElementById('prompt').innerHTML=`Congratulations！${userName}`
            document.getElementById('score-container').innerHTML=`Time Elapsed:${statistics.totalTime} Secs \n
            Correct：${correctAnswersCount} out of ${statistics.totalQuestion}`;
            document.getElementById('time-container').innerText = `Correct：${correctAnswersCount}`;
            document.getElementById('button-container').style.opacity = '0';

            // stop the countdown
            clearInterval(countdownInterval);
            SleepCountdown(3);
            document.getElementById('quiz-container').remove();
            document.getElementById('time-container').remove();
            document.getElementById('button-container').remove();
            document.getElementById('table-container1').style.opacity='1';
            document.getElementById('table-container1').innerHTML=`<h1>Leaderboard</h1>
            <table id="leaderboard">
                <thead>
                    <tr id='header'>
                        <th>Username</th>
                        <th>Correct Answers</th>
                        <th>Time (s)</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>`;
            const leaderboardData = fetch('/leaderboard') // fetch and render
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json(); // JSON parsing
            })
            .then(data => {
                data.forEach((user, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.username}</td>
                        <td>${user.correctAnswers}</td>
                        <td>${user.time}</td>
                    `;
                    tbody.appendChild(row);
            
                    // render one by one
                    setTimeout(() => {
                        row.classList.add('show');
                    }, index * 500);
                });; // render the leaderboard
            })
            .catch(error => {
                console.error('Fetching leaderboard failed:', error);
            });;
        
            const tbody = document.querySelector('#leaderboard tbody');
        
            

        });

        // countdown
        async function startCountdown(seconds) {
            let timer = seconds;
            const buttonContainer = document.getElementById('button-container');
            buttonContainer.style.opacity = '1';            
            timeContainer.innerHTML = `<p>Time left：${timer}sec</p>`;
            countdownInterval = setInterval(() => {
                timer--;
                if (timer < 1) {
                    clearInterval(countdownInterval);
                    timeContainer.innerHTML = "<p>Time's UP!</p>";
                    timer--;
                    // emit the timeup and ask for next question
                    socket.emit('timeUp');
                    socket.emit('nextQuestion',{ username: userName, correctAnswers: correctAnswersCount })
                } else {
                    timeContainer.innerHTML = `<p>Time left：${timer}sec</p>`;
                }
            }, 1000);
        }

        // Sleep function, to make the web page more smooth.
        async function SleepCountdown(seconds) {
            let timer = seconds;
            countdownInterval = setInterval(() => {
                timer--;
                if (timer < 1) {
                    clearInterval(countdownInterval);
                    timeContainer.innerHTML = "<p>Time's UP！</p>";
                    timer--;           
                } else {
                    timeContainer.innerHTML = `<p>Time left：${timer}sec</p>`;
                }
            }, 1000);
        }


        window.submitAnswer = function(index) {
            socket.emit('answer', index); // send the anwser
        }

        window.nextQuestion = function() {
            // ask for next question
            socket.emit('nextQuestion',{ username: userName, correctAnswers: correctAnswersCount });
            clearInterval(countdownInterval);
        }
    } else {
        alert('Please enter your name！');
    }
});

// click event listensr.
startQuizButton.addEventListener('click', function() {
    socket.emit('startQuiz');
    startQuizButton.disabled = true;
});
