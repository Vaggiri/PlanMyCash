// Initialize variables
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let editModal = new bootstrap.Modal(document.getElementById('editModal'));
let categoryChart, monthlyTrendChart;

// DOM Elements
const transactionForm = document.getElementById('transactionForm');
const transactionsTable = document.getElementById('transactionsTable');
const noTransactions = document.getElementById('noTransactions');
const totalCreditEl = document.getElementById('totalCredit');
const totalDebitEl = document.getElementById('totalDebit');
const balanceEl = document.getElementById('balance');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const exportPdfBtn = document.getElementById('exportPdf');
const chartsSection = document.getElementById('chartsSection');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today
    document.getElementById('date').valueAsDate = new Date();
    
    // Load transactions
    updateTransactions();
    updateSummary();
    
    // Initialize charts if there are transactions
    if (transactions.length > 0) {
        chartsSection.classList.remove('d-none');
        initCharts();
    }
});

// Add new transaction
transactionForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;
    const category = document.getElementById('category').value;
    
    const transaction = {
        id: Date.now(),
        description,
        amount,
        type,
        date,
        category
    };
    
    transactions.push(transaction);
    saveTransactions();
    updateTransactions();
    updateSummary();
    
    // Reset form
    transactionForm.reset();
    document.getElementById('date').valueAsDate = new Date();
    
    // Show charts section if this is the first transaction
    if (transactions.length === 1) {
        chartsSection.classList.remove('d-none');
    }
    
    // Update charts
    if (transactions.length > 0) {
        updateCharts();
    }
});

// Edit transaction
document.getElementById('saveEdit').addEventListener('click', function() {
    const id = parseInt(document.getElementById('editId').value);
    const description = document.getElementById('editDescription').value;
    const amount = parseFloat(document.getElementById('editAmount').value);
    const type = document.getElementById('editType').value;
    const date = document.getElementById('editDate').value;
    const category = document.getElementById('editCategory').value;
    
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        transactions[index] = { id, description, amount, type, date, category };
        saveTransactions();
        updateTransactions();
        updateSummary();
        updateCharts();
    }
    
    editModal.hide();
});

// Search transactions
searchButton.addEventListener('click', searchTransactions);
searchInput.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
        searchTransactions();
    }
});

// Export to PDF
exportPdfBtn.addEventListener('click', exportToPdf);

