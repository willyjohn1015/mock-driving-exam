import React, { useEffect, useState } from "react";

function App() {
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState([]);
  const EXAM_TIME = 60 * 60; // 1 hour in seconds
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME);

  useEffect(() => {
    if (!loggedIn || finished) return; // only run during exam

    if (timeLeft === 0) {
      setFinished(true); // auto-submit when time is up
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loggedIn, finished]);

  // --------------------------
  // Load Users from XML
  // --------------------------
  useEffect(() => {
    fetch("/users.xml")
      .then((res) => res.text())
      .then((xmlText) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "text/xml");

        const userNodes = xml.getElementsByTagName("user");
        const parsedUsers = [];

        for (let user of userNodes) {
          parsedUsers.push({
            username: user.getElementsByTagName("username")[0].textContent,
            password: user.getElementsByTagName("password")[0].textContent,
          });
        }

        setUsers(parsedUsers);
      });
  }, []);

  // --------------------------
  // Shuffle Function
  // --------------------------
  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // --------------------------
  // Load Questions from XML
  // --------------------------
  useEffect(() => {
    fetch("/questions.xml")
      .then((res) => res.text())
      .then((xmlText) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "text/xml");

        const questionNodes = xml.getElementsByTagName("question");
        const parsedQuestions = [];

        for (let q of questionNodes) {
          const textNode = q.getElementsByTagName("text")[0];
          const answerNode = q.getElementsByTagName("answer")[0];
          const pictureNode = q.getElementsByTagName("picture")[0];

          if (!textNode || !answerNode) continue;

          const options = Array.from(q.getElementsByTagName("option")).map(
            (o) => o.textContent,
          );

          parsedQuestions.push({
            question: textNode.textContent,
            options,
            answer: answerNode.textContent,
            picture: pictureNode ? pictureNode.textContent : "",
          });
        }

        setQuestions(shuffleArray(parsedQuestions));
      });
  }, []);

  // --------------------------
  // Handle Login
  // --------------------------
  const handleLogin = () => {
    const valid = users.find(
      (u) => u.username === username && u.password === password,
    );

    if (valid) {
      setLoggedIn(true);
    } else {
      alert("Invalid login");
    }
  };

  // --------------------------
  // Handle Answer
  // --------------------------
  const handleAnswer = (option) => {
    setAnswers([
      ...answers,
      {
        question: questions[current].question,
        selected: option,
        correct: questions[current].answer,
        picture: questions[current].picture,
      },
    ]);

    if (option === questions[current].answer) {
      setScore(score + 1);
    }

    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setFinished(true);
    }
  };

  // --------------------------
  // Login Page
  // --------------------------
  if (!loggedIn) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center bg-primary text-white">
        <div className="card p-4 shadow" style={{ minWidth: "320px" }}>
          <h2 className="text-center mb-4">Driving Exam Login</h2>
          <input
            className="form-control mb-3"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="form-control mb-3"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn btn-dark w-100" onClick={handleLogin}>
            Login
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (questions.length === 0) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center bg-primary text-white">
        <p>Loading questions...</p>
      </div>
    );
  }

  
  if (finished) {
    // Finished Page
  // Map all questions to include unanswered ones
const allAnswers = questions.map((q) => {
  const answered = answers.find((a) => a.question === q.question);
  return answered || {
    question: q.question,
    selected: "No answer",
    correct: q.answer,
    picture: q.picture,
  };
});

// Calculate score based on all answers
const finalScore = allAnswers.filter((a) => a.selected === a.correct).length;
    const wrongAnswers = answers.filter((a) => a.selected !== a.correct);

    return (
      <div className="d-flex flex-column vh-100 align-items-center bg-primary text-white p-4 overflow-auto">
        <h2>Exam Finished</h2>
        <p>
  Your Score: {finalScore} / {questions.length}
</p>
<p className={`fs-4 fw-bold ${finalScore >= 2 ? "text-success" : "text-danger"}`}>
  {finalScore >= 2 ? "PASSED" : "FAILED"}
</p>

{allAnswers.map((a, i) => (
  <div key={i} className="card mb-3 p-3 text-dark">
    <p><strong>Q:</strong> {a.question}</p>

    {a.picture && (
      <div className="text-center mb-2">
        <img
          src={a.picture}
          alt="Question"
          className="img-fluid img-thumbnail w-50"
        />
      </div>
    )}

    <p><strong>Correct answer:</strong> {a.correct}</p>
    <p><strong>Your answer:</strong> {a.selected}</p>
  </div>
))}
      </div>
    );
  }

  // Exam Page
  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-primary text-white p-3">
      <div className="card p-4 shadow w-100" style={{ maxWidth: "500px" }}>
        <h2 className="mb-3 text-center">Theoretical Driving Exam</h2>
        <h5 className="text-danger text-center mb-2">
          Time Left: {Math.floor(timeLeft / 60)}:
          {(timeLeft % 60).toString().padStart(2, "0")}
        </h5>
        <p>{questions[current].question}</p>
        <p>{questions[current].question}</p>

        {questions[current].picture && (
          <div className="text-center mb-2">
            <img
              src={questions[current].picture}
              alt="Question"
              className="img-fluid img-thumbnail w-50"
            />
          </div>
        )}

        <div className="d-grid gap-2">
          {questions[current].options.map((opt, i) => (
            <button
              key={i}
              className="btn btn-dark"
              onClick={() => handleAnswer(opt)}
            >
              {opt}
            </button>
          ))}
        </div>

        <p className="mt-3 text-center text-muted">
          Question {current + 1} of {questions.length}
        </p>
      </div>
    </div>
  );
}

export default App;
