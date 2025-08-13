
class StockPortfolioTracker {
    constructor() {
        this.portfolioData = [];
        this.selectedIndices = ['SPY'];
        this.chart = null;
        this.initializeEventListeners();
        this.updateLastUpdateTime();
        this.startAutoUpdate();
    }

    initializeEventListeners() {
        document.getElementById('add-data').addEventListener('click', () => this.addPortfolioData());
        document.getElementById('update-chart').addEventListener('click', () => this.updateChart());
        document.getElementById('export-chart').addEventListener('click', () => this.exportChart());
        
        // Index selection checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.updateSelectedIndices(e));
        });

        // Smooth scrolling for navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    addPortfolioData() {
        const dateInput = document.getElementById('portfolio-date');
        const valueInput = document.getElementById('portfolio-value');
        
        const date = dateInput.value;
        const value = parseFloat(valueInput.value);
        
        if (!date || !value || value <= 0) {
            this.showTerminalMessage('ERROR: Invalid date or value', 'error');
            return;
        }

        // Check if date already exists
        if (this.portfolioData.some(data => data.date === date)) {
            this.showTerminalMessage('ERROR: Date already exists', 'error');
            return;
        }

        this.portfolioData.push({ date, value });
        this.portfolioData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        this.updatePortfolioTable();
        this.updateStats();
        this.showTerminalMessage(`SUCCESS: Added data point for ${date}`, 'success');
        
        // Clear inputs
        dateInput.value = '';
        valueInput.value = '';
    }

    updatePortfolioTable() {
        const tbody = document.querySelector('#portfolio-table tbody');
        tbody.innerHTML = '';

        this.portfolioData.forEach((data, index) => {
            const percentChange = this.calculatePercentChange(index);
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${data.date}</td>
                <td>$${data.value.toLocaleString()}</td>
                <td class="${percentChange >= 0 ? 'positive' : 'negative'}">
                    ${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%
                </td>
                <td>
                    <button class="stock-btn danger" onclick="tracker.removeData(${index})">
                        DELETE
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    calculatePercentChange(index) {
        if (index === 0 || this.portfolioData.length === 0) return 0;
        const baseValue = this.portfolioData[0].value;
        const currentValue = this.portfolioData[index].value;
        return ((currentValue - baseValue) / baseValue) * 100;
    }

    removeData(index) {
        this.portfolioData.splice(index, 1);
        this.updatePortfolioTable();
        this.updateStats();
        this.showTerminalMessage('Data point removed', 'info');
    }

    updateSelectedIndices(event) {
        const value = event.target.value;
        if (event.target.checked) {
            if (!this.selectedIndices.includes(value)) {
                this.selectedIndices.push(value);
            }
        } else {
            this.selectedIndices = this.selectedIndices.filter(index => index !== value);
        }
        this.showTerminalMessage(`Updated index selection: ${this.selectedIndices.join(', ')}`, 'info');
    }

    async updateChart() {
        if (this.portfolioData.length === 0) {
            this.showTerminalMessage('ERROR: No portfolio data to display', 'error');
            return;
        }

        this.showTerminalMessage('Fetching market data...', 'info');
        
        try {
            // Simulate API call for demo purposes
            const marketData = await this.fetchMarketData();
            this.renderChart(marketData);
            this.showTerminalMessage('Chart updated successfully', 'success');
        } catch (error) {
            this.showTerminalMessage('ERROR: Failed to fetch market data', 'error');
            console.error(error);
        }
    }

    async fetchMarketData() {
        // Simulate market data fetching
        // In a real implementation, this would call Alpha Vantage API
        return new Promise(resolve => {
            setTimeout(() => {
                const data = {};
                this.selectedIndices.forEach(index => {
                    data[index] = this.generateMockMarketData();
                });
                resolve(data);
            }, 1000);
        });
    }

    generateMockMarketData() {
        // Generate mock market data for demo
        const data = [];
        let value = 100;
        
        this.portfolioData.forEach((_, index) => {
            value += (Math.random() - 0.5) * 10;
            data.push(value);
        });
        
        return data;
    }

    renderChart(marketData) {
        const ctx = document.getElementById('performance-chart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = this.portfolioData.map(data => data.date);
        const portfolioPercentages = this.portfolioData.map((_, index) => this.calculatePercentChange(index));
        
        const datasets = [{
            label: 'Your Portfolio',
            data: portfolioPercentages,
            borderColor: '#00ff41',
            backgroundColor: 'rgba(0, 255, 65, 0.1)',
            borderWidth: 3,
            tension: 0.1
        }];

        // Add market index datasets
        const colors = ['#ff0040', '#ffcc00', '#00ccff', '#ff8800', '#cc00ff'];
        let colorIndex = 0;

        this.selectedIndices.forEach(index => {
            if (marketData[index]) {
                const indexPercentages = marketData[index].map((value, i) => {
                    if (i === 0) return 0;
                    return ((value - marketData[index][0]) / marketData[index][0]) * 100;
                });

                datasets.push({
                    label: index,
                    data: indexPercentages,
                    borderColor: colors[colorIndex % colors.length],
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    tension: 0.1
                });
                colorIndex++;
            }
        });

        this.chart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Portfolio vs Market Performance',
                        color: '#00ff41',
                        font: { size: 16, family: 'Courier New' }
                    },
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: { family: 'Courier New' }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#cccccc', font: { family: 'Courier New' } },
                        grid: { color: '#333333' }
                    },
                    y: {
                        ticks: { 
                            color: '#cccccc',
                            font: { family: 'Courier New' },
                            callback: function(value) {
                                return value.toFixed(1) + '%';
                            }
                        },
                        grid: { color: '#333333' }
                    }
                }
            }
        });
    }

    exportChart() {
        if (!this.chart) {
            this.showTerminalMessage('ERROR: No chart to export', 'error');
            return;
        }

        const link = document.createElement('a');
        link.download = `beat-the-market-portfolio-${new Date().toISOString().split('T')[0]}.png`;
        link.href = this.chart.toBase64Image();
        link.click();
        
        this.showTerminalMessage('Chart exported successfully', 'success');
    }

    updateStats() {
        const totalReturnEl = document.getElementById('total-return');
        const vsSp500El = document.getElementById('vs-sp500');
        const dataPointsEl = document.getElementById('data-points');
        
        if (this.portfolioData.length > 0) {
            const totalReturn = this.calculatePercentChange(this.portfolioData.length - 1);
            totalReturnEl.textContent = `${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`;
            totalReturnEl.className = totalReturn >= 0 ? 'positive' : 'negative';
        }
        
        dataPointsEl.textContent = this.portfolioData.length;
        
        // Mock S&P 500 comparison
        const mockSp500Return = (Math.random() * 20 - 10);
        vsSp500El.textContent = `${mockSp500Return >= 0 ? '+' : ''}${mockSp500Return.toFixed(2)}%`;
    }

    updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        document.getElementById('last-update').textContent = timeString;
    }

    startAutoUpdate() {
        setInterval(() => {
            this.updateLastUpdateTime();
        }, 60000); // Update every minute
    }

    showTerminalMessage(message, type = 'info') {
        const terminalBody = document.querySelector('.terminal-body');
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        const timestamp = new Date().toLocaleTimeString();
        const typeLabel = type.toUpperCase();
        
        line.innerHTML = `
            <span class="output ${type}">[${timestamp}] [${typeLabel}] ${message}</span>
        `;
        
        terminalBody.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
        
        // Keep only last 10 messages
        const lines = terminalBody.querySelectorAll('.terminal-line');
        if (lines.length > 14) { // Keep initial 4 + last 10
            lines[4].remove();
        }
    }
}

// Add CSS for positive/negative values
const style = document.createElement('style');
style.textContent = `
    .positive { color: #00ff41 !important; }
    .negative { color: #ff0040 !important; }
    .stock-btn.danger {
        border-color: #ff0040;
        color: #ff0040;
        padding: 0.3rem 0.8rem;
        font-size: 0.8rem;
    }
`;
document.head.appendChild(style);

// Initialize the tracker when the page loads
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new StockPortfolioTracker();
});
