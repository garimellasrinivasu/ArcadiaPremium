package com.arcadia.premium.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateContractorRequest {

    @NotBlank(message = "Contractor name is required")
    private String name;

    private String contactPerson;
    private String phone;
    private String email;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String pan;
    private String gstNo;

    @NotBlank(message = "Contractor type is required")
    private String contractorType = "CONTRACTOR";

    private String trade;
    private String bankAccountName;
    private String bankAccountNo;
    private String bankName;
    private String bankBranch;
    private String ifscCode;
    private boolean active = true;
    private String remarks;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public String getPan() { return pan; }
    public void setPan(String pan) { this.pan = pan; }
    public String getGstNo() { return gstNo; }
    public void setGstNo(String gstNo) { this.gstNo = gstNo; }
    public String getContractorType() { return contractorType; }
    public void setContractorType(String contractorType) { this.contractorType = contractorType; }
    public String getTrade() { return trade; }
    public void setTrade(String trade) { this.trade = trade; }
    public String getBankAccountName() { return bankAccountName; }
    public void setBankAccountName(String bankAccountName) { this.bankAccountName = bankAccountName; }
    public String getBankAccountNo() { return bankAccountNo; }
    public void setBankAccountNo(String bankAccountNo) { this.bankAccountNo = bankAccountNo; }
    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }
    public String getBankBranch() { return bankBranch; }
    public void setBankBranch(String bankBranch) { this.bankBranch = bankBranch; }
    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
}
