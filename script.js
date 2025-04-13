// ข้อมูลของสินค้าแต่ละชิ้น รวมถึง video url, ราคา, คำอธิบาย, และช่วงเวลาที่จะ highlight
const product = [
  { video: "https://www.w3schools.com/html/mov_bbb.mp4", 
    title: "-- Select Anyone --" },
  { video: "C:/Users/user/Downloads/osfstorage-archive/Clips (small size)/DEEPB_9b_c.mov", 
    pupil: "avg_pupil_per_250ms.csv",
    title: "หมีเด็ก", 
    highlights: [{ start: 1, end: 3 }] },
  { video: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4", 
    title: "Product 2", 
    highlights: [{ start: 1, end: 2 }, { start: 3, end: 4 }] },
  { video: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4", 
    title: "หมีเด็ก1", 
    highlights: [{ start: 1, end: 3 }] },
  { video: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4", 
    title: "Product 12", 
    highlights: [{ start: 1, end: 2 }, { start: 3, end: 4 }] },
  { video: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4", 
    title: "หมีเด็ก11", 
    highlights: [{ start: 1, end: 3 }] },
  { video: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4", 
    title: "Product 112", 
    highlights: [{ start: 1, end: 2 }, { start: 3, end: 4 }] }
];

// จำนวนสินค้าสูงสุดที่อนุญาตให้เลือกเปรียบเทียบพร้อมกัน
const maxCompare = 2;

// เมื่อโหลดหน้าเว็บเสร็จ ให้แสดง checkbox สำหรับเลือกสินค้า
window.onload = () => {
  const container = document.getElementById("checkboxContainer");
  for (let i = 1; i < product.length; i++) {
    container.innerHTML += `
      <div class="form-check mb-2">
        <input class="form-check-input" type="checkbox" value="${i}" onchange="handleSelection()" id="check${i}" />
        <label class="form-check-label" for="check${i}">${product[i].title}</label>
      </div>
    
      `;
  }
};

// ฟังก์ชันที่ทำงานเมื่อมีการเลือก checkbox สินค้า
function handleSelection() {
  const checked = [...document.querySelectorAll("#checkboxContainer input[type=checkbox]:checked")];
  const compareArea = document.getElementById("compareArea");

  if (checked.length > maxCompare) {
    alert("You can compare only 2 products.");
    checked[checked.length - 1].checked = false;
    return;
  }

  compareArea.innerHTML = "";
  compareArea.classList.toggle("single", checked.length === 1);
  compareArea.classList.toggle("row", checked.length !== 1);

  checked.forEach(checkbox => {
    const i = parseInt(checkbox.value);
    const p = product[i];

    const videoBox = document.createElement("div");
    videoBox.className = "col-12 col-md-6 product-box";
    videoBox.innerHTML = `
      <div class="video-wrapper mb-2">
        <div class="video-label-static">${p.title}</div>
        <video id="video-${i}">
          <source src="${p.video}" type="video/mp4">
        </video>
      </div>
    `;
    compareArea.appendChild(videoBox);

    // สร้างกราฟ pupil ถ้ามี
    if (p.pupil) {
      fetch(p.pupil)
        .then(res => res.text())
        .then(csvText => {
          const rows = csvText.trim().split('\n').slice(1);
          const labels = [], data = [];
    
          rows.forEach(row => {
            const [group_interval, avg_pupil_size] = row.split(',');
            labels.push(parseFloat(group_interval) * 0.25); // เป็นวินาที
            data.push(parseFloat(avg_pupil_size));
          });
    
          const canvas = document.createElement('canvas');
          canvas.id = `chart-${i}`;
          canvas.style.height = "200px";
          videoBox.appendChild(canvas);
    
          const ctx = canvas.getContext('2d');
    
          const chart = new Chart(ctx, {
            type: 'line',
            data: {
              labels,
              datasets: [{
                label: 'Pupil Size',
                data,
                borderWidth: 2,
                fill: false,
                tension: 0.3
              }]
            },
            options: {
              responsive: true,
              animation: false,
              plugins: {
                annotation: {
                  annotations: {
                    line1: {
                      type: 'line',
                      borderColor: 'red',
                      borderWidth: 2,
                      scaleID: 'x',
                      value: 0,
                      label: {
                        enabled: true,
                        content: 'Now',
                        position: 'start'
                      }
                    }
                  }
                },
                legend: { display: false }
              },
              scales: {
                x: { title: { display: true, text: "Time (s)" } },
                y: { title: { display: true, text: "Pupil Size" } }
              }
            },
            plugins: [ChartAnnotation]
          });
    
          const video = document.getElementById(`video-${i}`);
          video.addEventListener("timeupdate", () => {
            chart.options.plugins.annotation.annotations.line1.value = video.currentTime;
            chart.update('none');
          });
        })
        .catch(err => {
          console.error("ไม่สามารถโหลดกราฟ pupil ได้:", err);
          const errorMsg = document.createElement('p');
          errorMsg.style.color = 'red';
          errorMsg.textContent = "โหลดกราฟ pupil size ไม่สำเร็จ";
          videoBox.appendChild(errorMsg);
        });
    }
    

    // รอ DOM พร้อมก่อนสร้างปุ่มควบคุม
    setTimeout(() => {
      const video = document.getElementById(`video-${i}`);
      createCustomControls(video, p.highlights || []);
      video.controls = false;
      video.addEventListener('click', () => video.paused ? video.play() : video.pause());
    }, 0);
  });
}


