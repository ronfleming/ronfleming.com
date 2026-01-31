/**
 * Currency Hold Calculator
 * Compares holding currency A and exchanging later vs. exchanging now and holding currency B
 */

(function () {
    'use strict';

    // DOM Elements
    const form = document.getElementById('calculator-form');
    const resultsSection = document.getElementById('results');

    // Currency direction elements
    const directionInputs = document.querySelectorAll(
        'input[name="currency-direction"]',
    );
    const amountPrefix = document.getElementById('amount-prefix');
    const rateCurrentLabel = document.getElementById('rate-current-label');
    const rateTargetLabel = document.getElementById('rate-target-label');
    const exchangeNowExample = document.getElementById('exchange-now-example');

    // Result elements
    const verdictEl = document.getElementById('verdict');
    const barHoldTitle = document.getElementById('bar-hold-title');
    const barHoldAmount = document.getElementById('bar-hold-amount');
    const barHoldFill = document.getElementById('bar-hold-fill');
    const barConvertTitle = document.getElementById('bar-convert-title');
    const barConvertAmount = document.getElementById('bar-convert-amount');
    const barConvertFill = document.getElementById('bar-convert-fill');
    const breakdownEl = document.getElementById('breakdown');

    // Currency symbols
    const symbols = {
        usd: '$',
        eur: '€',
    };

    /**
     * Get current currency direction
     */
    function getDirection() {
        const checked = document.querySelector(
            'input[name="currency-direction"]:checked',
        );
        return checked ? checked.value : 'usd-to-eur';
    }

    /**
     * Get currencies based on direction
     */
    function getCurrencies() {
        const direction = getDirection();
        if (direction === 'usd-to-eur') {
            return { from: 'usd', to: 'eur', fromLabel: 'USD', toLabel: 'EUR' };
        } else {
            return { from: 'eur', to: 'usd', fromLabel: 'EUR', toLabel: 'USD' };
        }
    }

    /**
     * Update UI labels based on currency direction
     */
    function updateLabels() {
        const { from, to, fromLabel, toLabel } = getCurrencies();

        amountPrefix.textContent = symbols[from];
        rateCurrentLabel.textContent = fromLabel;
        rateTargetLabel.textContent = toLabel;

        if (from === 'usd') {
            exchangeNowExample.textContent = 'e.g. 0.84 means $1 = €0.84';
        } else {
            exchangeNowExample.textContent = 'e.g. 1.19 means €1 = $1.19';
        }
    }

    /**
     * Calculate compound interest
     * @param {number} principal - Starting amount
     * @param {number} annualRate - Annual interest rate (as decimal, e.g., 0.035 for 3.5%)
     * @param {number} months - Number of months
     * @param {string} compounding - 'monthly' or 'annual'
     * @returns {number} Final amount
     */
    function calculateInterest(principal, annualRate, months, compounding) {
        if (compounding === 'monthly') {
            // Monthly compounding: A = P(1 + r/12)^n where n = months
            const monthlyRate = annualRate / 12;
            return principal * Math.pow(1 + monthlyRate, months);
        } else {
            // Annual compounding: A = P(1 + r)^t where t = years
            const years = months / 12;
            return principal * Math.pow(1 + annualRate, years);
        }
    }

    /**
     * Format currency for display
     */
    function formatCurrency(amount, currency) {
        const symbol = symbols[currency] || '';
        return (
            symbol +
            amount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
        );
    }

    /**
     * Format percentage
     */
    function formatPercent(value) {
        return value.toFixed(2) + '%';
    }

    /**
     * Perform the calculation and display results
     */
    function calculate() {
        const { from, to, fromLabel, toLabel } = getCurrencies();

        // Get form values
        const amount = parseFloat(document.getElementById('amount').value) || 0;
        const rateCurrent =
            parseFloat(document.getElementById('rate-current').value) / 100 ||
            0;
        const rateTarget =
            parseFloat(document.getElementById('rate-target').value) / 100 || 0;
        const exchangeNow =
            parseFloat(document.getElementById('exchange-now').value) || 0;
        const exchangeFuture =
            parseFloat(document.getElementById('exchange-future').value) || 0;
        const timeValue =
            parseInt(document.getElementById('time-value').value) || 1;
        const timeUnit = document.getElementById('time-unit').value;
        const compounding = document.querySelector(
            'input[name="compounding"]:checked',
        ).value;

        // Convert time to months
        const months = timeUnit === 'years' ? timeValue * 12 : timeValue;

        // Scenario 1: Hold in current currency, earn interest, then exchange
        const holdGrown = calculateInterest(
            amount,
            rateCurrent,
            months,
            compounding,
        );
        const holdThenExchange = holdGrown * exchangeFuture;

        // Scenario 2: Exchange now, then hold in target currency and earn interest
        const exchangedNow = amount * exchangeNow;
        const convertThenHold = calculateInterest(
            exchangedNow,
            rateTarget,
            months,
            compounding,
        );

        // Determine winner
        const difference = Math.abs(holdThenExchange - convertThenHold);
        const percentDiff =
            (Math.max(holdThenExchange, convertThenHold) /
                Math.min(holdThenExchange, convertThenHold) -
                1) *
            100;

        let winner, winnerText, verdictClass;

        if (Math.abs(holdThenExchange - convertThenHold) < 0.01) {
            winner = 'tie';
            winnerText = "It's essentially a wash";
            verdictClass = 'tie';
        } else if (holdThenExchange > convertThenHold) {
            winner = 'hold';
            winnerText = `Hold your ${fromLabel} and exchange later`;
            verdictClass = '';
        } else {
            winner = 'convert';
            winnerText = `Exchange to ${toLabel} now`;
            verdictClass = '';
        }

        // Update verdict
        verdictEl.className =
            'verdict' + (verdictClass ? ' ' + verdictClass : '');
        verdictEl.innerHTML = `
            <div class="verdict-label">${
                winner === 'tie' ? 'Result' : 'Better Option'
            }</div>
            <p class="verdict-text">${winnerText}</p>
            <p class="verdict-detail">
                ${
                    winner === 'tie'
                        ? 'Both options yield approximately the same result.'
                        : `You'd end up with ${formatCurrency(
                              difference,
                              to,
                          )} more (${formatPercent(percentDiff)} better).`
                }
            </p>
        `;

        // Update bar chart
        const maxAmount = Math.max(holdThenExchange, convertThenHold);
        const holdPercent = (holdThenExchange / maxAmount) * 100;
        const convertPercent = (convertThenHold / maxAmount) * 100;

        // Time period text
        const timeText =
            timeValue +
            ' ' +
            (timeUnit === 'years'
                ? timeValue === 1
                    ? 'year'
                    : 'years'
                : timeValue === 1
                ? 'month'
                : 'months');

        barHoldTitle.textContent = `Hold ${fromLabel} → Exchange in ${timeText}`;
        barHoldAmount.textContent = formatCurrency(holdThenExchange, to);
        barHoldFill.style.width = holdPercent + '%';
        barHoldFill.classList.toggle('winner', winner === 'hold');

        barConvertTitle.textContent = `Exchange Now → Hold ${toLabel}`;
        barConvertAmount.textContent = formatCurrency(convertThenHold, to);
        barConvertFill.style.width = convertPercent + '%';
        barConvertFill.classList.toggle('winner', winner === 'convert');

        // Update breakdown
        const interestEarnedHold = holdGrown - amount;
        const interestEarnedConvert = convertThenHold - exchangedNow;

        breakdownEl.innerHTML = `
            <div class="breakdown-title">How we calculated this</div>
            
            <div class="breakdown-item">
                <span class="breakdown-label">Starting amount</span>
                <span class="breakdown-value">${formatCurrency(
                    amount,
                    from,
                )}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Time period</span>
                <span class="breakdown-value">${timeText}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Compounding</span>
                <span class="breakdown-value">${
                    compounding === 'monthly' ? 'Monthly' : 'Annual'
                }</span>
            </div>
            
            <div class="breakdown-title" style="margin-top: var(--spacing-sm);">Option 1: Hold & Exchange Later</div>
            <div class="breakdown-item">
                <span class="breakdown-label">${fromLabel} after ${timeText} at ${formatPercent(
            rateCurrent * 100,
        )}</span>
                <span class="breakdown-value">${formatCurrency(
                    holdGrown,
                    from,
                )}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Interest earned</span>
                <span class="breakdown-value">${formatCurrency(
                    interestEarnedHold,
                    from,
                )}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Exchanged at ${exchangeFuture} rate</span>
                <span class="breakdown-value">${formatCurrency(
                    holdThenExchange,
                    to,
                )}</span>
            </div>
            
            <div class="breakdown-title" style="margin-top: var(--spacing-sm);">Option 2: Exchange Now & Hold</div>
            <div class="breakdown-item">
                <span class="breakdown-label">Exchanged today at ${exchangeNow} rate</span>
                <span class="breakdown-value">${formatCurrency(
                    exchangedNow,
                    to,
                )}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">${toLabel} after ${timeText} at ${formatPercent(
            rateTarget * 100,
        )}</span>
                <span class="breakdown-value">${formatCurrency(
                    convertThenHold,
                    to,
                )}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Interest earned</span>
                <span class="breakdown-value">${formatCurrency(
                    interestEarnedConvert,
                    to,
                )}</span>
            </div>
        `;

        // Show results
        resultsSection.hidden = false;

        // Scroll to results on mobile
        if (window.innerWidth <= 600) {
            resultsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }

    /**
     * Initialize event listeners
     */
    function init() {
        // Update labels when direction changes
        directionInputs.forEach((input) => {
            input.addEventListener('change', updateLabels);
        });

        // Handle form submission
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            calculate();
        });

        // Initial label setup
        updateLabels();
    }

    // Start the app
    init();
})();
