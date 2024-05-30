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
        return []; // 如果文件不存在或读取出错，返回空数组
    }
}
const leaderboard = loadLeaderboard();
// 测验题目数据
const quizQuestions = [
    { id: 1, question: "What is 1 + 1?", choices: ["A) 2", "B) 3", "C) 4", "D) 5"], correctAnswer: "A) 2" },
    { id: 2, question: "What is an Ethernet Switch?", choices: ["A) Gaming Console?", "B) A device for network", "C) I don't know!", "D) I don't care!"], correctAnswer: "B) A device for network" },
    { id: 3, question: "Which planet is known as the Red Planet?", choices: ["A) Earth", "B) Mars", "C) Jupiter", "D) Saturn"], correctAnswer: "B) Mars" },
    { id: 4, question: "What is the largest ocean on Earth?", choices: ["A) Atlantic Ocean", "B) Indian Ocean", "C) Arctic Ocean", "D) Pacific Ocean"], correctAnswer: "D) Pacific Ocean" },
    { id: 5, question: "Who wrote 'Romeo and Juliet'?", choices: ["A) Charles Dickens", "B) Mark Twain", "C) William Shakespeare", "D) Jane Austen"], correctAnswer: "C) William Shakespeare" },
    { id: 6, question: "What is the smallest prime number?", choices: ["A) 0", "B) 1", "C) 2", "D) 3"], correctAnswer: "C) 2" },
    { id: 7, question: "In which year did the Titanic sink?", choices: ["A) 1912", "B) 1905", "C) 1898", "D) 1923"], correctAnswer: "A) 1912" },
    { id: 8, question: "What is the chemical symbol for gold?", choices: ["A) Au", "B) Ag", "C) Pb", "D) Hg"], correctAnswer: "A) Au" },
    { id: 9, question: "Who painted the Mona Lisa?", choices: ["A) Vincent van Gogh", "B) Pablo Picasso", "C) Leonardo da Vinci", "D) Michelangelo"], correctAnswer: "C) Leonardo da Vinci" },
    { id: 10, question: "What is the main ingredient in guacamole?", choices: ["A) Tomato", "B) Avocado", "C) Onion", "D) Pepper"], correctAnswer: "B) Avocado" }
];

// 测验逻辑
io.on('connection', (socket) => {
    console.log('New client connected');
    let currentQuestion = 0;
    let startTime = Date.now(); // 记录开始作答的时间
    let username;
    
    socket.on('userName',(name) => {
        username=name;
    })
    // 发送测验题目
    socket.on('startQuiz', () => {
        console.log("Quiz started");
        currentQuestion = 0;
        startTime = Date.now(); // 记录开始作答的时间
        if (currentQuestion < quizQuestions.length) {
            io.to(socket.id).emit('question', quizQuestions[currentQuestion]);
        }
    });

    // 当用户请求下一题
    socket.on('nextQuestion', (UCjson) => {
        currentQuestion++;
        if (currentQuestion < quizQuestions.length) {
            io.to(socket.id).emit('question', quizQuestions[currentQuestion]);
        } else {
            io.to(socket.id).emit('quizEnd');
            // recordUser(socket.id); // 记录用户信息和作答情况

            console.log(UCjson); // 需要从客户端获取用户名
            endTime = Date.now();
            username = UCjson.username;
            const correctAnswers = UCjson.correctAnswers; // 需要根据用户作答情况计算
            recordUser(socket, username, correctAnswers,endTime,startTime);
        }
    });

    // 当用户回答问题
    socket.on('answer', (data) => {
        const currentQuestionIndex = currentQuestion;

        if (currentQuestionIndex >= 0 && currentQuestionIndex < quizQuestions.length) {
            const correctAnswerIndex = quizQuestions[currentQuestionIndex].choices.indexOf(quizQuestions[currentQuestionIndex].correctAnswer);
            const isCorrect = data === correctAnswerIndex;

            io.to(socket.id).emit('result', isCorrect);

            // if (isCorrect) {
            //     // 如果回答正确，记录作答情况
            //     const endTime = Date.now();
            //     const totalTime = endTime - startTime; // 计算作答所用时间
            //     users.push({ username, time: totalTime });
            // }
        }
    });

    // 当测验结束
    socket.on('endQuiz', (UCjson) => {
        socket.emit('quizEnd');
        console.log(UCjson); // 需要从客户端获取用户名
        endTime = Date.now();
        username = UCjson.username;
        const correctAnswers = UCjson.correctAnswers; // 需要根据用户作答情况计算
        recordUser(socket, username, correctAnswers,endTime,startTime);
    });

    // 当时间到

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

function recordUser(socket, username, correctAnswers, endTime, startTime) {
    const totalTime = endTime - startTime; // 计算作答所用时间
    const newUser = { username, correctAnswers, time: totalTime };

    // 检查用户是否已存在于排行榜中
    const existingUserIndex = leaderboard.findIndex(user => user.username === username);

    if (existingUserIndex !== -1) {
        // 用户已存在，更新其信息
        leaderboard[existingUserIndex] = newUser;
    } else {
        // 用户不存在，添加新用户
        leaderboard.push(newUser);
    }

    // 根据答对题目数量和作答时间进行排序
    leaderboard.sort((a, b) => {
        // 首先按答对题目数量排序
        if (a.correctAnswers !== b.correctAnswers) {
            return b.correctAnswers - a.correctAnswers; // 答对数量多的排在前面
        }
        // 如果答对题目数量相同，则按作答时间排序
        if (a.time !== b.time) {
            return a.time - b.time; // 作答时间少的排在前面
        }
        // 如果作答时间和答对题目数量都相同，则按用户名字典序排序
        if (a.username.toLowerCase() < b.username.toLowerCase()) {
            return -1;
        } else if (a.username.toLowerCase() > b.username.toLowerCase()) {
            return 1;
        } else {
            return 0;
        }
    });

    saveLeaderboard(leaderboard); // 保存排行榜数据
}


// 返回排行榜
// 返回排行榜
app.get('/leaderboard', (req, res) => {
    // // 按照成绩优先、答对数量优先、作答时间更短优先的顺序排序
    // leaderboard.sort((a, b) => {
    //     if (a.time !== b.time) {
    //         return a.time - b.time; // 作答时间更短排在前面
    //     } else {
    //         // 如果作答时间相同，按照答对数量排序
    //         const correctAnswersA = leaderboard.filter(u => u.username === a.username).length;
    //         const correctAnswersB = leaderboard.filter(u => u.username === b.username).length;
    //         if (correctAnswersA !== correctAnswersB) {
    //             return correctAnswersB - correctAnswersA; // 答对数量多的排在前面
    //         } else {
    //             // 如果答对数量也相同，按照成绩优先，即 socket 连接时间早的排在前面
    //             return leaderboard.indexOf(a) - leaderboard.indexOf(b);
    //         }
    //     }
    // });

    res.json(leaderboard);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