// สร้างปุ่มควบคุมและ progress bar สำหรับแต่ละ video
function createCustomControls(video, highlights) {
  if (video.parentElement.querySelector('.custom-controls-wrapper')) return;

  const wrapper = document.createElement("div");
  wrapper.className = "custom-controls-wrapper";

  const progressWrapper = document.createElement("div");
  progressWrapper.className = "progress-wrapper";

  const playBtn = document.createElement("button");
  playBtn.textContent = "▶️";
  playBtn.className = "control-btn";
  playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    video.paused ? video.play() : video.pause();
  });
  video.addEventListener("play", () => playBtn.textContent = "⏸️");
  video.addEventListener("pause", () => playBtn.textContent = "▶️");

  const muteBtn = document.createElement("button");
  muteBtn.textContent = video.muted ? "🔇" : "🔊";
  muteBtn.className = "control-btn";
  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    video.muted = !video.muted;
    muteBtn.textContent = video.muted ? "🔇" : "🔊";
  });

  const fullscreenBtn = document.createElement("button");
  fullscreenBtn.textContent = "⛶";
  fullscreenBtn.className = "control-btn";
  fullscreenBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (video.requestFullscreen) video.requestFullscreen();
    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
    else if (video.msRequestFullscreen) video.msRequestFullscreen();
  });

  const progressBar = document.createElement("div");
  progressBar.className = "custom-progress-bar";

  const progressFill = document.createElement("div");
  progressFill.className = "progress-fill";
  progressBar.appendChild(progressFill);

  const timeLabel = document.createElement("span");
  timeLabel.className = "video-time-label";
  timeLabel.textContent = "00.000 / 00.000";

  const format = t => t.toFixed(3).padStart(6, '0');

// ด้านใน createCustomControls
const tooltip = document.createElement("div");
tooltip.className = "progress-tooltip";
tooltip.style.display = "none";
progressBar.appendChild(tooltip);

progressBar.addEventListener("mousemove", (e) => {
  const rect = progressBar.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percent = x / rect.width;
  const timeAtPoint = video.duration * percent;

  tooltip.textContent = format(timeAtPoint);
  tooltip.style.left = `${x}px`;
  tooltip.style.display = "block";
});

progressBar.addEventListener("mouseleave", () => {
  tooltip.style.display = "none";
});



  highlights.forEach(h => {
    const marker = document.createElement("span");
    marker.className = "highlight-marker";
    marker.title = `${h.start}s - ${h.end}s`;
    progressBar.appendChild(marker);
  });

  progressBar.addEventListener("click", (e) => {
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    video.currentTime = percent * video.duration;
  });

  video.addEventListener("loadedmetadata", () => {
    highlights.forEach((h, idx) => {
      const marker = progressBar.querySelectorAll(".highlight-marker")[idx];
      const start = (h.start / video.duration) * 100;
      const end = (h.end / video.duration) * 100;
      marker.style.left = `${start}%`;
      marker.style.width = `${end - start}%`;
    });
    timeLabel.textContent = `${format(0)} / ${format(video.duration)}`;
  });

  video.addEventListener("timeupdate", () => {
    if (video.duration > 0) {
      const percent = (video.currentTime / video.duration) * 100;
      progressFill.style.width = `${percent}%`;
      timeLabel.textContent = `${format(video.currentTime)} / ${format(video.duration)}`;
    }
  });

  progressWrapper.appendChild(playBtn);
  progressWrapper.appendChild(progressBar);
  progressWrapper.appendChild(muteBtn);
  progressWrapper.appendChild(fullscreenBtn);
  progressWrapper.appendChild(timeLabel);
  wrapper.appendChild(progressWrapper);
  video.parentElement.appendChild(wrapper);
}
