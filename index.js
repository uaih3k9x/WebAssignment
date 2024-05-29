const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 静态文件服务
app.use(express.static('public'));

// 测验题目数据
const quizQuestions = [
    { id: 1, question: "What is 2 + 2?", choices: ["A) 2", "B) 3", "C) 4", "D) 5"], correctAnswer: "C) 4" },
    // ... 添加更多题目
];

// 测验逻辑
io.on('connection', (socket) => {
    console.log('New client connected');
    const startTime = Date.now();

    // 发送测验题目
    socket.on('startQuiz', () => {
        let currentQuestion = 0;
        const questionInterval = setInterval(() => {
            if (currentQuestion < quizQuestions.length) {
                io.to(socket.id).emit('question', quizQuestions[currentQuestion]);
                currentQuestion++;
            } else {
                clearInterval(questionInterval);
                io.to(socket.id).emit('quizEnd');
            }
        }, 3000); // 每30秒显示一个问题

        // 当用户回答问题
        socket.on('answer', (data) => {
            // 检查答案逻辑
            const isCorrect = data.choice === quizQuestions[currentQuestion - 1].correctAnswer;
            io.to(socket.id).emit('result', isCorrect);
        });

        // 当测验结束
        socket.on('endQuiz', () => {
            clearInterval(questionInterval);
            socket.emit('quizEnd');
        });
    });

    socket.on('disconnect', () => {
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        console.log(`Client disconnected. Total communication time: ${totalTime}ms`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});