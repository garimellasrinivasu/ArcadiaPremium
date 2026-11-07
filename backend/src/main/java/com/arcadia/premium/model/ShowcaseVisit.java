package com.arcadia.premium.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/** One visit to a public Deewali showcase page. Anonymous: no name, phone or IP address is kept. */
@Entity
@Table(name = "showcase_visits", indexes = @Index(name = "idx_showcase_visit_page_time", columnList = "page, visitedAt"))
public class ShowcaseVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** arcadia, redfern or aalaya-arvindham */
    @Column(nullable = false, length = 30)
    private String page;

    @Column(nullable = false)
    private LocalDateTime visitedAt;

    /** Random id the page keeps on the visitor's device, used only to count unique visitors */
    @Column(length = 40)
    private String visitorId;

    /** Android, iPhone / iPad, Desktop or Other */
    @Column(length = 20)
    private String device;

    /** Site the visitor came from, if the browser reports one (blank for QR scans and WhatsApp links) */
    @Column(length = 100)
    private String referrer;

    public Long getId() { return id; }
    public String getPage() { return page; }
    public void setPage(String page) { this.page = page; }
    public LocalDateTime getVisitedAt() { return visitedAt; }
    public void setVisitedAt(LocalDateTime visitedAt) { this.visitedAt = visitedAt; }
    public String getVisitorId() { return visitorId; }
    public void setVisitorId(String visitorId) { this.visitorId = visitorId; }
    public String getDevice() { return device; }
    public void setDevice(String device) { this.device = device; }
    public String getReferrer() { return referrer; }
    public void setReferrer(String referrer) { this.referrer = referrer; }
}
