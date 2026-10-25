
export default function App() {
  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "Segoe UI, sans-serif"
      }}
    >
      <h1>Study Companion</h1>

      <p>Welcome to your desktop study application!</p>

      <h2>Features</h2>

      <ul>
        <li>🐱 Desktop Pet</li>
        <li>📚 School Timetable</li>
        <li>✅ Assignments & Exams</li>
        <li>📅 Calendar</li>
        <li>⏱️ Focus Timer</li>
        <li>⚙️ Settings</li>
      </ul>

      <button onClick={() => alert("Hello!")}>
        Click Me
      </button>
    </div>
  );
}
