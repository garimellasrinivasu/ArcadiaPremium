package com.arcadia.premium.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** One amount spent by a friend on the trip, shared equally among the friends it was for. */
@Entity
@Table(name = "trip_expenses", indexes = @Index(name = "idx_trip_expense_trip", columnList = "trip"))
public class TripExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Trip code, e.g. VIETNAM_2026, so a later trip can be kept separately */
    @Column(nullable = false, length = 40)
    private String trip;

    @Column(nullable = false)
    private LocalDate expenseDate;

    /** Friend who paid */
    @Column(nullable = false, length = 60)
    private String paidBy;

    @Column(nullable = false, length = 200)
    private String description;

    /** FOOD, STAY, TRAVEL, SIGHTSEEING, SHOPPING, OTHER */
    @Column(length = 20)
    private String category;

    /** Amount in the currency it was paid in */
    @Column(nullable = false)
    private Double amount;

    /** INR, VND or USD */
    @Column(nullable = false, length = 3)
    private String currency;

    /** Rupees for one unit of the currency (1 for INR) */
    @Column(nullable = false)
    private Double rateToInr;

    /** amount × rateToInr, kept so totals never change if the rate is edited elsewhere */
    @Column(nullable = false)
    private Double amountInr;

    /** Friends this amount is shared among, separated by "|" */
    @Column(nullable = false, length = 1000)
    private String sharedWith;

    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public String getTrip() { return trip; }
    public void setTrip(String trip) { this.trip = trip; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
    public String getPaidBy() { return paidBy; }
    public void setPaidBy(String paidBy) { this.paidBy = paidBy; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Double getRateToInr() { return rateToInr; }
    public void setRateToInr(Double rateToInr) { this.rateToInr = rateToInr; }
    public Double getAmountInr() { return amountInr; }
    public void setAmountInr(Double amountInr) { this.amountInr = amountInr; }
    public String getSharedWith() { return sharedWith; }
    public void setSharedWith(String sharedWith) { this.sharedWith = sharedWith; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
