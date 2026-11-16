const API_URL = "/api/schedules";

let calendar;
let schedules = [];
let editingId = null;
var selectedScheduleId = null;

function getCsrfHeaders() {
    const tokenElement = document.querySelector('meta[name="_csrf"]');
    const headerElement = document.querySelector('meta[name="_csrf_header"]');

    if (!tokenElement || !headerElement) {
        console.error("CSRFトークンが見つかりません");
        return {};
    }

    const token = tokenElement.content;
    const header = headerElement.content;

    return {
        [header]: token
    };
}

const $ = id => document.getElementById(id);
const form = $("schedule-form");
const dialog = $("schedule-dialog");

document.addEventListener("DOMContentLoaded", async () => {

    calendar = new FullCalendar.Calendar($("calendar"), {
        initialView: "dayGridMonth",
        locale: "ja",
        height: "auto",
        dayMaxEvents: true,

        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: ""
        },

        dateClick(info) {
            openAdd(info.dateStr);
        },

        eventClick(info) {
            openEdit(info.event.id);
        }
    });

    calendar.render();

    $("add-button").addEventListener("click", function() {
        var today = new Date();

        var date = today.getFullYear() + "-" +
            String(today.getMonth() + 1).padStart(2, "0") + "-" +
            String(today.getDate()).padStart(2, "0");

        openAdd(date);
    });

    form.addEventListener("submit", saveSchedule);

    $("cancel-button").addEventListener("click", () => {
        dialog.close();
    });

    $("delete-button").addEventListener("click", deleteSchedule);

    await loadSchedules();

});

async function loadSchedules() {

    try {

        const response = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        console.log("予定取得ステータス:", response.status);
        console.log("アクセス先:", response.url);
        console.log(
            "Content-Type:",
            response.headers.get("content-type")
        );

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                "HTTPエラー: " + response.status +
                "\n" + errorText.substring(0, 500)
            );
        }

        const contentType =
            response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
            const errorText = await response.text();

            throw new Error(
                "JSON以外のデータが返されました:\n" +
                errorText.substring(0, 300)
            );
        }

        schedules = await response.json();

        calendar.removeAllEvents();

        schedules.forEach(function(s) {

            var eventTitle =
                s.companyName + "（" + s.eventType + "）";

            var eventStart = s.date;

            if (s.time) {
                eventStart = s.date + "T" + s.time;
            }

            calendar.addEvent({
                id: String(s.id),
                title: eventTitle,
                start: eventStart,
                allDay: !s.time,
                extendedProps: s
            });

        });

        renderUpcomingSchedules();

    } catch (error) {

        console.error("予定取得エラー:", error);

        alert(
            "予定を読み込めませんでした。サーバーを確認してください。"
        );

    }
}

function openAdd(date) {

    editingId = null;

    form.reset();

    $("dialog-title").textContent = "予定を追加";
    $("schedule-date").value = date;
    $("delete-button").hidden = true;

    dialog.showModal();

}

function openEdit(id) {

    const s = schedules.find(
        item => String(item.id) === String(id)
    );

    if (!s) return;

    editingId = s.id;

    $("dialog-title").textContent = "予定を編集";

    $("company-name").value = s.companyName;
    $("event-type").value = s.eventType;
    $("schedule-date").value = s.date;
    $("schedule-time").value = s.time || "";
    $("schedule-memo").value = s.memo || "";

    $("delete-button").hidden = false;

    dialog.showModal();

}

async function saveSchedule(event) {

    event.preventDefault();

    var data = {
        companyName: $("company-name").value.trim(),
        eventType: $("event-type").value,
        date: $("schedule-date").value,
        time: $("schedule-time").value,
        memo: $("schedule-memo").value.trim()
    };

    if (!data.companyName || !data.eventType || !data.date) {

        alert("企業名・予定の種類・日付を入力してください");

        return;
    }

    var editing = editingId !== null;

    var url = API_URL;

    if (editing) {
        url = API_URL + "/" + editingId;
    }

    try {

        var response = await fetch(url, {

            method: editing ? "PUT" : "POST",

            headers: {
                "Content-Type": "application/json",
                ...getCsrfHeaders()
            },

            body: JSON.stringify(data)

        });

        console.log("予定保存ステータス:", response.status);

        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                "保存エラー: " + response.status +
                "\n" + errorText.substring(0, 500)
            );

        }

        dialog.close();

        await loadSchedules();

    } catch (error) {

        console.error("予定保存エラー:", error);

        alert("予定を保存できませんでした。Consoleを確認してください。");

    }

}

async function deleteSchedule() {

    if (editingId === null) return;

    if (!confirm("この予定を削除しますか？")) return;

    try {

        const response = await fetch(
            `${API_URL}/${editingId}`,
            {
                method: "DELETE",
                headers: getCsrfHeaders()
            }
        );

        console.log("予定削除ステータス:", response.status);

        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                "削除エラー: " + response.status +
                "\n" + errorText.substring(0, 500)
            );

        }

        dialog.close();

        await loadSchedules();

    } catch (error) {

        console.error("予定削除エラー:", error);

        alert("予定を削除できませんでした。");

    }

}

function renderUpcomingSchedules() {

    var container = $("upcoming-schedules");

    container.innerHTML = "";

    var today = new Date();

    today.setHours(0, 0, 0, 0);

    var upcoming = schedules
        .filter(function(s) {

            var date = new Date(s.date + "T00:00:00");

            return date >= today;

        })
        .sort(function(a, b) {

            var aDate = a.date + "T" + (a.time || "00:00");

            var bDate = b.date + "T" + (b.time || "00:00");

            return aDate.localeCompare(bDate);

        });

    if (upcoming.length === 0) {

        container.innerHTML =
            '<p class="empty-message">今後の予定はありません。</p>';

        return;
    }

    upcoming.forEach(function(s) {

        var item = document.createElement("div");

        item.className = "upcoming-item";

        if (String(s.id) === String(selectedScheduleId)) {
            item.classList.add("selected");
        }

        var info = document.createElement("div");

        info.className = "upcoming-info";

        var date = document.createElement("div");

        date.className = "upcoming-date";

        date.textContent =
            s.date + (s.time ? " " + s.time : "");

        var title = document.createElement("div");

        title.className = "upcoming-title";

        title.textContent =
            s.companyName + "（" + s.eventType + "）";

        info.appendChild(date);

        info.appendChild(title);

        if (s.memo) {

            var memo = document.createElement("div");

            memo.className = "upcoming-memo";

            memo.textContent = s.memo;

            info.appendChild(memo);

        }

        var selectButton = document.createElement("button");

        selectButton.type = "button";

        selectButton.textContent = "選択";

        selectButton.addEventListener("click", function() {

            selectedScheduleId = s.id;

            renderUpcomingSchedules();

        });

        item.appendChild(info);

        item.appendChild(selectButton);

        container.appendChild(item);

    });

}

$("edit-selected-button").addEventListener("click", function() {

    if (selectedScheduleId === null) {

        alert("編集する予定を選択してください。");

        return;
    }

    openEdit(selectedScheduleId);

});

$("delete-selected-button").addEventListener("click", async function() {

    if (selectedScheduleId === null) {

        alert("削除する予定を選択してください。");

        return;
    }

    editingId = selectedScheduleId;

    await deleteSchedule();

    selectedScheduleId = null;

});