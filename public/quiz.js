// 获取开始测验按钮的DOM元素
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const startQuizButton = document.getElementById('start-quiz-btn');
// 初始时隐藏开始测验按钮
startQuizButton.style.display = 'none';

const questionTimeLimit = 15000; // 15秒转换为毫秒

let socket; // 定义socket变量

nameForm.addEventListener('submit', function(event) {
    event.preventDefault(); // 阻止表单默认提交行为
    const userName = nameInput.value.trim(); // 获取用户输入的名字

    if (userName) { // 如果用户输入了名字
        // 显示开始测验按钮
        startQuizButton.style.display = 'block';
        // 初始化socket连接
        socket = io();

        // 将用户的名字发送到服务器
        socket.emit('userName', userName);

        // 监听测验开始 
        socket.on('connect', () => {
            console.log('Connected to the server');
            socket.emit('startQuiz');
        });

        // 监听测验题目
        socket.on('question', (question) => {
            // 显示题目到页面
            const quizContainer = document.getElementById('quiz-container');
            quizContainer.innerHTML = `<h2>${question.question}</h2>`;
            question.choices.forEach(choice => {
                quizContainer.innerHTML += `<div>${choice}</div>`;
            });
        });

        // 监听测验结果
        socket.on('result', (isCorrect) => {
            // 显示结果到页面
            const quizContainer = document.getElementById('quiz-container');
            if (isCorrect) {
                quizContainer.innerHTML = "<p>你的答案是正确的！</p>";
            } else {
                quizContainer.innerHTML = "<p>你的答案是不正确的。</p>";
            }
        });

        // 监听测验结束
        socket.on('quizEnd', () => {
            // 显示测验结束信息
            const quizContainer = document.getElementById('quiz-container');
            quizContainer.innerHTML = "<h2>测验结束！</h2>";
        });

        // 显示倒计时
        function showCountdown(seconds, timeContainer) {
            let timer = seconds;
            const interval = setInterval(() => {
                timer--;
                timeContainer.innerHTML = `<p>剩余时间：${timer}秒</p>`;
                if (timer <= 0) {
                    clearInterval(interval);
                    timeContainer.innerHTML = "<p>时间到！</p>";
                    // 发送到服务器，时间已到，需要进入下一题或结束测验
                    socket.emit('timeUp');
                }
            }, 1000);
        }
    } else {
        alert('请输入你的名字！');
    }
});

// 添加点击事件监听器
startQuizButton.addEventListener('click', function() {
    // 发送开始测验的信号到服务器
    socket.emit('startQuiz');
    // 可以在这里添加额外的逻辑，比如禁用按钮或显示加载信息
    startQuizButton.disabled = true; // 禁用按钮
    startQuizButton.innerText = '测验已开始'; // 更改按钮文本
});
