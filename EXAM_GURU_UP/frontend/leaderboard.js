document.addEventListener("DOMContentLoaded", function () {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const filterBtn = document.getElementById("filterBtn");
    filterBtn.addEventListener("click", loadLeaderboard);

    async function loadLeaderboard() {

        try {

            const examType = document.getElementById("examTypeFilter").value;
            const subject = document.getElementById("subjectFilter").value;

            let url = `${API_BASE_URL}/api/score/leaderboard?`;

            const params = [];

            if (examType) params.push(`examType=${encodeURIComponent(examType)}`);
            if (subject) params.push(`subject=${encodeURIComponent(subject)}`);

            url += params.join("&");

            const res = await fetch(url, {
                headers: {
                    "Authorization": "Bearer " + token
                }
            });

            const data = await res.json();

            const tbody = document.getElementById("leaderboardBody");
            tbody.innerHTML = "";

            if (!data.top10 || data.top10.length === 0) {
                tbody.innerHTML = "<tr><td colspan='3'>No data found</td></tr>";
                return;
            }

            data.top10.forEach((item, index) => {

                let rowClass = "";
                if (index === 0) rowClass = "rank1";
                else if (index === 1) rowClass = "rank2";
                else if (index === 2) rowClass = "rank3";

                const row = `
                    <tr class="${rowClass}">
                        <td>${item.rank}</td>
                        <td>${item.name}</td>
                        <td>${item.score}</td>
                    </tr>
                `;

                tbody.innerHTML += row;
            });

            // Rank Info Update
            const infoDiv = document.getElementById("rankInfo");

            infoDiv.innerHTML = `
                <h3>Your Rank: ${data.userRank ?? "-"}</h3>
                <p>Total Participants: ${data.totalUsers ?? 0}</p>
                <p>You are Above ${data.percentile ?? 0}% People.</p>
            `;

        } catch (err) {
            console.error("Leaderboard Error:", err);
        }
    }

    // Auto load on page open
    loadLeaderboard();

});