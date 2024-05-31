const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const fs = require('fs');
const path = require('path');
const leaderboardFilePath = path.join(__dirname, 'leaderboard.json');



// save leaderboard
function saveLeaderboard(leaderboard) {
    fs.writeFileSync(leaderboardFilePath, JSON.stringify(leaderboard));
}

// static pages
app.use(express.static('public'));


function loadLeaderboard() {
    try {
        users = fs.readFileSync(leaderboardFilePath);
        return JSON.parse(users);
    } catch (error) {
        return []; // return a empty array
    }
}
const leaderboard = loadLeaderboard();
// questions.
const quizQuestions = [
    { id: 1, question: "What is the sum of 5 and 7?", choices: ["A) 10", "B) 12", "C) 14", "D) 16"], correctAnswer: "B) 12" },
    { id: 2, question: "If a book has 30 pages and you read 5 pages each day, how many days will it take to finish the book?", choices: ["A) 5 days", "B) 6 days", "C) 7 days", "D) 8 days"], correctAnswer: "B) 6 days" },
    { id: 3, question: "What is the product of 4 and 9?", choices: ["A) 36", "B) 32", "C) 28", "D) 24"], correctAnswer: "A) 36" },
    { id: 4, question: "If you have 12 apples and give 3 to your friend, how many apples do you have left?", choices: ["A) 9", "B) 10", "C) 11", "D) 12"], correctAnswer: "A) 9" },
    { id: 5, question: "What is the difference between 18 and 9?", choices: ["A) 9", "B) 8", "C) 7", "D) 6"], correctAnswer: "A) 9" }
];

// quiz logic
io.on('connection', (socket) => {
    console.log('New client connected');
    let currentQuestion = 0;
    let startTime;
    let username;
    
    socket.on('userName',(name) => {
        username=name;
    })
    // send question
    socket.on('startQuiz', () => {
        console.log("Quiz started");
        currentQuestion = 0;
        startTime = Date.now(); // update
        if (currentQuestion < quizQuestions.length) {
            io.to(socket.id).emit('question', quizQuestions[currentQuestion]);
        }
    });

    // on next question
    socket.on('nextQuestion', (UCjson) => {
        currentQuestion++;
        if (currentQuestion < quizQuestions.length) {
            io.to(socket.id).emit('question', quizQuestions[currentQuestion]);
        } else {
            endTime = Date.now();
            username = UCjson.username;
            const correctAnswers = UCjson.correctAnswers; // record the correct number
            const totalTime = Math.floor((endTime - startTime)/1000);
            const totalQuestion = quizQuestions.length;
            io.to(socket.id).emit('quizEnd',{username,correctAnswers,totalTime,totalQuestion});
            recordUser(socket, username, correctAnswers,endTime,startTime);
        }
    });

    // on anwser
    socket.on('answer', (data) => {
        const currentQuestionIndex = currentQuestion;

        if (currentQuestionIndex >= 0 && currentQuestionIndex < quizQuestions.length) {
            const correctAnswerIndex = quizQuestions[currentQuestionIndex].choices.indexOf(quizQuestions[currentQuestionIndex].correctAnswer);
            const isCorrect = data === correctAnswerIndex;

            io.to(socket.id).emit('result', isCorrect);
        }
    });

    // on quiz end
    socket.on('endQuiz', (UCjson) => {
        endTime = Date.now();
        username = UCjson.username;
        const correctAnswers = UCjson.correctAnswers;
        const totalTime = Math.floor((endTime - startTime)/1000);
        socket.emit('quizEnd',{username,correctAnswers,totalTime});
        recordUser(socket, username, correctAnswers,endTime,startTime);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

function recordUser(socket, username, correctAnswers, endTime, startTime) {
    const totalTime = Math.floor((endTime - startTime)/1000);
    const newUser = { username, correctAnswers, time: totalTime };

    // check if exist
    const existingUserIndex = leaderboard.findIndex(user => user.username === username);

    if (existingUserIndex !== -1) {
        // update the info
        leaderboard[existingUserIndex] = newUser;
    } else {
        // add a new record
        leaderboard.push(newUser);
    }

    // sort algorithm
    leaderboard.sort((a, b) => {
        // sort the correct anwser
        if (a.correctAnswers !== b.correctAnswers) {
            return b.correctAnswers - a.correctAnswers; // correct more will be more frontier
        }
        // if correct the same
        if (a.time !== b.time) {
            return a.time - b.time; // less time frontier
        }
        // if the same sort by the username
        if (a.username.toLowerCase() < b.username.toLowerCase()) {
            return -1;
        } else if (a.username.toLowerCase() > b.username.toLowerCase()) {
            return 1;
        } else {
            return 0;
        }
    });

    saveLeaderboard(leaderboard); // save data
}


app.get('/leaderboard', (req, res) => {
    res.json(leaderboard);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
