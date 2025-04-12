const product = [
  {
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    price: "",
    description: "",
    brand: "",
    title: "-- Select Anyone --"
  },
  {
    video: "WINGE_9a_c.mov",
    price: "1000",
    description: "This is product 1",
    brand: "Brand Aa",
    title: "Product 1"
  },
  {
    video: "https://samplelib.com/lib/preview/mp4/sample-10s.mp4",
    price: "2000",
    description: "This is product 2",
    brand: "Brand B",
    title: "Product 2"
  },
  {
    video: "https://samplelib.com/lib/preview/mp4/sample-15s.mp4",
    price: "3000",
    description: "This is product 3",
    brand: "Brand C",
    title: "Product 3"
  }
];

const maxCompare = 2;

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

function handleSelection() {
  const checked = Array.from(document.querySelectorAll("#checkboxContainer input[type=checkbox]:checked"));
  if (checked.length > maxCompare) {
    alert("You can compare only 2 products.");
    checked[checked.length - 1].checked = false;
    return;
  }

  const compareArea = document.getElementById("compareArea");
  compareArea.innerHTML = "";

  const names = [];

  checked.forEach((checkbox) => {
    const i = parseInt(checkbox.value);
    const p = product[i];
    names.push(p.title);

    const columnClass = checked.length === 1 ? "col-12" : "col-md-6";

    compareArea.innerHTML += `
      <div class="${columnClass} product-box mb-4">
        <div class="video-wrapper position-relative mb-3">
          <video controls id="video-${i}">
            <source src="${p.video}" type="video/mp4">
          </video>
          <div class="video-label">${p.title}</div>
        </div>
        <p><strong>Price:</strong> PKR ${p.price}</p>
        <p><strong>Description:</strong> ${p.description}</p>
        <p><strong>Brand:</strong> ${p.brand}</p>
      </div>
    `;
  });

  document.querySelector("h1").innerText = names.length === 2
    ? `${names[0]} vs ${names[1]}`
    : "Compare Products";
}
