package com.example.calendar.repository;

import com.example.calendar.entity.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<User> findByUsername(String username) {
        String sql = """
                SELECT id, username, password
                FROM users
                WHERE username = ?
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new User(
                        rs.getLong("id"),
                        rs.getString("username"),
                        rs.getString("password")
                ),
                username
        ).stream().findFirst();
    }
}