// 获取开始测验按钮的DOM元素
const nameForm = document.getElementById('name-form');
const nameInput = document.getElementById('name-input');
const startQuizButton = document.getElementById('start-quiz-btn');
const timeContainer = document.getElementById('time-container'); // 获取时间容器元素

let socket; // 定义socket变量
let countdownInterval; // 声明倒计时计时器变量
let correctAnswersCount = 0;

nameForm.addEventListener('submit', function(event) {
    event.preventDefault(); // 阻止表单默认提交行为
    const userName = nameInput.value.trim(); // 获取用户输入的名字
    nameInput.disabled = true;
    document.getElementById('prompt').innerHTML=`Hello！${userName}`

    if (userName) { // 如果用户输入了名字
        // 初始化socket连接
        socket = io();

        // 将用户的名字发送到服务器
        socket.emit('userName', userName);

        // 监听测验开始 
        socket.on('connect', () => {
            console.log('Connected to the server');
            startQuizButton.disabled = true; // 禁用按钮
            startQuizButton.innerText = 'Quiz started.'; // 更改按钮文本
            const quizContainer = document.getElementById('quiz-container');
            quizContainer.style.opacity = '1'; // 将 opacity 设置为 1
            const buttonContainer = document.getElementById('button-container');
            buttonContainer.style.opacity = '1';
            const timeContainer = document.getElementById('time-container');
            timeContainer.style.opacity = '1';
            document.getElementById('score-container').style.opacity='1';
            document.getElementById('score-container').style.margin='20px auto';
            document.getElementById('score-container').style.padding='20px';
            socket.emit('startQuiz');
        });

        // 监听测验题目
        socket.on('question', (question) => {
            // 显示题目到页面
            const quizContainer = document.getElementById('quiz-container');
            quizContainer.innerHTML = `<h2>${question.question}</h2>`;
            const buttonContainer = document.getElementById('button-container');
            buttonContainer.innerHTML = '';
            question.choices.forEach((choice, index) => {
                buttonContainer.innerHTML += `<button onclick="submitAnswer(${index})">${choice}</button>`;
            });

            // 显示倒计时
            startCountdown(15);
        });

        // 监听测验结果
        socket.on('result', (isCorrect) => {
            // 显示结果到页面
            const quizContainer = document.getElementById('quiz-container');
            if (isCorrect) {
                correctAnswersCount++;
                document.getElementById('score-container').innerText = `Correct：${correctAnswersCount}`;
                quizContainer.innerHTML = "<p>Your Anwser is correct！</p>";
            } else {
                quizContainer.innerHTML = "<p>Sorry, The anwser is incorrect.</p>";
            }

            // 显示下一题按钮
            const buttonContainer = document.getElementById('button-container');
            buttonContainer.innerHTML = '<button onclick="nextQuestion()">Next!</button>';

            // 停止倒计时
            clearInterval(countdownInterval);
        });

        // 监听测验结束
        socket.on('quizEnd', () => {
            // 显示测验结束信息
            // socket.emit('endQuiz', { username: userName, correctAnswers: correctAnswersCount });
            const quizContainer = document.getElementById('quiz-container');
            quizContainer.innerHTML = "<h2>Quiz End！</h2>";
            document.getElementById('time-container').innerText = `Correct：${correctAnswersCount}`;
            document.getElementById('button-container').style.opacity = '0';

            // 停止倒计时
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
                        <th>Time (ms)</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>`;
            const leaderboardData = fetch('/leaderboard') // 发起GET请求到/leaderboard接口
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json(); // 解析JSON数据
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
            
                    // 使用setTimeout逐个显示每一行
                    setTimeout(() => {
                        row.classList.add('show');
                    }, index * 500); // 每行间隔500ms显示
                });; // 显示排行榜数据
            })
            .catch(error => {
                console.error('Fetching leaderboard failed:', error);
            });;
        
            const tbody = document.querySelector('#leaderboard tbody');
        
            

        });

        // 开始倒计时
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
                    // 发送到服务器，时间已到，需要进入下一题或结束测验
                    socket.emit('timeUp');
                    socket.emit('nextQuestion',{ username: userName, correctAnswers: correctAnswersCount })
                } else {
                    timeContainer.innerHTML = `<p>Time left：${timer}sec</p>`;
                }
            }, 1000);
        }

        async function SleepCountdown(seconds) {
            let timer = seconds;
            countdownInterval = setInterval(() => {
                timer--;
                if (timer < 1) {
                    clearInterval(countdownInterval);
                    timeContainer.innerHTML = "<p>时间到！</p>";
                    timer--;           
                } else {
                    timeContainer.innerHTML = `<p>剩余时间：${timer}秒</p>`;
                }
            }, 1000);
        }


        window.submitAnswer = function(index) {
            socket.emit('answer', index); // 将选择的答案发送到服务器
        }

        window.nextQuestion = function() {
            // 请求下一题
            socket.emit('nextQuestion',{ username: userName, correctAnswers: correctAnswersCount });
            // 清除之前的倒计时计时器
            clearInterval(countdownInterval);
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
