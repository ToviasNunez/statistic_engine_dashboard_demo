// src/js/chart.js
// Use dynamic URL detection for chart.js (legacy JS file)
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:8080`;
  } else {
    return "http://localhost:8080";
  }
};
const backendUrl = getApiBaseUrl();
const socket = io(backendUrl);
const ctx = document.getElementById("realtimeChart").getContext("2d");
const data = {
  labels: [],
  datasets: [{
    label: 'Download Time (s)',
    data: [],
    borderWidth: 2,
    fill: false
  }]
};

const chart = new Chart(ctx, {
  type: 'line',
  data: data,
  options: {
    scales: {
      x: { title: { display: true, text: 'Timestamp' }},
      y: { title: { display: true, text: 'Seconds' }}
    }
  }
});

socket.on("update", (payload) => {
  const { timestamp, download_time_sec } = payload;
  data.labels.push(timestamp);
  data.datasets[0].data.push(download_time_sec);
  if (data.labels.length > 20) {
    data.labels.shift();
    data.datasets[0].data.shift();
  }
  chart.update();
});
