package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CreateSaleEntryRequest {

    @NotNull(message = "Booking date is required")
    private LocalDate bookingDate;

    @NotBlank(message = "Project is required")
    private String project;

    private String spgPraneeth;
    private String tokenNumber;

    @NotBlank(message = "Customer name is required")
    private String customerName;

    private String personalCompany;
    private String sol;
    private String typeOfSale;
    private BigDecimal landExtentSqYards;
    private BigDecimal sbuaSft;
    private String facing;
    private BigDecimal basePricePerSft;
    private String amenitiesPremiums;
    private BigDecimal receivedAmount;
    private String remarks;

    // --- Getters & Setters ---
    public LocalDate getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDate bookingDate) { this.bookingDate = bookingDate; }
    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }
    public String getSpgPraneeth() { return spgPraneeth; }
    public void setSpgPraneeth(String spgPraneeth) { this.spgPraneeth = spgPraneeth; }
    public String getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getPersonalCompany() { return personalCompany; }
    public void setPersonalCompany(String personalCompany) { this.personalCompany = personalCompany; }
    public String getSol() { return sol; }
    public void setSol(String sol) { this.sol = sol; }
    public String getTypeOfSale() { return typeOfSale; }
    public void setTypeOfSale(String typeOfSale) { this.typeOfSale = typeOfSale; }
    public BigDecimal getLandExtentSqYards() { return landExtentSqYards; }
    public void setLandExtentSqYards(BigDecimal landExtentSqYards) { this.landExtentSqYards = landExtentSqYards; }
    public BigDecimal getSbuaSft() { return sbuaSft; }
    public void setSbuaSft(BigDecimal sbuaSft) { this.sbuaSft = sbuaSft; }
    public String getFacing() { return facing; }
    public void setFacing(String facing) { this.facing = facing; }
    public BigDecimal getBasePricePerSft() { return basePricePerSft; }
    public void setBasePricePerSft(BigDecimal basePricePerSft) { this.basePricePerSft = basePricePerSft; }
    public String getAmenitiesPremiums() { return amenitiesPremiums; }
    public void setAmenitiesPremiums(String amenitiesPremiums) { this.amenitiesPremiums = amenitiesPremiums; }
    public BigDecimal getReceivedAmount() { return receivedAmount; }
    public void setReceivedAmount(BigDecimal receivedAmount) { this.receivedAmount = receivedAmount; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
