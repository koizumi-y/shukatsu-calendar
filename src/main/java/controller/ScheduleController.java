package com.example.calendar.controller;

import com.example.calendar.Schedule;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.sql.Date;
import java.sql.Time;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    private final JdbcTemplate jdbc;

    // 使用するユーザーID
    private static final int USER_ID = 1;

    public ScheduleController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // 予定を取得
    @GetMapping
    public List<Schedule> getAll() {

        return jdbc.query(
                "SELECT * FROM schedules WHERE user_id = ? ORDER BY date, time",
                (rs, rowNum) -> {
                    Schedule s = new Schedule();

                    s.setId(rs.getInt("id"));
                    s.setCompanyName(rs.getString("company_name"));
                    s.setEventType(rs.getString("event_type"));
                    s.setDate(rs.getDate("date").toString());

                    Time time = rs.getTime("time");
                    s.setTime(
                            time == null ? "" : time.toString().substring(0, 5)
                    );

                    s.setMemo(rs.getString("memo"));

                    return s;
                },
                USER_ID
        );
    }

    // 予定を新規登録
    @PostMapping
    public int add(@RequestBody Schedule s) {

        String sql = """
            INSERT INTO schedules
            (user_id, company_name, event_type, date, time, memo)
            VALUES (?, ?, ?, ?, ?, ?)
            """;

        return jdbc.update(
                sql,
                USER_ID,
                s.getCompanyName(),
                s.getEventType(),
                Date.valueOf(s.getDate()),
                toTime(s.getTime()),
                s.getMemo()
        );
    }

    // 予定を編集
    @PutMapping("/{id}")
    public int edit(
            @PathVariable int id,
            @RequestBody Schedule s) {

        String sql = """
            UPDATE schedules
            SET company_name = ?,
                event_type = ?,
                date = ?,
                time = ?,
                memo = ?
            WHERE id = ? AND user_id = ?
            """;

        return jdbc.update(
                sql,
                s.getCompanyName(),
                s.getEventType(),
                Date.valueOf(s.getDate()),
                toTime(s.getTime()),
                s.getMemo(),
                id,
                USER_ID
        );
    }

    // 予定を削除
    @DeleteMapping("/{id}")
    public int delete(@PathVariable int id) {

        return jdbc.update(
                "DELETE FROM schedules WHERE id = ? AND user_id = ?",
                id,
                USER_ID
        );
    }

    // 時間をSQL用に変換
    private Time toTime(String value) {

        if (value == null || value.isBlank()) {
            return null;
        }

        return Time.valueOf(
                value.length() == 5 ? value + ":00" : value
        );
    }
}
