import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./Modals.css";
import "../../Responsive.css";

function Print({
  open,
  onClose,
  groupedCandidates,
  voteCounts,
  onGeneratePDF,
}) {
  // Function to generate the PDF and return it as a Base64 string
  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(18);
    doc.text("Student Council Election Results", pageWidth / 2, 15, {
      align: "center",
    });

    let currentY = 30;

    Object.keys(groupedCandidates).forEach((position) => {
      const positionTitle = `${position.toUpperCase()}`;
      if (currentY + 1 > doc.internal.pageSize.height - 40) {
        doc.addPage();
        currentY = 30;
        doc.text("Student Council Election Results", pageWidth / 2, 15, {
          align: "center",
        });
      }

      doc.setFontSize(14);

      const tableData = groupedCandidates[position].map((candidate) => {
        const candidateVoteData = voteCounts[candidate.candidateID] || {};
        const totalVotes =
          (candidateVoteData.BSIT || 0) +
          (candidateVoteData.BSCS || 0) +
          (candidateVoteData.BSCA || 0) +
          (candidateVoteData.BSBA || 0) +
          (candidateVoteData.BSHM || 0) +
          (candidateVoteData.BSTM || 0) +
          (candidateVoteData.BSED || 0) +
          (candidateVoteData.BSE || 0) +
          (candidateVoteData.BSPSY || 0) +
          (candidateVoteData.BSCRIM || 0);

        return [candidate.name, totalVotes];
      });

      doc.autoTable({
        head: [[positionTitle, "Total Votes"]],
        body: tableData,
        startY: currentY,
        didDrawPage: (data) => {
          currentY = data.cursor.y + 10;
        },
        margin: { left: 10, right: 10 },
      });

      if (currentY > doc.internal.pageSize.height - 40) {
        doc.addPage();
        currentY = 30;
        doc.text("Student Council Election Results", pageWidth / 2, 15, {
          align: "center",
        });
      }
    });

    // Convert the PDF to Base64
    return doc.output("datauristring");
  };

  // Button to trigger PDF generation
  const handleDownload = () => {
    const pdfData = handleGeneratePDF();
    onGeneratePDF(pdfData); // Pass the Base64 PDF to the parent component
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="confirmVoteContainer">
        <DialogTitle className="confirmTitle">Vote Summary</DialogTitle>
        <DialogContent>
          {Object.keys(groupedCandidates).map((position) => (
            <TableContainer
              component={Paper}
              key={position}
              sx={{ marginBottom: 2 }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={2}>
                      <strong>{position.toUpperCase()}</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupedCandidates[position].map((candidate) => {
                    const candidateVoteData =
                      voteCounts[candidate.candidateID] || {};

                    const totalVotes =
                      (candidateVoteData.BSIT || 0) +
                      (candidateVoteData.BSCS || 0) +
                      (candidateVoteData.BSCA || 0) +
                      (candidateVoteData.BSBA || 0) +
                      (candidateVoteData.BSHM || 0) +
                      (candidateVoteData.BSTM || 0) +
                      (candidateVoteData.BSED || 0) +
                      (candidateVoteData.BSE || 0) +
                      (candidateVoteData.BSPSY || 0) +
                      (candidateVoteData.BSCRIM || 0);

                    return (
                      <TableRow key={candidate.candidateID}>
                        <TableCell>{candidate.name}</TableCell>
                        <TableCell>{totalVotes}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ))}
        </DialogContent>
        <DialogActions>
          <div className="confirmVoteBtns">
            <Button
              className="confirmBtns"
              type="submit"
              variant="outlined"
              onClick={onClose}
              sx={{
                marginTop: "10px",
              }}
            >
              Close
            </Button>
            <Button
              className="confirmBtns"
              type="submit"
              variant="contained"
              onClick={handleDownload}
              sx={{
                backgroundColor: "#1ab394",
                marginTop: "10px",
              }}
            >
              Download
            </Button>
          </div>
        </DialogActions>
      </div>
    </Dialog>
  );
}

export default Print;
