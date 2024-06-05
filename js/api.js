// Initialisierung des Caches aus dem Local Storage
let cache = JSON.parse(localStorage.getItem("cache")) || {};

// Konfiguration der Endpunkte und Tokens
const apiUrl = "https://api.statev.de/req/";
const endpoints = {
  totalWeightLab: "factory/inventory/65ca64cb06965a9320fb010e",
  totalWeightCar: "factory/inventory/65ca64ca06965a9320fb0031",
  marketOffersBuyLab: "factory/marketOffers/buy/65ca64cb06965a9320fb010e",
  marketOffersSellLab: "factory/marketOffers/sell/65ca64cb06965a9320fb010e",
  status: "factory/list",
};
const tokens = {
  lab: "7YC9YM41X63SG52ZDL",
  car: "7YC9YM41X63SG52ZDL",
};

// Konfiguration der Fetch-Optionen
const fetchConfig = (token) => ({
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    authorization: "Bearer " + token,
  },
});

// Funktion zum Abrufen und Cachen von Daten
const fetchData = (endpoint, config) => {
  if (cache[endpoint] && Date.now() - cache[endpoint].timestamp < 600000) {
    return Promise.resolve(cache[endpoint].data);
  } else {
    return fetch(apiUrl + endpoint, config)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        cache[endpoint] = { data, timestamp: Date.now() };
        saveCacheToLocalStorage();
        return data;
      })
      .catch((error) => {
        console.error("Fehler beim Senden der Anfrage:", error);
        return { error: true };
      });
  }
};

// Funktion zum Speichern des Caches im Local Storage
const saveCacheToLocalStorage = () => {
  localStorage.setItem("cache", JSON.stringify(cache));
};

// Hauptfunktion zum Senden der Anfragen
const sendRequest = () => {
  const requests = [
    fetchData(endpoints.totalWeightLab, fetchConfig(tokens.lab)),
    fetchData(endpoints.totalWeightCar, fetchConfig(tokens.car)),
    fetchData(endpoints.status, fetchConfig(tokens.car)),
    fetchData(endpoints.status, fetchConfig(tokens.lab)),
    fetchData(endpoints.marketOffersBuyLab, fetchConfig(tokens.lab)),
    fetchData(endpoints.marketOffersSellLab, fetchConfig(tokens.lab)),
  ];

  Promise.all(requests).then(handleResponses);
};

// Funktion zum Verarbeiten der Antworten
const handleResponses = ([
  labData,
  carData,
  carStatus,
  labStatus,
  marketOffersBuyLab,
  marketOffersSellLab,
]) => {
  updateTotalWeight("totalWeightLab", labData, 1850);
  updateTotalWeight("totalWeightCar", carData, 7500);
  updateStatus("car-status", carStatus);
  updateStatus("lab-status", labStatus);
  updateMarketOffers("market-offers-buy", marketOffersBuyLab, 0.95);
  updateMarketOffers("market-offers-sell", marketOffersSellLab);
};

// Funktion zum Aktualisieren des Gewichts
const updateTotalWeight = (elementId, data, maxWeight) => {
  const element = document.getElementById(elementId);
  if (data.error) {
    element.innerText = "Datenabruf fehlgeschlagen. Versuche es später erneut!";
  } else {
    element.innerText = `${data.totalWeight.toFixed(0)}/${maxWeight} KG`;
  }
};

// Funktion zum Aktualisieren des Status
const updateStatus = (elementId, data) => {
  const element = document.getElementById(elementId);
  if (data.error) {
    element.innerHTML =
      "<strong class='statusweight'>Datenabruf fehlgeschlagen. Versuche es später erneut!</strong>";
  } else {
    element.innerHTML = data[0].isOpen
      ? "<a href='#' class='fa fa-check'></a>"
      : "<a href='#' class='fa fa-times'></a>";
  }
};

// Funktion zum Aktualisieren der Marktangebote
const updateMarketOffers = (tableId, data, taxes = 1) => {
  const tableBody = document.querySelector(`#${tableId} tbody`);
  tableBody.innerHTML = "";
  if (data.error) {
    console.error("Fehler beim Abrufen der Marktangebote:", data);
  } else {
    data.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.item}</td>
        <td>${item.availableAmount}</td>
        <td>${(item.pricePerUnit * taxes).toFixed(2)} $</td>
        <td>Labor</td>
      `;
      tableBody.appendChild(row);
    });
  }
};

// Timeout-Funktion zum Löschen des Caches nach 10 Minuten
setTimeout(() => {
  cache = {};
  saveCacheToLocalStorage();
}, 600000);

sendRequest();
