import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "./components/client"; // Adjust the path as necessary
import Login from "./components/Login";
import Main from "./Main";
import VotePage from "./components/VotePage";
import ThankYouForm from "./components/ThankYouForm";
import ElectionHold from "./components/ElectionHold";

function App() {
  const [authType, setAuthType] = useState(null); // 'admin' or 'user'
  const [isRunning, setIsRunning] = useState(null); // State to track isRunning value

  // Fetch the isRunning state from Supabase
  useEffect(() => {
    const fetchTimerState = async () => {
      try {
        const { data, error } = await supabase
          .from("timerState")
          .select("isRunning")
          .single(); // Assuming a single-row table

        if (error) throw error;
        setIsRunning(data.isRunning);
      } catch (err) {
        console.error("Error fetching timer state:", err.message);
      }
    };

    fetchTimerState();
  }, []);

  const handleLogout = () => {
    console.log("Logging out...");
    setAuthType(null);
  };

  console.log("Current authType:", authType, "isRunning:", isRunning);

  if (isRunning === null) {
    // Display a loading state while fetching isRunning
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              authType ? (
                <Navigate
                  to={
                    authType === "admin"
                      ? "/main"
                      : isRunning
                      ? "/vote"
                      : "/election-hold"
                  }
                  replace
                />
              ) : (
                <Login setAuthType={setAuthType} />
              )
            }
          />

          <Route
            path="/main"
            element={
              authType === "admin" ? (
                <Main onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/vote"
            element={
              authType === "user" && isRunning ? (
                <VotePage setAuthType={setAuthType} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/election-hold"
            element={
              authType === "user" && !isRunning ? (
                <ElectionHold setAuthType={setAuthType} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/thank-you"
            element={<ThankYouForm setAuthType={setAuthType} />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
