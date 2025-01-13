import React, { useState, useEffect } from "react";
import "../App.css";
import "../Results.css";
import "../Responsive.css";
import { BarChart } from "@mui/x-charts/BarChart";
import { supabase } from "./client";
import AvatarComponent from "./Avatar/AvatarComponent";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
// import PrintView from "./Modals/PrintView"; // Import the PrintView modal
import PrintView from "./Modals/Print";

function Results() {
  const [candidates, setCandidates] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [orderedPositions, setOrderedPositions] = useState([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [totalVoted, setTotalVoted] = useState(0);
  const [openPrintView, setOpenPrintView] = useState(false); // State to control modal

  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error during logout:", error.message);
    } else {
      navigate("/");
    }
  };

  const handlePrintViewOpen = () => setOpenPrintView(true); // Open modal
  const handlePrintViewClose = () => setOpenPrintView(false); // Close modal

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
    };

    fetchVoterStats();
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

  return (
    <div className="resultsContainer">
      <div className="listContainer homeListContainer">
        <div className="logoutButtonContainer">
          <div>
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: "#1ab394",
              }}
              onClick={handlePrintViewOpen} // Trigger modal
            >
              Print View
            </Button>
          </div>
          <div>
            <Button
              onClick={handleLogout}
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: "#1ab394",
              }}
            >
              Logout
            </Button>
          </div>
        </div>
        <div>
          <h2 className="topLabel homeTopLabel">RESULTS</h2>
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
                          <p className="homeCandidateName">{candidate.name}</p>
                          <BarChart
                            layout="horizontal"
                            width={750}
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
                                  label: `BSIT: ${candidateVoteData.BSIT || 0}`,
                                },
                              },
                              // Continue adding the rest of the series...
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

      {/* Print View Modal */}
      <PrintView
        open={openPrintView}
        onClose={handlePrintViewClose}
        groupedCandidates={groupedCandidates}
        voteCounts={voteCounts}
      />
    </div>
  );
}

export default Results;
