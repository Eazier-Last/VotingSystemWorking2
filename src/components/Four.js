import React, { useState, useEffect } from "react";
import "../App.css";
import "./css/Users.css";

import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";

import IconButton from "@mui/material/IconButton";
import { Modal } from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";

import Button from "@mui/material/Button";
import ListSubheader from "@mui/material/ListSubheader";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import NewUser from "./Modals/NewUser";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { styled } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { supabase } from "./client";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#1ab394",
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

function Four() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState("BSIT");
  const [searchQuery, setSearchQuery] = useState("");
  const [accountRequests, setAccountRequests] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [imageSrc, setImageSrc] = useState("");

  const [users, setUsers] = useState({
    BSIT: [],
    BSCS: [],
    BSCA: [],
    BSBA: [],
    BSHM: [],
    BSTM: [],
    BSE: [],
    BSED: [],
    BSPSY: [],
    BSCrim: [],
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    console.log(data);

    const organizedUsers = {
      All: [], // "All" will include users from all courses
      BSIT: [],
      BSCS: [],
      BSCA: [],
      BSBA: [],
      BSHM: [],
      BSTM: [],
      BSE: [],
      BSED: [],
      BSPSY: [],
      BSCrim: [],
    };

    data.forEach((user) => {
      organizedUsers.All.push(user);
      organizedUsers[user.course]?.push(user);
    });

    setUsers(organizedUsers);
  };

  useEffect(() => {
    fetchAccountRequests();
  }, []);

  const fetchAccountRequests = async () => {
    const { data, error } = await supabase.from("account_requests").select("*");
    if (error) {
      console.error("Error fetching account requests:", error.message);
      return;
    }
    setAccountRequests(data);
  };

  const handleAcceptRequest = async (request) => {
    try {
      // Create the user in Supabase Auth
      const { error: authError } = await supabase.auth.signUp({
        email: `${request.studentNumber}@lc.com`,
        password: request.password,
      });

      if (authError) {
        throw authError;
      }

      // Add the user to the users table
      const { error: dbError } = await supabase.from("users").insert([
        {
          studentNumber: request.studentNumber,
          name: request.name,
          course: request.course,
        },
      ]);

      if (dbError) {
        throw dbError;
      }

      // Remove the request from the account_requests table
      await supabase
        .from("account_requests")
        .delete()
        .eq("studentNumber", request.studentNumber);

      alert("Account request accepted!");
      fetchAccountRequests(); // Refresh the data
    } catch (error) {
      console.error("Error accepting account request:", error.message);
      alert("Failed to accept account request: " + error.message);
    }
  };

  const handleRejectRequest = async (studentNumber) => {
    try {
      await supabase
        .from("account_requests")
        .delete()
        .eq("studentNumber", studentNumber);
      alert("Account request rejected!");
      fetchAccountRequests(); // Refresh the data
    } catch (error) {
      console.error("Error rejecting account request:", error.message);
      alert("Failed to reject account request: " + error.message);
    }
  };

  const handleOpenModal = (user = null) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleAddUser = async (newUser) => {
    if (selectedUser) {
      await handleEditUser(selectedUser.id, newUser);
    } else {
      setUsers((prevUsers) => ({
        ...prevUsers,
        [newUser.course]: [...prevUsers[newUser.course], newUser],
      }));
    }
    setIsModalOpen(false);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const handleEditUser = async (userId, updatedUser) => {
    const { error } = await supabase
      .from("users")
      .update({
        name: updatedUser.name,
        course: updatedUser.course,
      })
      .match({ id: userId });

    if (error) {
      console.error("Error updating user:", error.message);
      alert("Failed to update user: " + error.message);
      return;
    }

    setUsers((prevUsers) => {
      const updatedUsers = { ...prevUsers };
      updatedUsers[updatedUser.course] = updatedUsers[updatedUser.course].map(
        (user) => (user.id === userId ? updatedUser : user)
      );
      return updatedUsers;
    });
    setSelectedUser(null);
  };

  const handleViewImage = (src) => {
    setImageSrc(src);
    setOpenModal(true);
  };

  // Function to close modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setImageSrc("");
  };

  const handleDeleteUser = async (course, index) => {
    const userToDelete = users[course]?.[index];

    if (!userToDelete) {
      console.error("No user found at specified index:", index);
      alert("Failed to delete user: no user found at specified index");
      return;
    }

    if (!userToDelete.id || !userToDelete.auth_id) {
      console.error(
        "Invalid user data: missing user ID or auth ID",
        userToDelete
      );
      alert("Failed to delete user: invalid user data");
      return;
    }

    console.log("Attempting to delete user:", userToDelete);

    const { error: deleteTableError } = await supabase
      .from("users")
      .delete()
      .match({ id: userToDelete.id });

    if (deleteTableError) {
      console.error(
        "Error deleting user from `users` table:",
        deleteTableError.message
      );
      alert(
        "Failed to delete user from users table: " + deleteTableError.message
      );
      return;
    }

    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
      userToDelete.auth_id
    );

    if (deleteAuthError) {
      console.error(
        "Error deleting user from authentication:",
        deleteAuthError.message
      );
      alert(
        "Failed to delete user from authentication: " + deleteAuthError.message
      );
      return;
    }

    const updatedUsers = users[course].filter((_, i) => i !== index);
    setUsers((prevUsers) => ({
      ...prevUsers,
      [course]: updatedUsers,
    }));

    console.log(
      "User deleted successfully from both users table and authentication"
    );
  };

  const filteredUsers = users[selectedCourse]
    ?.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery) ||
        user.studentNumber.toLowerCase().includes(searchQuery)
    )
    ?.sort((a, b) => a.studentNumber.localeCompare(b.studentNumber));

  return (
    <div className="homeRow">
      <div className="navSpace"></div>
      <div className="homeContainer">
        <div className="listContainer topLabel">
          <h3>Account Requests</h3>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 700 }} aria-label="account requests table">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Student Number</StyledTableCell>
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Course</StyledTableCell>
                  <StyledTableCell>Email</StyledTableCell>
                  <StyledTableCell>ID</StyledTableCell>
                  <StyledTableCell align="right">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accountRequests.length > 0 ? (
                  accountRequests.map((request) => (
                    <StyledTableRow key={request.id}>
                      <StyledTableCell>{request.studentNumber}</StyledTableCell>
                      <StyledTableCell>{request.name}</StyledTableCell>
                      <StyledTableCell>{request.course}</StyledTableCell>
                      <StyledTableCell>{request.email}</StyledTableCell>
                      <StyledTableCell align="right">
                        {request.avatar ? (
                          <>
                            <img
                              src={request.avatar}
                              alt="User Avatar"
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: "50%",
                                cursor: "pointer", // Add cursor pointer for the image
                              }}
                              onClick={() => handleViewImage(request.avatar)} // Open modal on click
                            />
                            <Button
                              variant="contained"
                              color="#1ab394"
                              sx={{
                                backgroundColor: "#1ab394",
                                color: "white",
                                marginLeft: 1,
                              }}
                              onClick={() => handleAcceptRequest(request)}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              sx={{ marginLeft: 1 }}
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span>No Image</span>
                        )}
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
                ) : (
                  <StyledTableRow>
                    <StyledTableCell colSpan={5} align="center">
                      No account requests.
                    </StyledTableCell>
                  </StyledTableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        <div className="listContainer userContainer">
          <div className="userSectionRow1">
            <List
              sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
              component="nav"
              subheader={
                <ListSubheader
                  sx={{ fontSize: "1.2rem", color: "#1ab394" }}
                  component="div"
                >
                  Courses
                </ListSubheader>
              }
            >
              {Object.keys(users).map((course) => (
                <ListItemButton
                  key={course}
                  onClick={() => setSelectedCourse(course)}
                  selected={selectedCourse === course}
                  sx={{
                    "&.Mui-selected": {
                      borderRadius: "10px",
                      backgroundColor: "#9bf2df",
                    },
                  }}
                >
                  <ListItemText primary={course} />
                </ListItemButton>
              ))}
            </List>
          </div>
          <div className="userSectionRow2">
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 700 }} aria-label="users table">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Student Number</StyledTableCell>
                    <StyledTableCell>Name</StyledTableCell>
                    <StyledTableCell align="right">
                      <Paper
                        component="form"
                        sx={{
                          p: "2px 4px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <InputBase
                          sx={{ ml: 1, flex: 1 }}
                          placeholder="Search"
                          value={searchQuery}
                          onChange={handleSearchChange}
                        />
                        <IconButton type="button" sx={{ p: "10px" }}>
                          <SearchIcon />
                        </IconButton>
                      </Paper>
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <StyledTableRow key={user.id}>
                        <StyledTableCell>{user.studentNumber}</StyledTableCell>
                        <StyledTableCell>{user.name}</StyledTableCell>
                        {/* Avatar Column with View Image Button */}

                        <StyledTableCell align="right">
                          <Button
                            variant="contained"
                            sx={{ marginRight: 1, backgroundColor: "#1ab394" }}
                            onClick={() => handleOpenModal(user)}
                          >
                            <EditIcon />
                          </Button>
                          <Button
                            variant="contained"
                            color="secondary"
                            sx={{ backgroundColor: "#eb5455" }}
                            onClick={() =>
                              handleDeleteUser(selectedCourse, index)
                            }
                          >
                            <DeleteIcon />
                          </Button>
                        </StyledTableCell>
                      </StyledTableRow>
                    ))
                  ) : (
                    <StyledTableRow>
                      <StyledTableCell colSpan={3} align="center">
                        No users available.
                      </StyledTableCell>
                    </StyledTableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <NewUser
          onClose={handleCloseModal}
          onAddUser={handleAddUser}
          initialData={selectedUser}
        />
      )}

      {/* Modal to display image */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "20px",
            boxShadow: 24,
            maxWidth: "80%",
            maxHeight: "80%",
            overflow: "auto",
          }}
        >
          <img
            src={imageSrc}
            alt="User Avatar"
            style={{ width: "100%", height: "auto" }}
          />
          <Button onClick={handleCloseModal} style={{ marginTop: "20px" }}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default Four;