// Update transactions list
function updateTransactions() {
    if (transactions.length === 0) {
        transactionsTable.innerHTML = '';
        noTransactions.classList.remove('d-none');
        chartsSection.classList.add('d-none');
        return;
    }
    
    noTransactions.classList.add('d-none');
    
    // Sort transactions by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let html = '';
    transactions.forEach(transaction => {
        const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const amountClass = transaction.type === 'credit' ? 'text-success' : 'text-danger';
        const amountSign = transaction.type === 'credit' ? '+' : '-';
        
        html += `
            <tr class="new-transaction">
                <td>${formattedDate}</td>
                <td>${transaction.description}</td>
                <td>
                    <span class="badge bg-light text-dark">${transaction.category}</span>
                </td>
                <td>
                    <span class="badge ${transaction.type === 'credit' ? 'badge-credit' : 'badge-debit'}">
                        ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                </td>
                <td class="${amountClass} fw-bold">${amountSign}₹${transaction.amount.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${transaction.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${transaction.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    transactionsTable.innerHTML = html;
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            editTransaction(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            deleteTransaction(id);
        });
    });
}

// Edit transaction
function editTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        document.getElementById('editId').value = transaction.id;
        document.getElementById('editDescription').value = transaction.description;
        document.getElementById('editAmount').value = transaction.amount;
        document.getElementById('editType').value = transaction.type;
        document.getElementById('editDate').value = transaction.date;
        document.getElementById('editCategory').value = transaction.category;
        
        editModal.show();
    }
}

// Delete transaction
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateTransactions();
        updateSummary();
        
        if (transactions.length === 0) {
            chartsSection.classList.add('d-none');
        } else {
            updateCharts();
        }
    }
}

// Update summary
function updateSummary() {
    const totalCredit = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalDebit = transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalCredit - totalDebit;
    
    totalCreditEl.textContent = `₹${totalCredit.toFixed(2)}`;
totalDebitEl.textContent = `₹${totalDebit.toFixed(2)}`;
balanceEl.textContent = `₹${balance.toFixed(2)}`;
}

// Search transactions
function searchTransactions() {
    const searchTerm = searchInput.value.toLowerCase();
    
    if (!searchTerm) {
        updateTransactions();
        return;
    }
    
    const filtered = transactions.filter(t => 
        t.description.toLowerCase().includes(searchTerm) || 
        t.category.toLowerCase().includes(searchTerm) ||
        t.type.toLowerCase().includes(searchTerm) ||
        t.amount.toString().includes(searchTerm) ||
        new Date(t.date).toLocaleDateString().includes(searchTerm)
    );
    
    if (filtered.length === 0) {
        transactionsTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    No transactions found matching "${searchTerm}"
                </td>
            </tr>
        `;
    } else {
        let html = '';
        filtered.forEach(transaction => {
            const formattedDate = new Date(transaction.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            const amountClass = transaction.type === 'credit' ? 'text-success' : 'text-danger';
            const amountSign = transaction.type === 'credit' ? '+' : '-';
            
            html += `
                <tr>
                    <td>${formattedDate}</td>
                    <td>${transaction.description}</td>
                    <td>
                        <span class="badge bg-light text-dark">${transaction.category}</span>
                    </td>
                    <td>
                        <span class="badge ${transaction.type === 'credit' ? 'badge-credit' : 'badge-debit'}">
                            ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                    </td>
                    <td class="${amountClass} fw-bold">${amountSign}₹${transaction.amount.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${transaction.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${transaction.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        transactionsTable.innerHTML = html;
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                editTransaction(id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteTransaction(id);
            });
        });
    }
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Initialize charts
function initCharts() {
    const ctx1 = document.getElementById('categoryChart').getContext('2d');
    const ctx2 = document.getElementById('monthlyTrendChart').getContext('2d');
    
    categoryChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#4361ee',
                    '#3f37c9',
                    '#4cc9f0',
                    '#4895ef',
                    '#f72585',
                    '#f8961e',
                    '#7209b7',
                    '#b5179e'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                title: {
                    display: true,
                    text: 'Spending by Category',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
    
    monthlyTrendChart = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Credit',
                    data: [],
                    backgroundColor: '#4cc9f0',
                    borderColor: '#4cc9f0',
                    borderWidth: 1
                },
                {
                    label: 'Debit',
                    data: [],
                    backgroundColor: '#f72585',
                    borderColor: '#f72585',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Trends',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
    
    updateCharts();
}

// Update charts with current data
function updateCharts() {
    if (!categoryChart || !monthlyTrendChart) {
        initCharts();
        return;
    }
    
    // Category chart data
    const categories = {};
    transactions.forEach(t => {
        if (t.type === 'debit') {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        }
    });
    
    categoryChart.data.labels = Object.keys(categories);
    categoryChart.data.datasets[0].data = Object.values(categories);
    categoryChart.update();
    
    // Monthly trend chart data
    const monthlyData = {};
    transactions.forEach(t => {
        const date = new Date(t.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { credit: 0, debit: 0 };
        }
        
        if (t.type === 'credit') {
            monthlyData[monthYear].credit += t.amount;
        } else {
            monthlyData[monthYear].debit += t.amount;
        }
    });
    
    const months = Object.keys(monthlyData);
    const credits = months.map(m => monthlyData[m].credit);
    const debits = months.map(m => monthlyData[m].debit);
    
    monthlyTrendChart.data.labels = months;
    monthlyTrendChart.data.datasets[0].data = credits;
    monthlyTrendChart.data.datasets[1].data = debits;
    monthlyTrendChart.update();
}

// Export to PDF
function exportToPdf() {
    const { jsPDF } = window.jspdf;
    
    // Show loading state
    exportPdfBtn.innerHTML = '<i class="bi bi-hourglass"></i> Generating PDF...';
    exportPdfBtn.disabled = true;
    
    // Create a temporary div with only the content we want to export
    const pdfContent = document.createElement('div');
    pdfContent.style.padding = '20px';
    pdfContent.style.backgroundColor = '#fff';
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Finance Tracker Report';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    title.style.color = '#4361ee';
    pdfContent.appendChild(title);
    
    // Add summary section
    const summarySection = document.createElement('div');
    summarySection.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div style="flex: 1; text-align: center; padding: 10px; border: 1px solid #4cc9f0; border-radius: 8px;">
                <h4 style="color: #4cc9f0; margin-bottom: 5px;">Total Credit</h4>
                <p style="font-size: 18px; font-weight: bold;">₹${calculateTotalCredit().toFixed(2)}</p>
            </div>
            <div style="flex: 1; text-align: center; padding: 10px; margin: 0 10px; border: 1px solid #f72585; border-radius: 8px;">
                <h4 style="color: #f72585; margin-bottom: 5px;">Total Debit</h4>
                <p style="font-size: 18px; font-weight: bold;">₹${calculateTotalDebit().toFixed(2)}</p>
            </div>
            <div style="flex: 1; text-align: center; padding: 10px; border: 1px solid #4361ee; border-radius: 8px;">
                <h4 style="color: #4361ee; margin-bottom: 5px;">Balance</h4>
                <p style="font-size: 18px; font-weight: bold;">₹${(calculateTotalCredit() - calculateTotalDebit()).toFixed(2)}</p>
            </div>
        </div>
    `;
    pdfContent.appendChild(summarySection);
    
    // Add transactions table
    const tableSection = document.createElement('div');
    tableSection.innerHTML = `
        <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">Transaction History</h3>
        ${generatePdfTableHtml()}
    `;
    pdfContent.appendChild(tableSection);
    
    // Add charts section
    const chartsContainer = document.createElement('div');
    chartsContainer.style.marginTop = '30px';
    chartsContainer.innerHTML = `
        <h3 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px;">Financial Overview</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            <div style="flex: 1; min-width: 300px;">
                <canvas id="tempCategoryChart" height="250"></canvas>
            </div>
            <div style="flex: 1; min-width: 300px;">
                <canvas id="tempMonthlyChart" height="250"></canvas>
            </div>
        </div>
    `;
    pdfContent.appendChild(chartsContainer);
    
    // Add to DOM temporarily
    document.body.appendChild(pdfContent);
    
    // Render charts on the temporary elements
    const tempCategoryCtx = document.getElementById('tempCategoryChart').getContext('2d');
    const tempMonthlyCtx = document.getElementById('tempMonthlyChart').getContext('2d');
    
    // Create temporary charts
    const tempCategoryChart = new Chart(tempCategoryCtx, getCategoryChartConfig());
    const tempMonthlyChart = new Chart(tempMonthlyCtx, getMonthlyChartConfig());
    
    // Use html2canvas to capture the content
    html2canvas(pdfContent, {
        scale: 2,
        logging: false,
        useCORS: true,
        scrollY: -window.scrollY
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 190; // A4 width minus margins
        const pageHeight = 277; // A4 height minus margins
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        pdf.save('finance-report.pdf');
        
        // Clean up
        document.body.removeChild(pdfContent);
        tempCategoryChart.destroy();
        tempMonthlyChart.destroy();
        
        // Reset button state
        exportPdfBtn.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Export PDF';
        exportPdfBtn.disabled = false;
    }).catch(err => {
        console.error('Error generating PDF:', err);
        alert('Error generating PDF. Please try again.');
        
        // Clean up
        document.body.removeChild(pdfContent);
        if (tempCategoryChart) tempCategoryChart.destroy();
        if (tempMonthlyChart) tempMonthlyChart.destroy();
        
        // Reset button state
        exportPdfBtn.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Export PDF';
        exportPdfBtn.disabled = false;
    });
}

function generatePdfTableHtml() {
    if (transactions.length === 0) {
        return '<p>No transactions found</p>';
    }
    
    let html = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                    <th style="padding: 10px; text-align: left;">Date</th>
                    <th style="padding: 10px; text-align: left;">Description</th>
                    <th style="padding: 10px; text-align: left;">Category</th>
                    <th style="padding: 10px; text-align: left;">Type</th>
                    <th style="padding: 10px; text-align: right;">Amount (₹)</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    transactions.forEach(transaction => {
        const formattedDate = new Date(transaction.date).toLocaleDateString('en-IN');
        const amountClass = transaction.type === 'credit' ? 'color: #4cc9f0;' : 'color: #f72585;';
        const amountSign = transaction.type === 'credit' ? '+' : '-';
        
        html += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 10px;">${formattedDate}</td>
                <td style="padding: 8px 10px;">${transaction.description}</td>
                <td style="padding: 8px 10px;">${transaction.category}</td>
                <td style="padding: 8px 10px; text-transform: capitalize;">${transaction.type}</td>
                <td style="padding: 8px 10px; text-align: right; ${amountClass} font-weight: bold;">
                    ${amountSign}₹${transaction.amount.toFixed(2)}
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table>`;
    return html;
}
function getCategoryChartConfig() {
    const categories = {};
    transactions.forEach(t => {
        if (t.type === 'debit') {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        }
    });
    
    return {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#4361ee',
                    '#3f37c9',
                    '#4cc9f0',
                    '#4895ef',
                    '#f72585',
                    '#f8961e',
                    '#7209b7',
                    '#b5179e'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Spending by Category',
                    font: {
                        size: 14
                    }
                }
            }
        }
    };
}


function getMonthlyChartConfig() {
    const monthlyData = {};
    transactions.forEach(t => {
        const date = new Date(t.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = { credit: 0, debit: 0 };
        }
        
        if (t.type === 'credit') {
            monthlyData[monthYear].credit += t.amount;
        } else {
            monthlyData[monthYear].debit += t.amount;
        }
    });
    
    const months = Object.keys(monthlyData);
    const credits = months.map(m => monthlyData[m].credit);
    const debits = months.map(m => monthlyData[m].debit);
    
    return {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Credit',
                    data: credits,
                    backgroundColor: '#4cc9f0',
                    borderColor: '#4cc9f0',
                    borderWidth: 1
                },
                {
                    label: 'Debit',
                    data: debits,
                    backgroundColor: '#f72585',
                    borderColor: '#f72585',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Trends',
                    font: {
                        size: 14
                    }
                }
            }
        }
    };
}
function calculateTotalCredit() {
    return transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
}

function calculateTotalDebit() {
    return transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
}