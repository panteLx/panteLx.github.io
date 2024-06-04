// Initialisierung des Caches aus dem Local Storage
let cache = JSON.parse(localStorage.getItem("cache")) || {};

function sendRequest() {
  const apiUrl = "https://api.statev.de/req/";

  const totalWeightEndpointLab = "factory/inventory/65ca64cb06965a9320fb010e";
  const totalWeightEndpointCar = "factory/inventory/65ca64ca06965a9320fb0031";

  const statusEndpoint = "factory/list";
  const bearerTokenLab = "7YC9YM41X63SG52ZDL";
  //  const bearerTokenCar = "F9UKIAKBZDHWY6H6JG";
  const bearerTokenCar = "7YC9YM41X63SG52ZDL";
  const corsAnywhereUrl = "https://statevproxy.pantelx.com/"; // CORS Proxy - Fliegt bei IC Website raus

  const fetchConfig = (bearerToken) => ({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      authorization: "Bearer " + bearerToken,
    },
  });

  const fetchData = (endpoint, config) => {
    // Überprüfen, ob die Daten im Cache vorhanden sind und ob sie älter als 10 Min sind
    if (cache[endpoint] && Date.now() - cache[endpoint].timestamp < 600000) {
      return Promise.resolve(cache[endpoint].data);
    } else {
      return fetch(corsAnywhereUrl + apiUrl + endpoint, config)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((data) => {
          // Daten im Cache speichern mit Zeitstempel
          cache[endpoint] = { data: data, timestamp: Date.now() };
          saveCacheToLocalStorage(); // Cache im Local Storage speichern
          return data;
        })
        .catch((error) => {
          console.error("Fehler beim Senden der Anfrage:", error);
          return { error: true };
        });
    }
  };

  Promise.all([
    fetchData(totalWeightEndpointLab, fetchConfig(bearerTokenLab)),
    fetchData(totalWeightEndpointCar, fetchConfig(bearerTokenCar)),
    fetchData(statusEndpoint, fetchConfig(bearerTokenCar)),
    fetchData(statusEndpoint, fetchConfig(bearerTokenLab)),
  ]).then(([labData, carData, carStatus, labStatus]) => {
    const totalWeightDivLab = document.getElementById("totalWeightLab");
    const totalWeightDivCar = document.getElementById("totalWeightCar");
    const carStatusDiv = document.getElementById("car-status");
    const labStatusDiv = document.getElementById("lab-status");

    if (labData.error) {
      totalWeightDivLab.innerText =
        "Datenabruf fehlgeschlagen. Versuche es später erneut!";
    } else {
      totalWeightDivLab.innerText = `${labData.totalWeight.toFixed(0)}/1850 KG`;
    }

    if (carData.error) {
      totalWeightDivCar.innerText =
        "Datenabruf fehlgeschlagen. Versuche es später erneut!";
    } else {
      totalWeightDivCar.innerText = `${carData.totalWeight.toFixed(0)}/7500 KG`;
    }

    if (carStatus.error) {
      carStatusDiv.innerHTML =
        "<strong class='statusweight'>Datenabruf fehlgeschlagen. Versuche es später erneut!</strong>";
    } else {
      carStatusDiv.innerHTML = carStatus[0].isOpen
        ? "<a href='#' class='fa fa-check'></a>"
        : "<a href='#' class='fa fa-times'></a>";
    }

    if (labStatus.error) {
      labStatusDiv.innerHTML =
        "<strong class='statusweight'>Datenabruf fehlgeschlagen. Versuche es später erneut!</strong>";
    } else {
      labStatusDiv.innerHTML = labStatus[0].isOpen
        ? "<a href='#' class='fa fa-check'></a>"
        : "<a href='#' class='fa fa-times'></a>";
    }
  });
}

// Funktion zum Speichern des Caches im Local Storage
function saveCacheToLocalStorage() {
  localStorage.setItem("cache", JSON.stringify(cache));
}

// Timeout-Funktion zum Löschen des Caches nach 10 Min
setTimeout(() => {
  cache = {}; // Cache löschen
  saveCacheToLocalStorage(); // Cache im Local Storage aktualisieren
}, 600000);

sendRequest();
