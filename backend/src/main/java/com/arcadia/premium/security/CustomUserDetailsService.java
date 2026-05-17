package com.arcadia.premium.security;

import com.arcadia.premium.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        List<SimpleGrantedAuthority> authorities = user.getRole() != null
                ? List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()))
                : Collections.emptyList();

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPassword(), user.isActive(),
                true, true, true, authorities);
    }
}
