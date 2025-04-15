const maxCompare = 2;

window.onload = () => {
  const container = document.getElementById("checkboxContainer");
  container.classList.add("carousel-container");

  for (let i = 1; i < product.length; i++) {
    const p = product[i];
    const image = document.createElement("img");
    image.src = p.imagec;
    image.alt = p.title;
    image.title = p.title;
    image.className = "carousel-image";
    image.dataset.index = i;

    // --- Custom tooltip on hover ---
    // --- Custom tooltip ---
    image.addEventListener("mouseenter", (e) => {
      const tooltip = document.createElement("div");
      tooltip.className = "image-tooltip";
      tooltip.id = "image-tooltip";
      tooltip.textContent = p.title;
      document.body.appendChild(tooltip);
    });

    image.addEventListener("mousemove", (e) => {
      const tooltip = document.getElementById("image-tooltip");
      if (tooltip) {
        tooltip.style.left = `${e.clientX}px`;
        tooltip.style.top = `${e.clientY - 40}px`;
      }
    });

    image.addEventListener("mouseleave", () => {
      const tooltip = document.getElementById("image-tooltip");
      if (tooltip) tooltip.remove();
    });


    image.addEventListener("click", () => {
      // --- Custom tooltip ---
     
      image.classList.toggle("selected");

      const selected = [...container.querySelectorAll(".carousel-image.selected")];
      if (selected.length > maxCompare) {
        image.classList.remove("selected");
        alert("You can compare only 2 products.");
        return;
      }

      if (image.classList.contains("selected")) {
        image.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }

      handleSelection();
    });

    container.appendChild(image);

    // Default pre-select first item
    if (i === 1) {
      image.classList.add("selected");
    }
  }

  handleSelection();





};

// ทำให้ปุ่มเลื่อนซ้าย/ขวาใช้งานได้
document.getElementById("scrollLeft").addEventListener("click", () => {
  const container = document.getElementById("checkboxContainer");
  container.scrollBy({ left: -200, behavior: 'smooth' });
});

document.getElementById("scrollRight").addEventListener("click", () => {
  const container = document.getElementById("checkboxContainer");
  container.scrollBy({ left: 200, behavior: 'smooth' });
});


function handleSelection() {
  const checked = [...document.querySelectorAll("#checkboxContainer .carousel-image.selected")];
  const compareArea = document.getElementById("compareArea");

  if (checked.length > maxCompare) return;

  compareArea.innerHTML = "";

  checked.forEach(checkbox => {
    const i = parseInt(checkbox.dataset.index);
    const p = product[i];

    const videoBox = document.createElement("div");
    videoBox.className = "col-12 col-md-6 product-box";
    videoBox.innerHTML = `
      <div class="video-wrapper mb-2">
        <div class="video-label-static">${p.title}</div>
        <video id="video-${i}">
          <source src="${p.videoOptions?.[selectedVersionIndex]?.url || ''}" type="video/mp4">
        </video>
      </div>`;
    compareArea.appendChild(videoBox);

    let chart = null;
    if (p.pupilData) {
      const scaledPupilData = p.pupilData.map(pt => ({ x: pt.x, y: pt.y }));

      const canvas = document.createElement("canvas");
      canvas.height = 120;
      canvas.id = `chart-${i}`;
      videoBox.appendChild(canvas);

      if (p.image) {
        const img = document.createElement("img");
        img.src = p.image;
        img.alt = `${p.title} image`;
        img.style.maxWidth = "100%";
        img.style.marginTop = "8px";
        img.style.borderRadius = "10px";
        videoBox.appendChild(img);
      }

      chart = new Chart(canvas, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'avg.normalized.pupil',
              data: scaledPupilData,
              borderColor: '#21296E',
              borderWidth: 1,
              pointRadius: 0,
              pointHitRadius: 6
            },
            {
              label: 'Current Time',
              data: [{ x: 0, y: null }],
              borderColor: '#ED2E7C',
              backgroundColor: '#ED2E7C',
              pointRadius: 5,
              type: 'scatter',
              showLine: false
            }
          ]
        },
        options: {
          animation: false,
          interaction: { mode: 'index', intersect: false },
          onClick: function (evt, activeEls, chart) {
            const scaleX = chart.scales.x;
            if (!scaleX || typeof scaleX.getValueForPixel !== 'function') return;

            const pos = Chart.helpers.getRelativePosition(evt, chart);
            const offsetX = pos.x;
            const xValue = scaleX.getValueForPixel(offsetX);

            const canvasId = chart.canvas.id;
            const videoId = canvasId.replace("chart-", "video-");
            const video = document.getElementById(videoId);

            if (video && !isNaN(xValue)) {
              video.pause();
              video.currentTime = xValue / 1000;
              video.play();
            }
          },
          scales: {

            x: {
              type: 'linear',
              title: { display: true, text: 'Time (s)' },
              ticks: {
                callback: val => (val / 1000).toFixed(1)
              }
            },
            y: {
              title: { display: true, text: 'Avg Normalized Pupil Size' }
            }
          },
          plugins: {
            legend: { display: false },
            dragData: false,
            tooltip: {
              enabled: true,
              callbacks: {
                title: () => '',
                label: function (context) {
                  // ซ่อน tooltip สำหรับเส้น scatter ที่ label ชื่อ "Current Time"
                  if (context.dataset.label === 'Current Time') return '';
            
                  const xSec = (context.parsed.x / 1000).toFixed(2);
                  const yVal = context.parsed.y?.toFixed(3);
                  return [`เวลา: ${xSec} วินาที`, `z-score: ${yVal}`];
                }
              }
            }
            
          }
        }
      });

      setTimeout(() => chart.update(), 0);
      p._chart = chart;
      p._pupilDataSec = scaledPupilData;
    }

    setTimeout(() => {
      const video = document.getElementById(`video-${i}`);
      createCustomControls(video, p.highlights || [], p);
      video.controls = false;
      video.addEventListener('click', () => video.paused ? video.play() : video.pause());
    }, 0);
  });
}

