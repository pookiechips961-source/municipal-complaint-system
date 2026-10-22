package com.municipal.backend.controller;

import com.municipal.backend.model.Complaint;
import com.municipal.backend.repository.ComplaintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    @Autowired
    private ComplaintRepository complaintRepository;

    @GetMapping
    public List<Complaint> getAllComplaints() {
        return complaintRepository.findAll();
    }

    @PostMapping
    public Complaint createComplaint(@RequestBody Complaint complaint) {
        if (complaint.getStatus() == null || complaint.getStatus().isEmpty()) {
            complaint.setStatus("Pending");
        }
        return complaintRepository.save(complaint);
    }

    @PatchMapping("/{id}/status")
    public Complaint updateStatus(@PathVariable Long id, @RequestParam String status) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + id));
        complaint.setStatus(status);
        return complaintRepository.save(complaint);
    }

    @PatchMapping("/{id}/vote")
    public Complaint voteComplaint(@PathVariable Long id, @RequestParam String type) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + id));
        
        if ("up".equalsIgnoreCase(type)) {
            complaint.setUpvotes(complaint.getUpvotes() + 1);
        } else if ("down".equalsIgnoreCase(type)) {
            complaint.setDownvotes(complaint.getDownvotes() + 1);
        }
        
        return complaintRepository.save(complaint);
    }
}