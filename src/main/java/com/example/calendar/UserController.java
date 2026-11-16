package com.example.calendar;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class UserController {

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    public UserController(
            JdbcTemplate jdbc,
            PasswordEncoder passwordEncoder) {
        this.jdbc = jdbc;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/register")
    public String showRegisterPage() {
        return "register";
    }

    @PostMapping("/register")
    public String register(
            @RequestParam String username,
            @RequestParam String password,
            Model model) {

        if (username.isBlank() || password.isBlank()) {
            model.addAttribute("error", "ユーザー名とパスワードを入力してください。");
            return "register";
        }

        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE username = ?",
                Integer.class,
                username
        );

        if (count != null && count > 0) {
            model.addAttribute("error", "このユーザー名はすでに使われています。");
            return "register";
        }

        String encodedPassword = passwordEncoder.encode(password);

        jdbc.update(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                username,
                encodedPassword
        );

        return "redirect:/login?registered";
    }
}