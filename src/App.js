import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Main from "./Main";
import VotePage from "./components/VotePage";
import ThankYouForm from "./components/ThankYouForm";
import ElectionHold from "./components/ElectionHold"; 

import { supabase } from "./components/client";

function App() {
  const [authType, setAuthType] = useState(null); 
  const [redirectTo, setRedirectTo] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthType(null);
  };
  

  useEffect(() => {
    const checkUserAndTimerState = async () => {
      if (authType === "user") {
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) {
            setIsLoading(false);
            return;
          }

          if (userData) {
            const { data: timerData, error: timerError } = await supabase
              .from("timerState")
              .select("isRunning")
              .eq("id", 1)
              .single();

            if (timerError) {
              setIsLoading(false);
              return;
            }

            if (timerData?.isRunning === 0) {
              setRedirectTo("/election-hold");
            } else if (timerData?.isRunning === 1) {
              setRedirectTo("/vote");
            }

            setIsLoading(false);
          }
        } catch (err) {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    checkUserAndTimerState(); 
  }, [authType]); 

  if (isLoading) {
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
                  to={redirectTo || (authType === "admin" ? "/main" : "/vote")}
                  replace
                />
              ) : (
                <Login setAuthType={setAuthType} key={authType} />
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
              authType === "user" ? (
                redirectTo === "/vote" ? (
                  <VotePage setAuthType={setAuthType} />
                ) : (
                  <Navigate to={redirectTo} replace />
                )
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/election-hold"
            element={<ElectionHold setAuthType={setAuthType} />}
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
