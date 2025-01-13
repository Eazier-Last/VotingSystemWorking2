import React, { useState } from "react";
import "../App.css";
import "../Responsive.css";
import { supabase } from "./client";
import "./Modals/Modals.css";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import FormControl from "@mui/material/FormControl";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate"; // Import the icon

function Login({ setAuthType }) {
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudentNumber, setNewStudentNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newEmail, setNewEmail] = useState(""); // Added state for email
  const [avatarUrl, setAvatarUrl] = useState(""); // State for avatar image

  // Function to convert the uploaded image to base64
  const convertToBase64 = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setAvatarUrl(reader.result); // Update avatarUrl with the base64 string
    };
  };

  const handleCreateAccount = async () => {
    if (!newStudentNumber || !newName || !newPassword || !newCourse) {
      alert("All fields are required!");
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from("account_requests")
        .insert([
          {
            studentNumber: newStudentNumber,
            name: newName,
            course: newCourse,
            password: newPassword, // Save the password for admin approval purposes
            email: newEmail, // Added email field to account request
            avatar: avatarUrl, // Save the avatar URL
          },
        ]);

      if (dbError) {
        throw dbError;
      }

      alert("Account request submitted successfully!");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting account request:", error.message);
      alert("Failed to submit account request: " + error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (studentNumber === "admin" && password === "password") {
      setAuthType("admin");
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: `${studentNumber}@lc.com`,
        password,
      });

      if (authError) {
        throw authError;
      }

      setAuthType("user");
    } catch (error) {
      console.error("Error logging in:", error.message);
      setError("Invalid login credentials. Please try again.");
    }
  };

  return (
    <div className="modal">
      <div className="modalContent login">
        <div>
          <h2 className="topLabel login">LOGIN FORM</h2>
        </div>
        <form onSubmit={handleLogin}>
          <div>
            <Box
              component="form"
              sx={{ "& .MuiTextField-root": { m: 1 } }}
              noValidate
              autoComplete="off"
            >
              <div>
                <TextField
                  className="loginInput"
                  label="Student Number"
                  id="outlined-size-small"
                  size="small"
                  required
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                />
              </div>
            </Box>
          </div>

          <FormControl sx={{ m: 1 }} variant="outlined">
            <InputLabel htmlFor="outlined-adornment-password">
              Password
            </InputLabel>
            <OutlinedInput
              className="loginInput"
              id="outlined-adornment-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              label="Password"
            />
          </FormControl>

          <div>
            <Button
              type="button"
              variant="contained"
              sx={{
                border: "2px",
                borderStyle: "solid",
                color: "#1ab394",
                backgroundColor: "white",
                marginTop: "10px",
                marginRight: "20px",
              }}
              onClick={() => setIsModalOpen(true)}
            >
              Create Account
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: "#1ab394",
                marginTop: "10px",
                marginLeft: "20px",
              }}
            >
              Login
            </Button>
          </div>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      <Modal
        className="modalCreateAccount"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <div className="modalContent createAccount">
          <h2 className="topLabel">Create Account</h2>
          <TextField
            className="loginInput"
            label="Student Number"
            id="new-student-number"
            size="small"
            required
            value={newStudentNumber}
            onChange={(e) => setNewStudentNumber(e.target.value)}
          />
          <TextField
            className="loginInput"
            label="Name"
            id="new-name"
            size="small"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <FormControl sx={{ width: "360px" }} size="small">
            <InputLabel id="course-label">Course</InputLabel>
            <Select
              labelId="course-label"
              id="new-course"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
              required
            >
              <MenuItem value={"BSIT"}>BSIT</MenuItem>
              <MenuItem value={"BSCS"}>BSCS</MenuItem>
              <MenuItem value={"BSCA"}>BSCA</MenuItem>
              <MenuItem value={"BSBA"}>BSBA</MenuItem>
              <MenuItem value={"BSHM"}>BSHM</MenuItem>
              <MenuItem value={"BSTM"}>BSTM</MenuItem>
              <MenuItem value={"BSE"}>BSE</MenuItem>
              <MenuItem value={"BSED"}>BSED</MenuItem>
              <MenuItem value={"BSPSY"}>BSPSY</MenuItem>
              <MenuItem value={"BSCRIM"}>BSCRIM</MenuItem>
            </Select>
          </FormControl>
          <TextField
            className="loginInput"
            label="Email"
            id="new-email"
            size="small"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)} // Added onChange to email field
          />
          <TextField
            className="loginInput"
            label="Password"
            id="new-password"
            size="small"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <div>
            {!avatarUrl && (
              <div>
                <label className="uploadIcon" htmlFor="imageUpload">
                  <AddPhotoAlternateIcon sx={{ fontSize: 100 }} />
                </label>
                <br />
                <span>Upload School ID</span>
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={convertToBase64}
                  required
                />
              </div>
            )}

            <div className="preview">
              {avatarUrl && (
                <img className="imgSize" src={avatarUrl} alt="candidate" />
              )}
            </div>
            <Button
              type="button"
              variant="contained"
              sx={{ backgroundColor: "#1ab394", marginTop: "10px" }}
              onClick={handleCreateAccount}
            >
              Submit
            </Button>

            <Button
              type="button"
              variant="outlined"
              sx={{ marginTop: "10px", marginLeft: "10px" }}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Login;
