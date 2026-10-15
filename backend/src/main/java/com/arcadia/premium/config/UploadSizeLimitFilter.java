package com.arcadia.premium.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * The multipart limit is 2 GB so checklist pages (which stream uploads to disk) can take large scans.
 * Every other upload endpoint reads files into memory, so they keep the previous 100 MB cap here.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class UploadSizeLimitFilter extends OncePerRequestFilter {

    private static final long DEFAULT_MAX = 100L * 1024 * 1024 + 1024 * 1024; // 100 MB file + form overhead

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long length = request.getContentLengthLong();
        if (length > DEFAULT_MAX && !request.getRequestURI().startsWith("/api/checklists/")) {
            response.setStatus(413);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"File size exceeds 100 MB limit.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
