import React, { useState, useEffect } from "react";
import "./Modals.css";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import InputAdornment from "@mui/material/InputAdornment";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { supabase } from "../client"; // Ensure you import your configured Supabase client

function NewUser({ onClose, onAddUser, initialData }) {
  const [name, setName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [course, setCourse] = useState("");
  const [gmail, setGmail] = useState(""); // Add Gmail state
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setStudentNumber(initialData.studentNumber);
      setCourse(initialData.course);
      setGmail(initialData.gmail); // Set Gmail if editing
      setPassword(initialData.password);
    }
  }, [initialData]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name || !studentNumber || !course || !gmail || !password) {
      alert("All fields are required!");
      return;
    }

    const userData = { name, studentNumber, course, gmail, password };

    if (initialData) {
      // Update existing user
      const { error: updateError } = await supabase
        .from("users")
        .update(userData)
        .eq("studentNumber", initialData.studentNumber);

      if (updateError) {
        console.error("Error updating user in database:", updateError.message);
        alert("Failed to update user details: " + updateError.message);
        return;
      }

      alert("User updated successfully!");
    } else {
      // Insert new user
      const { error: insertError } = await supabase
        .from("users")
        .insert([userData]);

      if (insertError) {
        console.error("Error saving user to database:", insertError.message);
        alert("Failed to save user details: " + insertError.message);
        return;
      }

      alert("User created successfully!");
      onAddUser(userData); // Update parent component's UI without duplicate DB insert
    }

    onClose(); // Close the modal
  };

  return (
    <div className="modal">
      <div className="modalOverlay" onClick={onClose}></div>
      <div className="modalContent">
        <div className="closeBtn">
          <Button className="closeIcon" variant="text" onClick={onClose}>
            <CloseIcon />
          </Button>
        </div>
        <div>
          <h2 className="topLabel">{initialData ? "EDIT USER" : "NEW USER"}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <Box
            autoComplete="off"
            sx={{ "& .MuiTextField-root": { m: 1, width: "50ch" } }}
          >
            <div>
              <TextField
                label="Student Number"
                id="outlined-size-small"
                size="small"
                required
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                // disabled={!!initialData} // Disable editing studentNumber if updating
              />
            </div>
            <div>
              <TextField
                label="Name"
                id="outlined-size-small"
                size="small"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <TextField
                label="Gmail"
                id="outlined-size-small"
                size="small"
                required
                value={gmail}
                onChange={(e) => setGmail(e.target.value)} // Capture Gmail input
              />
            </div>
            <div>
              <FormControl sx={{ m: 1, minWidth: 450 }} size="small">
                <InputLabel id="demo-select-small-label">Courses</InputLabel>
                <Select
                  labelId="demo-select-small-label"
                  id="demo-select-small"
                  value={course}
                  label="Course"
                  onChange={(e) => setCourse(e.target.value)}
                >
                  <MenuItem value={"BEED"}>BEED</MenuItem>
                  <MenuItem value={"BPE"}>BPE</MenuItem>
                  <MenuItem value={"BCAD"}>BCAD</MenuItem>
                  <MenuItem value={"BTIC"}>BTIC</MenuItem>
                  <MenuItem value={"BTHE"}>BTHE</MenuItem>
                  <MenuItem value={"BSED"}>BSED</MenuItem>
                  <MenuItem value={"BSBA_FM"}>BSBA_FM</MenuItem>
                  <MenuItem value={"BSBA_MM"}>BSBA_MM</MenuItem>
                  <MenuItem value={"BSCA"}>BSCA</MenuItem>
                  <MenuItem value={"BSHM"}>BSHM</MenuItem>
                  <MenuItem value={"BSTM"}>BSTM</MenuItem>
                  <MenuItem value={"BSIT"}>BSIT</MenuItem>
                  <MenuItem value={"BSCS"}>BSCS</MenuItem>
                  <MenuItem value={"CRIM"}>CRIM</MenuItem>
                  <MenuItem value={"PSYCH"}>PSYCH</MenuItem>
                  <MenuItem value={"SEAMAN"}>SEAMAN</MenuItem>
                 
                </Select>
              </FormControl>
            </div>
            <FormControl sx={{ m: 1, width: "50ch" }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-password">
                Password
              </InputLabel>
              <OutlinedInput
                id="outlined-adornment-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Password"
              />
            </FormControl>
            <div className="modalBtns">
              <Button
                variant="outlined"
                sx={{ width: "25ch", marginTop: "15px", marginRight: "8px" }}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  width: "25ch",
                  marginTop: "15px",
                  marginRight: "8px",
                  backgroundColor: "#1ab394",
                }}
              >
                {initialData ? "Update User" : "Save User"}
              </Button>
            </div>
          </Box>
        </form>
      </div>
    </div>
  );
}

export default NewUser;
