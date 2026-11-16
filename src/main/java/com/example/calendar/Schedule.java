package com.example.calendar;

public class Schedule {
    private int id;
    private String companyName;
    private String eventType;
    private String date;
    private String time;
    private String memo;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getMemo() { return memo; }
    public void setMemo(String memo) { this.memo = memo; }
}