function getYatTime(data, t) {
  if (!data || data.length === 0) return null;
  for (let i = 1; i < data.length; i++) {
    if (data[i].x >= t) {
      const x0 = data[i - 1].x, y0 = data[i - 1].y;
      const x1 = data[i].x, y1 = data[i].y;
      const alpha = (t - x0) / (x1 - x0);
      return y0 + alpha * (y1 - y0);
    }
  }
  return data[data.length - 1].y;
}

function getYatTime(data, t) {
  if (!data || data.length === 0) return null;
  for (let i = 1; i < data.length; i++) {
    if (data[i].x >= t) {
      const x0 = data[i - 1].x, y0 = data[i - 1].y;
      const x1 = data[i].x, y1 = data[i].y;
      const alpha = (t - x0) / (x1 - x0);
      return y0 + alpha * (y1 - y0);
    }
  }
  return data[data.length - 1].y;
}

function createCustomControls(video, highlights, productObj) {
  if (video.parentElement.querySelector('.custom-controls-wrapper')) return;

  const wrapper = document.createElement("div");
  wrapper.className = "custom-controls-wrapper";

  const topControls = document.createElement("div");
  topControls.style.display = "flex";
  topControls.style.alignItems = "center";
  topControls.style.justifyContent = "space-between";
  topControls.style.gap = "8px";
  topControls.style.marginBottom = "4px";

  const playBtn = document.createElement("button");
  playBtn.textContent = "▶️";
  playBtn.className = "control-btn";
  playBtn.addEventListener("click", e => {
    e.stopPropagation();
    video.paused ? video.play() : video.pause();
  });
  video.addEventListener("play", () => playBtn.textContent = "⏸️");
  video.addEventListener("pause", () => playBtn.textContent = "▶️");

  const muteBtn = document.createElement("button");
  muteBtn.textContent = video.muted ? "🔇" : "🔊";
  muteBtn.className = "control-btn";
  muteBtn.addEventListener("click", e => {
    e.stopPropagation();
    video.muted = !video.muted;
    muteBtn.textContent = video.muted ? "🔇" : "🔊";
  });

  const fullscreenBtn = document.createElement("button");
  fullscreenBtn.textContent = "⛶";
  fullscreenBtn.className = "control-btn";
  fullscreenBtn.addEventListener("click", e => {
    e.stopPropagation();
    if (video.requestFullscreen) video.requestFullscreen();
  });

  const timeLabel = document.createElement("span");
  timeLabel.className = "video-time-label";
  timeLabel.textContent = "00.000 / 00.000";

  topControls.appendChild(playBtn);
  topControls.appendChild(muteBtn);
  topControls.appendChild(fullscreenBtn);
  topControls.appendChild(timeLabel);

  const progressWrapper = document.createElement("div");



  // --- กำหนดให้ videoBox สามารถเป็นตำแหน่งอ้างอิงได้ ---
  video.parentElement.style.position = "relative";



  progressWrapper.className = "progress-wrapper";

  // สร้างข้อความหน้าเส้น
  const startLabel = document.createElement("span");
  startLabel.textContent = "ากหหฟฟหหหฟ....ใใใใใใใใใใใ....";
  startLabel.style.fontSize = "0.25rem";
  startLabel.style.color = "#fff";
  startLabel.style.minWidth = "32px";

  // สร้างข้อความหลังเส้น
  const endLabel = document.createElement("span");
  endLabel.textContent = "";
  endLabel.style.fontSize = "0.75rem";
  endLabel.style.color = "#fff";
  endLabel.style.minWidth = "10px";

  const progressBar = document.createElement("div");
  progressBar.className = "custom-progress-bar";

  const progressFill = document.createElement("div");
  progressFill.className = "progress-fill";
  progressBar.appendChild(progressFill);

  const tooltip = document.createElement("div");
  tooltip.className = "progress-tooltip";
  tooltip.style.display = "none";
  progressBar.appendChild(tooltip);

  // ใส่ลงใน progressWrapper
  progressWrapper.appendChild(startLabel);
  progressWrapper.appendChild(progressBar);
  progressWrapper.appendChild(endLabel);


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
  progressBar.addEventListener("click", (e) => {
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    video.currentTime = percent * video.duration;
  });

  highlights.forEach(h => {
    const marker = document.createElement("span");
    marker.className = "highlight-marker";
    progressBar.appendChild(marker);
  });

  const format = t => t.toFixed(3).padStart(6, '0');

  video.addEventListener("loadedmetadata", () => {
    highlights.forEach((h, idx) => {
      const marker = progressBar.querySelectorAll(".highlight-marker")[idx];
      const start = (h.start / video.duration) * 100;
      const end = (h.end / video.duration) * 100;
      marker.style.left = `${start}%`;
      marker.style.width = `${end - start}%`;

      // Add hover tooltip using title attribute
      marker.addEventListener("mouseenter", (e) => {
        const tooltip = document.createElement("div");
        tooltip.className = "highlight-tooltip";
        const duration = (h.end - h.start).toFixed(2);
        tooltip.textContent = `Fixation Period: ${duration}s`;
        marker.appendChild(tooltip);
      });

      marker.addEventListener("mouseleave", () => {
        const tooltip = marker.querySelector(".highlight-tooltip");
        if (tooltip) tooltip.remove();
      });
    });

    timeLabel.textContent = `${format(0)} / ${format(video.duration)}`;
  });

  video.addEventListener("timeupdate", () => {
    if (video.duration > 0) {
      const percent = (video.currentTime / video.duration) * 100;
      progressFill.style.width = `${percent}%`;
      timeLabel.textContent = `${format(video.currentTime)} / ${format(video.duration)}`;

      const currentTimeMS = video.currentTime * 1000;

      if (productObj && productObj._chart && productObj._pupilDataSec) {
        const y = getYatTime(productObj._pupilDataSec, currentTimeMS);
        productObj._chart.data.datasets[1].data = [{ x: currentTimeMS, y }];
        productObj._chart.update('none');
      }

      if (productObj._chart && productObj._verticalLine) {
        const scaleX = productObj._chart.scales.x;
        if (scaleX && currentTimeMS >= scaleX.min && currentTimeMS <= scaleX.max) {
          const xPos = scaleX.getPixelForValue(currentTimeMS);
          const chartCanvas = productObj._chart.canvas;
          const chartRect = chartCanvas.getBoundingClientRect();
          const parentRect = video.parentElement.getBoundingClientRect();

          const top = chartRect.top - parentRect.top;
          const height = progressWrapper.offsetTop - top;

          productObj._verticalLine.style.left = `${xPos}px`;
          productObj._verticalLine.style.top = `${top}px`;
          productObj._verticalLine.style.height = `${height}px`;
          productObj._verticalLine.style.display = "block";
        } else {
          productObj._verticalLine.style.display = "none";
        }
      }


    }

  });


  wrapper.appendChild(topControls);
  wrapper.appendChild(progressWrapper);
  video.parentElement.appendChild(wrapper);
}


let selectedVersionIndex = 0;
const versionNames = ["Heatmap", "COI"];

function updateVideoVersion() {
  const isChecked = document.getElementById("versionToggle").checked;
  selectedVersionIndex = isChecked ? 1 : 0;
  document.getElementById("versionLabel").innerHTML = `<strong>${versionNames[selectedVersionIndex]}</strong>`;

  const checked = [...document.querySelectorAll("#checkboxContainer .carousel-image.selected")];
  checked.forEach(checkbox => {
    const i = parseInt(checkbox.dataset.index);
    const videoEl = document.getElementById(`video-${i}`);
    const p = product[i];

    if (p.videoOptions && videoEl) {
      const newURL = p.videoOptions[selectedVersionIndex].url;
      const currentTime = videoEl.currentTime;
      videoEl.querySelector("source").src = newURL;
      videoEl.load();
      videoEl.currentTime = currentTime;
      videoEl.play();

      const labelEl = videoEl.parentElement.querySelector('.video-label-static');
      if (labelEl) {
        labelEl.textContent = `${p.title} - ${versionNames[selectedVersionIndex]}`;
      }
    }
  });
}


