package com.arcadia.premium.dto;

import com.arcadia.premium.model.Vendor;

import java.time.LocalDateTime;

public class VendorDto {
    private Long id;
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
    private String vendorType;
    private String trade;
    private String bankAccountName;
    private String bankAccountNo;
    private String bankName;
    private String bankBranch;
    private String ifscCode;
    private boolean active;
    private String remarks;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static VendorDto fromEntity(Vendor e) {
        VendorDto d = new VendorDto();
        d.id = e.getId();
        d.name = e.getName();
        d.contactPerson = e.getContactPerson();
        d.phone = e.getPhone();
        d.email = e.getEmail();
        d.address = e.getAddress();
        d.city = e.getCity();
        d.state = e.getState();
        d.pincode = e.getPincode();
        d.pan = e.getPan();
        d.gstNo = e.getGstNo();
        d.vendorType = e.getVendorType();
        d.trade = e.getTrade();
        d.bankAccountName = e.getBankAccountName();
        d.bankAccountNo = e.getBankAccountNo();
        d.bankName = e.getBankName();
        d.bankBranch = e.getBankBranch();
        d.ifscCode = e.getIfscCode();
        d.active = e.isActive();
        d.remarks = e.getRemarks();
        d.createdBy = e.getCreatedBy();
        d.createdAt = e.getCreatedAt();
        d.updatedAt = e.getUpdatedAt();
        return d;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public String getVendorType() { return vendorType; }
    public void setVendorType(String vendorType) { this.vendorType = vendorType; }
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
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
