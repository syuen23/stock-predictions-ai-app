import { dates } from "/utils/dates";

const UI_ELEMENTS = {
    generateReportBtn: document.querySelector(".generate-report-btn"),
    tickerInput: document.getElementById("ticker-input"),
    tickerForm: document.getElementById("ticker-input-form"),
    tickerDisplay: document.querySelector(".ticker-choice-display"),
    actionPanel: document.querySelector(".action-panel"),
    loadingPanel: document.querySelector(".loading-panel"),
    outputPanel: document.querySelector(".output-panel"),
    apiMessage: document.getElementById("api-message"),
    tickerLabel: document.querySelector('label[for="ticker-input"]'),
};

const MESSAGES = {
    invalidTicker:
        "You must add at least one ticker. A ticker is a 3 letter or more code for a stock. E.g TSLA for Tesla.",
    loadingError: "There was an error fetching stock data.",
    aiError: "Unable to access AI. Please refresh and try again",
    defaultTickerText: "Your tickers will appear here...",
};

const TICKER_VALIDATION = {
    minLength: 3,
    maxLength: 4,
    maxTickers: 3,
};

const tickersArr = [];

UI_ELEMENTS.tickerForm.addEventListener("submit", handleTickerSubmit);
UI_ELEMENTS.generateReportBtn.addEventListener("click", fetchStockData);

function handleTickerSubmit(e) {
    e.preventDefault();
    const tickerValue = UI_ELEMENTS.tickerInput.value;

    if (tickerValue.length < TICKER_VALIDATION.minLength) {
        showError("Ticker must be at least 3 characters long.");
    } else if (tickerValue.length > TICKER_VALIDATION.maxLength) {
        showError("Ticker must be no more than 4 characters long.");
    } else if (tickersArr.length >= TICKER_VALIDATION.maxTickers) {
        showError("You can only add up to 3 tickers.");
    } else if (tickersArr.includes(tickerValue.toUpperCase())) {
        showError("Ticker already added.");
    } else {
        addTicker(tickerValue);
    }
}

function addTicker(ticker) {
    UI_ELEMENTS.generateReportBtn.disabled = true;
    tickersArr.push(ticker.toUpperCase());
    UI_ELEMENTS.tickerInput.value = "";
    renderTickers();
    UI_ELEMENTS.generateReportBtn.disabled = false;
}

function showError(message) {
    UI_ELEMENTS.tickerLabel.style.color = "red";
    UI_ELEMENTS.tickerLabel.textContent = message;
}

function resetApp() {
    tickersArr.length = 0;
    renderTickers();
    UI_ELEMENTS.outputPanel.innerHTML = "";
    UI_ELEMENTS.outputPanel.style.display = "none";
    UI_ELEMENTS.actionPanel.style.display = "flex";
    UI_ELEMENTS.tickerDisplay.textContent = MESSAGES.defaultTickerText;
    UI_ELEMENTS.tickerInput.value = "";
    UI_ELEMENTS.generateReportBtn.disabled = false;
}

function renderTickers() {
    const tickersDiv = document.querySelector(".ticker-choice-display");
    tickersDiv.innerHTML = "";
    tickersArr.forEach((ticker) => {
        const newTickerSpan = document.createElement("span");
        newTickerSpan.textContent = ticker;
        newTickerSpan.classList.add("ticker");
        tickersDiv.appendChild(newTickerSpan);
    });
}

const loadingArea = document.querySelector(".loading-panel");
const apiMessage = document.getElementById("api-message");

async function fetchStockData() {
    UI_ELEMENTS.actionPanel.style.display = "none";
    UI_ELEMENTS.loadingPanel.style.display = "flex";
    try {
        const stockData = await Promise.all(
            tickersArr.map(async (ticker) => {
                const baseUrl =
                    "https://polygon-api-worker.simonyuenjr.workers.dev/";
                const url = `${baseUrl}?ticker=${ticker}&startDate=${dates.startDate}&endDate=${dates.endDate}`;

                const response = await fetch(url);
                if (!response.ok) {
                    const error = await response.text();
                    throw new Error(`Worker error: ${error}`);
                }
                apiMessage.innerText = "Creating report...";
                return response.text();
            })
        );
        fetchReport(stockData.join(""));
    } catch (err) {
        loadingArea.innerText = "There was an error fetching stock data.";
        generateReportBtn.disabled = true;
        addResetBtn(loadingArea);
        console.error(err.message);
    }
}

async function fetchReport(data) {
    const messages = [
        {
            role: "system",
            content:
                "You are a stock trading guru. Given data on share prices over the past 3 days, write a report of no more than 150 words describing each stock's performance and recommending whether to buy, hold or sell. You should reference each of the stock tickers provided, no others. Use the examples provided between ### to set the style of your response.",
        },
        {
            role: "user",
            content: `${data}
            ###
            Over the past three days, Tesla (TSLA) shares have plummetted. The stock opened at $223.98 and closed at $202.11 on the third day, with some jumping around in the meantime. This is a great time to buy! But not a great time to sell!
            ###
            Apple (AAPL) shot up from $150.22 to a jaw-dropping $175.36 by the close of day three. If you’re sitting on AAPL stock, hold on to it because this baby is just getting warmed up! For AAPL, my advice is to stay in your position!
            ###
            `,
        },
    ];

    try {
        const url = "https://openai-api-worker.simonyuenjr.workers.dev/";
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(messages),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Worker error: ${data.error}`);
        }
        renderReport(data.content);
    } catch (err) {
        console.error(err.message);
        loadingArea.innerText =
            "Unable to access AI. Please refresh and try again";
    }
}

function addResetBtn(container) {
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Add New Tickers";
    resetBtn.classList.add("add-new-tickers");
    resetBtn.addEventListener("click", resetApp);
    container.appendChild(resetBtn);
}

function renderReport(output) {
    UI_ELEMENTS.loadingPanel.style.display = "none";
    const outputArea = UI_ELEMENTS.outputPanel;
    const report = document.createElement("p");
    report.textContent = output;
    outputArea.appendChild(report);
    outputArea.style.display = "flex";
    addResetBtn(outputArea);
}
