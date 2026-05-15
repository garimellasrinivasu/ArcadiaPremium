package com.arcadia.premium.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Forwards all non-API, non-static-asset routes to index.html
 * so the React SPA router can handle them.
 *
 * ONLY active when app.spa.forward-enabled=true (local single-server mode).
 * In production (Netlify + Render), this is disabled by default.
 *
 * To enable locally: set SPA_FORWARD=true environment variable,
 * or the start-server.sh script sets it automatically.
 */
@Controller
@ConditionalOnProperty(name = "app.spa.forward-enabled", havingValue = "true", matchIfMissing = false)
public class SpaForwardController {

    @RequestMapping(value = {
        "/",
        "/login",
        "/users/**",
        "/roles",
        "/activities/**",
        "/admin/**",
        "/reports/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
