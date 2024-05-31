# JC2503 Web Application Development

50087391 Ruijie Wan

## Directory Structure

-  WebAssignment
    - node_modules
        - some nodejs modules
    - public
        - font
            - some static font files
        - img
            - static images
        - about.html
        - about.style.css
        - index.html
        - index.style.css
        - quiz.html
        - quiz.js
        - quiz.style.css
    - index.js
    - leaderboard.json
    - package.json
    - package-lock.json
    - readme.md


## Core Files and Functionality

### index.js (Server Configuration and Quiz Backend Logic)
- This Javascript initializes an Express server and integrates Socket.IO for real-time communication.
- Serves static files from the `public` directory.
- Manages quiz questions and user interactions through websocket events.
- Handles leaderboard data with functions to save and load user scores.

### leaderboard.json (Leaderboard Data)
- This JSON file that stores an array of user scores, including username, number of correct answers, and time taken.
- This JSON is sorted so it can directly load it as the leaderboard.

### about.html (About Page)
- An HTML page providing personal information about myself.
- I used SourceHanSerif_Bold and Light for a solemn view.

### about.style.css (Styles for About Page)
- CSS styles for the `about.html` page, including background gradients, font faces, and animations.

### index.html (Home Page)
- The landing page of the web application with navigation links to the about page and quiz page.
- Elegant-Blackbody font are used to provide a retro-game style view

### index.style.css (Styles for Home Page)
- CSS styles for the home page, including background images and animations.

### quiz.html (Quiz Page)
- HTML structure for the quiz page where users can participate in the quiz.
- Most of the work are in the CSS and the JS file, to update the elements real-time.

### quiz.style.css (Styles for Quiz Page)
- CSS styles for the `quiz.html` page, including background images, font faces, and animations.

### quiz.js (Client-Side Quiz Logic)
- Manages the client-side logic of the quiz, including form submission, starting the quiz, submitting answers, and handle the updating of the elements.

### socket.io
#### Server side
- `io.on('connection', (socket) => {...})`: Triggered when a new client connects.
- `socket.on('userName', (name) => {...})`: Listens for a username from the client.
- `socket.on('startQuiz', () => {...})`: Listens for a request to start the quiz.
- `socket.on('nextQuestion', (UCjson) => {...})`: Listens for a request for the next question.
- `socket.on('answer', (data) => {...})`: Listens for an answer submission from the client.
- `socket.on('endQuiz', (UCjson) => {...})`: Listens for a request to end the quiz.
- `socket.on('disconnect', () => {...})`: Listens for client disconnection.

#### Client Side
- `socket.on('connect', () => {...})`: Listen for start.
- `socket.emit('userName',userName);`: emit the username to the server.
- `socket.on('question', (question) => {})`:Listen for next question.
- `socket.on('result', (isCorrect) =>{})`:Listen for the result and then render the result.
- `socket.on('quizEnd', (statistics) => {})`: Listen for the end of the quiz and then update the elements.
- `socket.emit('answer', index)`:Submit the answer
- `socket.emit('nextQuestion',{ username: userName, correctAnswers: correctAnswersCount });` submit the user details for statistic and ask for next question
## Additional Infomation

### CSS Tricks and UI design.
- In the whole assignment application, the fadeIn is implemented and used in most of the elements.

```css
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.fadeIn {
    opacity: 0;
    animation: fadeIn 0.5s ease forwards;
}
```

this keyframe animation will make an element fadeIn which will make the whole webpage more smooth.

- I used some icons from FlatIcon, made the index page seems better.

### Color design.
- I used Adobe Color for color matching and used the low-brightness colors, which made the UI Sophistication: Dark or low brightness color schemes often convey a sense of luxury and professionalism, which is popular in many modern and tech-savvy designs.


### Challenges.
- The most of the challenge that I faced is the frontend UI design. I'm not very skilled in the css and html design. I tried many times to make the animation for the opacity and the transitionY. I used the skill that I learned when I'm learning the video editing and VFX. I think I've made the best view that I can do.

- I tried to design the backend in the http request way, And I'm confused if I need to use the socket because I think it may be harder to maintain a 'state machine'. But the socket is familiar with the http, I can easily design what to response in a specific request. So finally I switched to the socket IO in the quiz logic, But I kept the leaderboard as a http API for further work like if we need to show the leaderboard as the default view of the quiz page.


---
Thank for your review, That is all of my work.

