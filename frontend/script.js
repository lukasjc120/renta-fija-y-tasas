const API_URL = 'http://localhost:3000/api';
let bancos = [];
let chartInstance = null;
let bancoSeleccionado = '';
let periodoSeleccionado = '1m';

function calcularTEA(tna) {
    return (Math.pow(1 + tna / 100 / 12, 12) - 1) * 100;
}

function ganancia30dias(tna) {
    return 100000 * (tna / 100) / 365 * 30;
}

function renderTabla(data = bancos) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = data.map(b => {
        const tea = calcularTEA(b.tna);
        const ganancia = ganancia30dias(b.tna);
        return `
            <tr>
                <td>${b.nombre}</td>
                <td>${parseFloat(b.tna).toFixed(2)}%</td>
                <td>${tea.toFixed(2)}%</td>
                <td>$${ganancia.toLocaleString('es-AR', {maximumFractionDigits: 0})}</td>
            </tr>
        `;
    }).join('');
}

function llenarSelectBancos() {
    const select = document.getElementById('bancoSelect');
    select.innerHTML = '<option value="">Seleccionar banco...</option>' +
        bancos.map(b => `<option value="${b.nombre}">${b.nombre}</option>`).join('');
}

async function cargarTasas() {
    try {
        const res = await fetch(`${API_URL}/tasas`);
        bancos = await res.json();
        renderTabla();
        llenarSelectBancos();
        const fecha = new Date(bancos[0].fecha_actualizacion);
        document.getElementById('updateBadge').textContent = `Actualizado: ${fecha.toLocaleString('es-AR')}`;
        if (bancos[0]) {
            document.getElementById('tna').value = bancos[0].tna;
            document.getElementById('tnaCarry').value = bancos[0].tna;
            calcular();
            calcularCarry();
        }
    } catch (err) { console.error('Error:', err); }
}

async function cargarDolar() {
    try {
        const res = await fetch(`${API_URL}/dolar`);
        const dolares = await res.json();
        const blue = dolares.find(d => d.tipo === 'blue');
        if (blue) {
            document.getElementById('dolarHoy').value = blue.venta;
            calcularCarry();
        }
    } catch (err) { console.error('Error dólar:', err); }
}

async function cargarGrafico() {
    if (!bancoSeleccionado) return;
    try {
        const res = await fetch(`${API_URL}/historial/${encodeURIComponent(bancoSeleccionado)}?periodo=${periodoSeleccionado}`);
        const datos = await res.json();
        if (datos.length === 0) return alert('No hay datos históricos para este período');

        const labels = datos.map(d => {
            const fecha = new Date(d.fecha);
            return periodoSeleccionado === '1d' || periodoSeleccionado === '1w'
              ? fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
                : fecha.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
        });
        const valores = datos.map(d => parseFloat(d.tna));

        if (chartInstance) chartInstance.destroy();
        const ctx = document.getElementById('chartTasas').getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `TNA ${bancoSeleccionado}`,
                    data: valores,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { ticks: { callback: (val) => val + '%' } } }
            }
        });
    } catch (err) { console.error('Error gráfico:', err); }
}

document.getElementById('search').addEventListener('input', (e) => {
    const filtro = e.target.value.toLowerCase();
    renderTabla(bancos.filter(b => b.nombre.toLowerCase().includes(filtro)));
});

document.getElementById('bancoSelect').addEventListener('change', (e) => {
    bancoSeleccionado = e.target.value;
    cargarGrafico();
});

document.querySelectorAll('.period-buttons button').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.period-buttons button').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        periodoSeleccionado = e.target.dataset.periodo;
        cargarGrafico();
    });
});

function calcular() {
    const monto = parseFloat(document.getElementById('monto').value) || 0;
    const dias = parseFloat(document.getElementById('dias').value) || 0;
    const tna = parseFloat(document.getElementById('tna').value) || 0;
    const interesTNA = monto * (tna / 100) / 365 * dias;
    const tea = calcularTEA(tna);
    const interesTEA = monto * (Math.pow(1 + tea / 100, dias / 365) - 1);
    document.getElementById('interesTNA').textContent = `$${interesTNA.toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
    document.getElementById('interesTEA').textContent = `$${interesTEA.toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
    document.getElementById('totalTNA').textContent = `$${(monto + interesTNA).toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
}

['monto', 'dias', 'tna'].forEach(id => document.getElementById(id).addEventListener('input', calcular));

function calcularCarry() {
    const monto = parseFloat(document.getElementById('montoCarry').value) || 0;
    const tna = parseFloat(document.getElementById('tnaCarry').value) || 0;
    const dolarHoy = parseFloat(document.getElementById('dolarHoy').value) || 1;
    const dolarFuturo = parseFloat(document.getElementById('dolarFuturo').value) || 1;
    const interesPF = monto * (tna / 100) / 12;
    const totalPF = monto + interesPF;
    const rendimientoPF = (interesPF / monto) * 100;
    const pesosFuturos = (monto / dolarHoy) * dolarFuturo;
    const rendimientoDolar = ((pesosFuturos - monto) / monto) * 100;
    const diferencia = totalPF - pesosFuturos;
    const cardVeredicto = document.getElementById('cardVeredicto');
    document.getElementById('resultadoPF').textContent = `$${totalPF.toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
    document.getElementById('rendimientoPF').textContent = `${rendimientoPF.toFixed(2)}%`;
    document.getElementById('resultadoDolar').textContent = `$${pesosFuturos.toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
    document.getElementById('rendimientoDolar').textContent = `${rendimientoDolar.toFixed(2)}%`;
    if (diferencia > 0) {
        document.getElementById('veredicto').textContent = 'Conviene Plazo Fijo ✓';
        document.getElementById('diferencia').textContent = `Ganás $${Math.abs(diferencia).toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
        cardVeredicto.className = 'result-card total positivo';
    } else {
        document.getElementById('veredicto').textContent = 'Conviene Dólar ✗';
        document.getElementById('diferencia').textContent = `Perdés $${Math.abs(diferencia).toLocaleString('es-AR', {maximumFractionDigits: 0})}`;
        cardVeredicto.className = 'result-card total negativo';
    }
}

['montoCarry', 'tnaCarry', 'dolarHoy', 'dolarFuturo'].forEach(id => document.getElementById(id).addEventListener('input', calcularCarry));

cargarTasas();
cargarDolar();
setInterval(() => { cargarTasas(); cargarDolar(); }, 300000);