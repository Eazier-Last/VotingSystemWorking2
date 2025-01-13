import React, { useState, useContext, useEffect, useRef } from "react";
import "../App.css";
// import { StateContext } from "../StateProvider";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import { BarChart } from "@mui/x-charts/BarChart";
import { supabase } from "./client";
import AvatarComponent from "./Avatar/AvatarComponent";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import emailjs from "@emailjs/browser";

const chartSetting = {
  xAxis: [
    {
      label: "Student Vote Percentage",
    },
  ],

  width: 675,
  height: 540,
};

function Home() {
  const [candidates, setCandidates] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [totalVoters, setTotalVoters] = useState(0);
  const [totalVoted, setTotalVoted] = useState(0);
  const [courseData, setCourseData] = useState([]);
  const [orderedPositions, setOrderedPositions] = useState([]);
  const [studentEmail, setStudentEmail] = useState("");

  const storedTimerState = JSON.parse(localStorage.getItem("timerState")) || {};
  const [time, setTime] = useState(
    storedTimerState.time || { days: 0, hours: 0, minutes: 0, seconds: 0 }
  );
  const [isRunning, setIsRunning] = useState(
    storedTimerState.isRunning || false
  );

  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchPositions = async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .order("position_order", { ascending: true });

      if (error) {
        console.error("Error fetching positions:", error);
        return;
      }

      setOrderedPositions(data.map((position) => position.positions));
    };

    fetchPositions();
  }, []);

  const form = useRef();

  const [allEmails, setAllEmails] = useState([]);

  useEffect(() => {
    const fetchAllEmails = async () => {
      const { data, error } = await supabase.from("users").select("gmail");

      if (error) {
        console.error("Error fetching user emails:", error);
        setAllEmails([]);
      } else {
        const emails = data.map((user) => user.gmail).filter((email) => email);
        setAllEmails(emails);
      }
    };

    fetchAllEmails();
  }, []);

  const sendEmail = async (e) => {
    e.preventDefault();

    const { data: users, error } = await supabase
      .from("users")
      .select("name, studentNumber, password, gmail");

    if (error) {
      console.error("Error fetching user details:", error);
      alert("Failed to fetch user details. Please try again later.");
      return;
    }

    if (!users || users.length === 0) {
      alert("No users found to send emails to.");
      return;
    }

    for (const user of users) {
      if (user.gmail) {
        try {
          await emailjs.send(
            "service_ffx6rwz",
            "template_171uqr7",
            {
              student_email: user.gmail,
              subject: form.current.subject.value,
              message: form.current.message.value.replace(
                /{name}|{studentNumber}|{password}/g,
                (match) => {
                  switch (match) {
                    case "{name}":
                      return user.name || "Student";
                    case "{studentNumber}":
                      return user.studentNumber || "N/A";
                    case "{password}":
                      return user.password || "N/A";
                    default:
                      return match;
                  }
                }
              ),
            },
            "DFxzih1aS0PB7dD9M"
          );

          console.log(`Email sent successfully to ${user.gmail}`);
        } catch (error) {
          console.error(`Failed to send email to ${user.gmail}:`, error.text);
        }
      }
    }

    alert("Emails have been sent to all users.");
  };

  useEffect(() => {
    const fetchUserEmail = async () => {
      const studentNumber = "12345";
      const { data, error } = await supabase
        .from("users")
        .select("gmail")
        .eq("studentNumber", studentNumber)
        .single();

      if (error) {
        console.error("Error fetching user email:", error);
        setStudentEmail("");
      } else {
        setStudentEmail(data.gmail);
      }
    };

    fetchUserEmail();
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          const totalSeconds =
            prevTime.days * 86400 +
            prevTime.hours * 3600 +
            prevTime.minutes * 60 +
            prevTime.seconds;

          if (totalSeconds <= -10) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            return { days: 10, hours: 10, minutes: 10, seconds: 0 };
          }

          const newTotalSeconds = totalSeconds - 0;
          const newDays = Math.floor(newTotalSeconds / 86400);
          const newHours = Math.floor((newTotalSeconds % 86400) / 3600);
          const newMinutes = Math.floor((newTotalSeconds % 3600) / 60);
          const newSeconds = newTotalSeconds % 60;

          return {
            days: newDays,
            hours: newHours,
            minutes: newMinutes,
            seconds: newSeconds,
          };
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    localStorage.setItem("timerState", JSON.stringify({ time, isRunning }));
  }, [time, isRunning]);

  useEffect(() => {
    const fetchTimerState = async () => {
      const { data, error } = await supabase
        .from("timerState")
        .select("*")
        .single();

      if (error) {
        console.error("Error updating timer state (START):", error);
      } else {
        console.log("Timer state updated to START in Supabase", data);

        return;
      }

      if (data) {
        console.log("Fetched timer state:", data);
        setTime({
          days: data.days,
          hours: data.hours,
          minutes: data.minutes,
          seconds: data.seconds,
        });
        setIsRunning(data.isRunning);
      }
    };

    fetchTimerState();
  }, []);

  useEffect(() => {
    const fetchVoterStats = async () => {
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("voteStatus, course");
      if (userError) {
        console.error("Error fetching user data:", userError);
        return;
      }

      const totalUsers = users.length;
      const votedUsers = users.filter(
        (user) => user.voteStatus === "voted"
      ).length;

      setTotalVoters(totalUsers);
      setTotalVoted(votedUsers);

      const courseVoteCounts = users.reduce((acc, user) => {
        const course = user.course || "Unknown";
        acc[course] = acc[course] || { total: 0, voted: 0 };
        acc[course].total += 1;
        if (user.voteStatus === "voted") {
          acc[course].voted += 1;
        }
        return acc;
      }, {});

      const formattedData = Object.entries(courseVoteCounts).map(
        ([course, counts]) => ({
          course,
          voted: Math.round((counts.voted / counts.total) * 100),
        })
      );

      setCourseData(formattedData);
    };

    fetchVoterStats();
  }, []);

  const handleReset = async () => {
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      "Are you sure you want to reset the votes?"
    );

    if (!isConfirmed) {
      return; // If the user cancels, stop the reset operation
    }

    try {
      // Reset vote counts in the voteCountManage table
      const { data: voteCountData, error: voteCountError } = await supabase
        .from("voteCountManage")
        .update({
          BSIT: 0,
          BSBA: 0,
          BSHM: 0,
          BSTM: 0,
          BSE: 0,
          BSED: 0,
          BSPSY: 0,
          BSCRIM: 0,
          BSCS: 0,
          BSCA: 0,
        })
        .not("id", "is", null); // Updates rows where "id" is NOT null.

      if (voteCountError) {
        throw new Error(voteCountError.message);
      }
      console.log("Vote counts have been reset:", voteCountData);

      // Reset voteStatus in the users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .update({ voteStatus: null }) // Set voteStatus to NULL
        .not("id", "is", null); // Updates rows where "id" is NOT null.

      if (userError) {
        throw new Error(userError.message);
      }
      console.log("User voteStatus has been reset:", userData);

      alert("Vote counts and user voteStatus have been reset.");
    } catch (error) {
      console.error("Error resetting data:", error);
      alert(`Error resetting data: ${error.message}`);
    }
  };

  const handleStartStop = async () => {
    try {
      if (isRunning) {
        clearInterval(intervalRef.current);
        setIsRunning(false);

        const { data, error } = await supabase
          .from("timerState")
          .update({ isRunning: 0 })
          .eq("id", 1);

        if (error) {
          throw new Error(error.message || "Error updating timer state (STOP)");
        }

        console.log("Timer state updated to STOP in Supabase:", data);
      } else {
        intervalRef.current = setInterval(() => {
          setTime((prevTime) => {
            const totalSeconds =
              prevTime.hours * 3600 + prevTime.minutes * 60 + prevTime.seconds;

            if (totalSeconds <= 0) {
              clearInterval(intervalRef.current);
              setIsRunning(false);
              return { days: 10, hours: 10, minutes: 10, seconds: 0 };
            }

            const newHours = Math.floor((totalSeconds - 1) / 3600);
            const newMinutes = Math.floor(((totalSeconds - 1) % 3600) / 60);
            const newSeconds = (totalSeconds - 1) % 60;

            return {
              hours: newHours,
              minutes: newMinutes,
              seconds: newSeconds,
            };
          });
        }, 1000);
        setIsRunning(true);

        const { data, error } = await supabase
          .from("timerState")
          .update({ isRunning: 1 })
          .eq("id", 1);

        if (error) {
          throw new Error(
            error.message || "Error updating timer state (START)"
          );
        }

        console.log("Timer state updated to START in Supabase:", data);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setTime((prev) => ({
      ...prev,
      [name]: Math.max(0, Math.min(parseInt(value, 10) || 0, 59)),
    }));
  };

  useEffect(() => {
    const fetchCandidates = async () => {
      const { data, error } = await supabase.from("candidates").select("*");
      if (error) {
        console.error("Error fetching candidates:", error);
        return;
      }
      setCandidates(data);
    };

    fetchCandidates();
  }, []);

  useEffect(() => {
    const fetchVoteCounts = async () => {
      const { data, error } = await supabase
        .from("voteCountManage")
        .select("*");
      if (error) {
        console.error("Error fetching vote counts:", error);
        return;
      }
      const voteCountsMap = {};
      data.forEach((record) => {
        voteCountsMap[record.candidateVoteName] = record;
      });
      setVoteCounts(voteCountsMap);
    };

    fetchVoteCounts();
  }, []);

  const groupedCandidates = orderedPositions.reduce((acc, position) => {
    const candidatesForPosition = candidates.filter(
      (candidate) => candidate.position === position
    );
    if (candidatesForPosition.length > 0) {
      acc[position] = candidatesForPosition;
    }
    return acc;
  }, {});

  const valueFormatter = (value) => `${value} %`;

  return (
    <div className="homeRow">
      <div className="navSpace"></div>

      <div className="homeContainer">
        <div className="timer">
          <div className="timer1">
            <TextField
              label="Days"
              type="number"
              name="days"
              value={time.days}
              onChange={handleTimeChange}
              InputProps={{ inputProps: { min: 0, max: 365 } }}
              sx={{ width: "80px", marginRight: "10px" }}
              disabled={isRunning}
            />

            <TextField
              label="Hours"
              type="number"
              name="hours"
              value={time.hours}
              onChange={handleTimeChange}
              InputProps={{ inputProps: { min: 0, max: 23 } }}
              sx={{ width: "80px", marginRight: "10px" }}
              disabled={isRunning}
            />
            <TextField
              label="Minutes"
              type="number"
              name="minutes"
              value={time.minutes}
              onChange={handleTimeChange}
              InputProps={{ inputProps: { min: 0, max: 59 } }}
              sx={{ width: "80px", marginRight: "10px" }}
              disabled={isRunning}
            />
            <TextField
              label="Seconds"
              type="number"
              name="seconds"
              value={time.seconds}
              onChange={handleTimeChange}
              InputProps={{ inputProps: { min: 0, max: 59 } }}
              sx={{ width: "80px" }}
              disabled={isRunning}
            />
          </div>
        </div>

        <div className="charts">
          <div className="chart1">
            <BarChart
              dataset={courseData}
              yAxis={[{ scaleType: "band", dataKey: "course" }]}
              series={[
                {
                  dataKey: "voted",
                  label: "Students Participated",
                  valueFormatter,
                  color: "#1ab394",
                },
              ]}
              layout="horizontal"
              grid={{ vertical: true, horizontal: true }}
              {...chartSetting}
              borderRadius={50}
            />
          </div>
          <div className="chart2">
            <div className="timerBtn">
              <Button
                style={{ width: "100%" }}
                variant="outlined"
                sx={{
                  borderWidth: "5px",
                  color: isRunning ? "red" : "#1ab394",
                  "&:hover": {
                    backgroundColor: isRunning ? "red" : "#1ab394",
                    color: "#fff",
                  },
                  borderColor: isRunning ? "red" : "#1ab394",
                  borderRadius: "10px",
                  fontSize: "2rem",
                  height: "70px",
                }}
                onClick={handleStartStop}
              >
                {isRunning ? "STOP" : "START"}
              </Button>
              <Button
                style={{ width: "100%" }}
                variant="outlined"
                sx={{
                  backgroundColor: "red",
                  marginTop: "10px",
                  borderWidth: "5px",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "white",
                    color: "red",
                  },
                  borderColor: "red",
                  borderRadius: "10px",
                  fontSize: "2rem",
                  height: "50px",
                }}
                onClick={handleReset} // Attach the reset handler here
              >
                RESET
              </Button>
            </div>
            <div className="voters">
              <label className="numVoter">
                <Gauge
                  width={100}
                  height={100}
                  value={totalVoters}
                  valueMin={0}
                  valueMax={totalVoters || 1}
                  sx={(theme) => ({
                    [`& .${gaugeClasses.valueText}`]: {
                      fontSize: 20,
                    },
                    [`& .${gaugeClasses.valueText} text`]: {
                      fill: "#1ab394",
                    },
                    [`& .${gaugeClasses.valueArc}`]: {
                      fill: "#1ab394",
                    },
                  })}
                />
                Student Voters
              </label>

              <label className="numVoted">
                <Gauge
                  width={100}
                  height={100}
                  value={totalVoted}
                  valueMin={0}
                  valueMax={totalVoters || 1}
                  sx={(theme) => ({
                    [`& .${gaugeClasses.valueText}`]: {
                      fontSize: 20,
                    },
                    [`& .${gaugeClasses.valueText} text`]: {
                      fill: "#1ab394",
                    },
                    [`& .${gaugeClasses.valueArc}`]: {
                      fill: "#1ab394",
                    },
                  })}
                />
                Student Voted
              </label>
            </div>
            <div className="chart22">
              <form ref={form} onSubmit={sendEmail}>
                <div>
                  <TextField
                    disabled
                    sx={{ width: "30ch" }}
                    label="To: Students"
                    type="text"
                    id="outlined-size-small"
                    size="small"
                    value={allEmails.join(", ") || "No emails found"}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <TextField
                    sx={{ width: "30ch" }}
                    label="Subject"
                    name="subject"
                    id="outlined-size-small"
                    size="small"
                    required
                    autoComplete="off"
                    //   value={"LC STUDENT ELECTION"}
                  />
                </div>

                <div>
                  <TextField
                    id="outlined-multiline-static"
                    label="Message"
                    name="message"
                    multiline
                    rows={6}
                    required
                    sx={{ width: "30ch" }}
                    defaultValue={
                      "Hello {name},\n\nHere is the Result of\n\nThank you!"
                    }
                  />
                </div>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: "#1ab394",
                    marginTop: "10px",
                  }}
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        </div>

        <div className="listContainer homeListContainer">
          <div>
            <h2 className="topLabel homeTopLabel">CANDIDATES</h2>
          </div>
          <div>
            {Object.keys(groupedCandidates).map((position) => (
              <div key={position}>
                <h3 className="HomePosition">
                  {position
                    .replace(/([A-Z])/g, " $1")
                    .trim()
                    .toUpperCase()}
                </h3>
                <div className="HomeprofileContainer">
                  <div>
                    {groupedCandidates[position].map((candidate) => {
                      const candidateVoteData =
                        voteCounts[candidate.candidateID] || {};

                      return (
                        <div
                          key={candidate.candidateID}
                          className="HomeCandidate"
                        >
                          <div className="HomeprofileRow">
                            <div>
                              <AvatarComponent
                                imgStyle={{
                                  height: "55px",
                                  width: "55px",
                                  borderRadius: "50%",
                                }}
                                imgSrc={candidate.avatarUrl}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="homeCandidateName">
                              {candidate.name}
                            </p>
                            <BarChart
                              layout="horizontal"
                              width={850}
                              height={70}
                              leftAxis={null}
                              bottomAxis={null}
                              slotProps={{ legend: { hidden: true } }}
                              margin={{
                                left: 20,
                                right: 0,
                                top: 0,
                                bottom: 0,
                              }}
                              series={[
                                {
                                  data: [candidateVoteData.BSIT || 0],
                                  stack: "total",
                                  color: "#1ab394",
                                  label: "BSIT",
                                  tooltip: {
                                    label: `BSIT: ${
                                      candidateVoteData.BSIT || 0
                                    }`,
                                  },
                                },
                                {
                                  data: [candidateVoteData.BSCS || 0],
                                  stack: "total",
                                  color: "#00796B",
                                  label: "BSCS",
                                  tooltip: {
                                    label: `BSCS: ${
                                      candidateVoteData.BSCS || 0
                                    }`,
                                  },
                                },
                                {
                                  data: [candidateVoteData.BSCA || 0],
                                  stack: "total",
                                  color: "#1ab394",
                                  label: "BSCA",
                                  tooltip: {
                                    label: `BSCA: ${
                                      candidateVoteData.BSCA || 0
                                    }`,
                                  },
                                },
                                {
                                  data: [candidateVoteData.BSBA || 0],
                                  stack: "total",
                                  color: "#00796B",
                                  label: "BSBA",
                                  tooltip: {
                                    label: `BSBA: ${
                                      candidateVoteData.BSBA || 0
                                    }`,
                                  },
                                },
                                {
                                  data: [candidateVoteData.BSHM || 0],
                                  stack: "total",
                                  color: "#1ab394",
                                  label: "BSHM",
                                  tooltip: {
                                    label: `BSHM: ${
                                      candidateVoteData.BSHM || 0
                                    }`,
                                  },
                                },
                                {
                                  data: [candidateVoteData.BSTM || 0],
                                  stack: "total",
                                  color: "#00796B",
                                  label: "BSTM",
                                  tooltip: {
                                    label: `BSTM: ${
                                      candidateVoteData.BSTM || 0
                                    }`,
                                  },
                                },
                                {
                                  data: [candidateVoteData.BSED || 0],
                                  stack: "total",
                                  color: "#1ab394",
                                  label: "BSED",
                                  tooltip: {
                                    label: `BSED: ${
                                      candidateVoteData.BSED || 0
                                    }`,
                                  },
                                },
                                {
                                  data: [candidateVoteData.BSE || 0],
                                  stack: "total",
                                  color: "#00796B",
                                  label: "BSE",
                                  tooltip: {
                                    label: `BSE: ${candidateVoteData.BSE || 0}`,
                                  },
                                },
                                {
                                  data: [candidateVoteData.BSPSY || 0],
                                  stack: "total",
                                  color: "#1ab394",
                                  label: "BSPSY",
                                  tooltip: {
                                    label: `BSPSY: ${
                                      candidateVoteData.BSPSY || 0
                                    }`,
                                  },
                                },
                                {
                                  data: [candidateVoteData.BSCRIM || 0],
                                  stack: "total",
                                  color: "#00796B",
                                  label: "BSCRIM",
                                  tooltip: {
                                    label: `BSCRIM: ${
                                      candidateVoteData.BSCRIM || 0
                                    }`,
                                  },
                                },
                                {
                                  data: [
                                    totalVoted -
                                      (candidateVoteData.BSIT +
                                        candidateVoteData.BSCS +
                                        candidateVoteData.BSCA +
                                        candidateVoteData.BSBA +
                                        candidateVoteData.BSHM +
                                        candidateVoteData.BSTM +
                                        candidateVoteData.BSED +
                                        candidateVoteData.BSE +
                                        candidateVoteData.BSPSY +
                                        candidateVoteData.BSCRIM),
                                  ],
                                  stack: "total",
                                  color: "#fff",
                                },
                              ]}
                              yAxis={[
                                {
                                  scaleType: "band",
                                  data: [
                                    `${candidate.name} =${
                                      candidateVoteData.BSIT +
                                      candidateVoteData.BSCS +
                                      candidateVoteData.BSCA +
                                      candidateVoteData.BSBA +
                                      candidateVoteData.BSHM +
                                      candidateVoteData.BSTM +
                                      candidateVoteData.BSED +
                                      candidateVoteData.BSE +
                                      candidateVoteData.BSPSY +
                                      candidateVoteData.BSCRIM
                                    }`,
                                  ],
                                  categoryGapRatio: 0.8,
                                },
                              ]}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
