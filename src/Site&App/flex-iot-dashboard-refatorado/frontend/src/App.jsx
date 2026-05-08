import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { io } from 'socket.io-client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api, API_URL, clearSession, setSession } from './api/client.js';
import './styles.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@flex.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();

    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      setSession(data);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="login card">
      <h2>Flex Automation</h2>
      <p className="muted">Dashboard IoT com MQTT, backend e banco de dados</p>

      <form onSubmit={submit} className="grid">
        <div>
          <label>E-mail</label>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div>
          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button>ENTRAR</button>
      </form>
    </div>
  );
}

function Header({ page, setPage, user, logout }) {
  return (
    <div className="header">
      <span className="badge">{user?.role}</span>
      <h1>Monitor · Sala Museu 1</h1>

      <div className="nav">
        {[
          'Dashboard',
          'Ambientes',
          'Dispositivos',
          'Histórico',
          'Relatórios',
          'Logs',
          'MQTT',
          'Usuários'
        ].map(p => (
          <button key={p} onClick={() => setPage(p)}>
            {p}
          </button>
        ))}

        <button onClick={logout}>Sair</button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState({
    latest: [],
    devices: [],
    alerts: [],
    mqtt: {}
  });

  const [last, setLast] = useState(null);
  const [log, setLog] = useState([]);
  const [mqttStatus, setMqttStatus] = useState('disconnected');
  const [showRawJson, setShowRawJson] = useState(false);

  const chartData = useMemo(() => {
    return [...(data.latest || [])]
      .reverse()
      .slice(-20)
      .map(item => ({
        horario: item.createdAt
          ? new Date(item.createdAt).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })
          : '—',
        temperatura: Number(item.temperature || 0),
        umidade: Number(item.humidity || 0),
        gas: Number(item.gas || 0),
        pressao: Number(item.pressure || 0)
      }));
  }, [data.latest]);

  async function load() {
    const d = await api('/api/dashboard');

    setData(d);
    setMqttStatus(d.mqtt?.status || 'disconnected');

    if (d.latest?.[0]) {
      setLast(d.latest[0]);
    }
  }

  useEffect(() => {
    load();

    const socket = io(API_URL);

    socket.on('reading:new', r => {
      setLast(r);

      setData(prev => ({
        ...prev,
        latest: [r, ...(prev.latest || [])].slice(0, 20)
      }));

      setLog(l => [
        {
          ts: new Date().toLocaleTimeString('pt-BR'),
          msg: `T:${r.temperature?.toFixed?.(1)}°C U:${r.humidity?.toFixed?.(1)}% P:${r.pressure?.toFixed?.(1)}hPa G:${r.gas} F:${r.fogo ? 'SIM' : 'NÃO'}`,
          estado: r.estado
        },
        ...l
      ].slice(0, 60));
    });

    socket.on('mqtt:status', s => {
      setMqttStatus(s.status);
    });

    return () => socket.close();
  }, []);

  const d = last || {};
  const jsonRecebido = montarJsonRecebido(d);

  return (
    <>
      <div className="dashboard-title">
        <div>
          <h2>Dashboard em tempo real</h2>
          <p className="muted">
            Dados recebidos pelo MQTT, salvos no backend e enviados para o site via Socket.IO.
          </p>
        </div>

        <div className="status-line">
          <span className={`badge ${mqttStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}`}>
            {mqttStatus === 'connected' ? 'MQTT CONECTADO' : mqttStatus.toUpperCase()}
          </span>

          <span className={`badge ${d.estado || ''}`}>
            {d.estado || 'SEM DADOS'}
          </span>
        </div>
      </div>

      <div className={`alert-fire ${d.fogo ? 'visible' : ''}`}>
        ⚠ FOGO DETECTADO — EMERGÊNCIA
      </div>

      <div className="grid dashboard-summary">
        <Metric title="Temperatura" value={num(d.temperature)} unit="°C" />
        <Metric title="Umidade" value={num(d.humidity)} unit="%" />
        <Metric title="Pressão" value={num(d.pressure)} unit="hPa" />
        <Metric title="Gás (MQ-2)" value={d.gas ?? '—'} unit="raw ADC" />
        <Metric
          title="Fogo"
          value={d.fogo ? 'SIM' : d.fogo === false ? 'NÃO' : '—'}
          unit="sensor digital"
          danger={d.fogo}
        />
        <Metric
          title="Dispositivo"
          value={d.device?.name || '—'}
          unit={d.device?.mqttTopic || 'tópico MQTT'}
        />
      </div>

      <div className="card chart-card">
        <div className="card-header-row">
          <div>
            <h3>Gráfico das leituras recebidas</h3>
            <p className="muted">
              Atualiza automaticamente conforme novos dados MQTT chegam.
            </p>
          </div>

          <span className="badge">
            Últimas {chartData.length} leituras
          </span>
        </div>

        {chartData.length === 0 ? (
          <p className="muted">Aguardando dados para montar o gráfico...</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="tempColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64b5f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#64b5f6" stopOpacity={0.08} />
                  </linearGradient>

                  <linearGradient id="umidColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5a0" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00e5a0" stopOpacity={0.08} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#252a38" />
                <XAxis dataKey="horario" stroke="#7b819b" />
                <YAxis stroke="#7b819b" />

                <Tooltip
                  contentStyle={{
                    background: '#161a23',
                    border: '1px solid #252a38',
                    color: '#e8eaf0'
                  }}
                  labelStyle={{
                    color: '#e8eaf0'
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="temperatura"
                  name="Temperatura °C"
                  stroke="#64b5f6"
                  fillOpacity={1}
                  fill="url(#tempColor)"
                  strokeWidth={3}
                />

                <Area
                  type="monotone"
                  dataKey="umidade"
                  name="Umidade %"
                  stroke="#00e5a0"
                  fillOpacity={1}
                  fill="url(#umidColor)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid dashboard-panels">
        <div className="card json-card">
          <div className="card-header-row">
            <div>
              <h3>JSON recebido</h3>
              <p className="muted">
                Visualização simples do payload que está entrando pelo MQTT.
              </p>
            </div>

            <button type="button" onClick={() => setShowRawJson(!showRawJson)}>
              {showRawJson ? 'VER TABELA' : 'VER JSON'}
            </button>
          </div>

          {!d.id ? (
            <p className="muted">Aguardando a primeira mensagem MQTT...</p>
          ) : showRawJson ? (
            <pre className="json-box">
              {JSON.stringify(jsonRecebido, null, 2)}
            </pre>
          ) : (
            <table className="table compact-table">
              <tbody>
                <JsonRow label="temperature" value={jsonRecebido.temperature} suffix="°C" />
                <JsonRow label="humidity" value={jsonRecebido.humidity} suffix="%" />
                <JsonRow label="pressure" value={jsonRecebido.pressure} suffix="hPa" />
                <JsonRow label="gas" value={jsonRecebido.gas} />
                <JsonRow label="fogo" value={jsonRecebido.fogo ? 'true' : 'false'} />
                <JsonRow label="estado" value={jsonRecebido.estado} />
                <JsonRow label="topic" value={d.topic || d.device?.mqttTopic || '—'} />
                <JsonRow
                  label="recebido em"
                  value={d.createdAt ? new Date(d.createdAt).toLocaleString('pt-BR') : '—'}
                />
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3>Últimas leituras recebidas</h3>
          <p className="muted">Mostra as últimas mensagens que chegaram no sistema.</p>
          <LatestReadingsTable rows={data.latest || []} />
        </div>
      </div>

      <div className="grid dashboard-panels">
        <div className="card">
          <h3>Dispositivos monitorados</h3>

          <table className="table">
            <tbody>
              {(data.devices || []).map(x => (
                <tr key={x.id}>
                  <td>{x.name}</td>
                  <td>
                    <span className={`badge ${x.status}`}>
                      {x.status}
                    </span>
                  </td>
                  <td className="muted">{x.mqttTopic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3>Log de mensagens em tempo real</h3>

          <div className="log">
            {log.length === 0 && (
              <p className="muted">Nenhuma mensagem recebida nesta sessão ainda.</p>
            )}

            {log.map((l, i) => (
              <div key={i}>
                <span className="muted">{l.ts}</span>{' '}
                <span className={l.estado}>
                  {l.estado ? `[${l.estado}]` : ''}
                </span>{' '}
                {l.msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function montarJsonRecebido(d) {
  return {
    temperature: d.temperature ?? null,
    humidity: d.humidity ?? null,
    pressure: d.pressure ?? null,
    gas: d.gas ?? null,
    fogo: d.fogo ?? false,
    estado: d.estado ?? null
  };
}

function JsonRow({ label, value, suffix = '' }) {
  return (
    <tr>
      <td>
        <strong>{label}</strong>
      </td>
      <td>
        {value ?? '—'}
        {value !== null && value !== undefined && value !== '—' && suffix
          ? ` ${suffix}`
          : ''}
      </td>
    </tr>
  );
}

function LatestReadingsTable({ rows }) {
  if (!rows.length) {
    return <p className="muted">Ainda não existem leituras salvas.</p>;
  }

  return (
    <table className="table compact-table">
      <thead>
        <tr>
          <th>Hora</th>
          <th>Temp</th>
          <th>Umid</th>
          <th>Gás</th>
          <th>Estado</th>
        </tr>
      </thead>

      <tbody>
        {rows.slice(0, 8).map(r => (
          <tr key={r.id || r.createdAt}>
            <td>{r.createdAt ? new Date(r.createdAt).toLocaleTimeString('pt-BR') : '—'}</td>
            <td>{num(r.temperature)}°C</td>
            <td>{num(r.humidity)}%</td>
            <td>{r.gas ?? '—'}</td>
            <td>
              <span className={`badge ${r.estado || ''}`}>
                {r.estado || '—'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function num(v) {
  return typeof v === 'number' ? v.toFixed(1) : '—';
}

function Metric({ title, value, unit, danger }) {
  return (
    <div className={`card ${danger ? 'EMERGENCIA' : ''}`}>
      <div className="muted">{title}</div>
      <div className="value">{value}</div>
      <div className="unit">{unit}</div>
    </div>
  );
}

function CrudPage({ type }) {
  const isEnv = type === 'Ambientes';
  const endpoint = isEnv ? '/api/environments' : '/api/devices';

  const [items, setItems] = useState([]);
  const [envs, setEnvs] = useState([]);
  const [form, setForm] = useState({ active: true, port: '8884' });

  async function load() {
    setItems(await api(endpoint));

    if (!isEnv) {
      setEnvs(await api('/api/environments'));
    }
  }

  useEffect(() => {
    load();
  }, [type]);

  async function save(e) {
    e.preventDefault();

    const body = prepareForm(form, isEnv);

    await api(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    setForm({ active: true });
    load();
  }

  return (
    <div className="card">
      <h2>CRUD de {type}</h2>

      <form onSubmit={save} className="form-grid">
        <Field
          label="Nome"
          value={form.name || ''}
          onChange={v => setForm({ ...form, name: v })}
        />

        {isEnv ? (
          <Field
            label="Descrição"
            value={form.description || ''}
            onChange={v => setForm({ ...form, description: v })}
          />
        ) : (
          <>
            <Field
              label="Código"
              value={form.code || ''}
              onChange={v => setForm({ ...form, code: v })}
            />

            <Field
              label="Tópico MQTT"
              value={form.mqttTopic || 'flex/sala_museu_1/sensor_01'}
              onChange={v => setForm({ ...form, mqttTopic: v })}
            />

            <div>
              <label>Ambiente</label>
              <select
                value={form.environmentId || ''}
                onChange={e => setForm({ ...form, environmentId: e.target.value })}
              >
                <option value="">Selecione</option>
                {envs.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            {[
              'minTemperature',
              'maxTemperature',
              'minHumidity',
              'maxHumidity',
              'minPressure',
              'maxPressure',
              'maxGas'
            ].map(k => (
              <Field
                key={k}
                label={k}
                type="number"
                value={form[k] || ''}
                onChange={v => setForm({ ...form, [k]: v })}
              />
            ))}
          </>
        )}

        <button>CADASTRAR</button>
      </form>

      <DataTable items={items} />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function prepareForm(f, isEnv) {
  const o = { ...f };

  if (!isEnv) {
    o.environmentId = Number(o.environmentId);

    [
      'minTemperature',
      'maxTemperature',
      'minHumidity',
      'maxHumidity',
      'minPressure',
      'maxPressure',
      'maxGas'
    ].forEach(k => {
      o[k] = o[k] === '' || o[k] == null ? null : Number(o[k]);
    });
  }

  return o;
}

function DataTable({ items }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Status</th>
          <th>Detalhes</th>
        </tr>
      </thead>

      <tbody>
        {items.map(i => (
          <tr key={i.id}>
            <td>{i.id}</td>
            <td>{i.name}</td>
            <td>{i.status || (i.active ? 'Ativo' : 'Inativo')}</td>
            <td>{i.mqttTopic || i.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function History() {
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function load() {
    const q = new URLSearchParams({
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      limit: '300'
    });

    setRows(await api('/api/readings?' + q));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card">
      <h2>Histórico de leituras</h2>

      <div className="form-grid">
        <Field label="De" type="datetime-local" value={from} onChange={setFrom} />
        <Field label="Até" type="datetime-local" value={to} onChange={setTo} />

        <button onClick={load}>FILTRAR</button>

      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Dispositivo</th>
            <th>Temp</th>
            <th>Umid</th>
            <th>Pressão</th>
            <th>Gás</th>
            <th>Fogo</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.createdAt).toLocaleString('pt-BR')}</td>
              <td>{r.device?.name}</td>
              <td>{r.temperature}</td>
              <td>{r.humidity}</td>
              <td>{r.pressure}</td>
              <td>{r.gas}</td>
              <td>{r.fogo ? 'SIM' : 'NÃO'}</td>
              <td>{r.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Reports() {
  const [loading, setLoading] = useState(false);

  function gerarRelatorio() {
    setLoading(true);

    const url = `${API_URL}/api/relatorio-historico.csv?t=${Date.now()}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio-historico-ultimos-1500.csv';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }

  return (
    <div className="card">
      <h2>Relatório do histórico</h2>

      <p className="muted">
        Clique no botão abaixo para baixar um relatório CSV com os últimos 1500 dados lidos pelo sistema.
      </p>

      <div className="grid report-summary">
        <div className="card">
          <div className="muted">Formato</div>
          <div className="value">CSV</div>
          <div className="unit">abre no Excel/Google Sheets</div>
        </div>

        <div className="card">
          <div className="muted">Quantidade</div>
          <div className="value">1500</div>
          <div className="unit">últimas leituras</div>
        </div>

        <div className="card">
          <div className="muted">Dados</div>
          <div className="value">MQTT</div>
          <div className="unit">temperatura, umidade, gás, fogo e estado</div>
        </div>
      </div>

      <button type="button" onClick={gerarRelatorio}>
        {loading ? 'GERANDO RELATÓRIO...' : 'GERAR RELATÓRIO'}
      </button>

      <p className="muted" style={{ marginTop: '1rem' }}>
        O arquivo será baixado automaticamente com as colunas: data, ambiente,
        dispositivo, tópico, temperatura, umidade, pressão, gás, fogo e estado.
      </p>
    </div>
  );
}

function Logs() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api('/api/logs').then(setRows);
  }, []);

  return (
    <div className="card">
      <h2>Logs do sistema</h2>

      <table className="table">
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{new Date(r.createdAt).toLocaleString('pt-BR')}</td>
              <td>{r.level}</td>
              <td>{r.source}</td>
              <td>{r.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MqttConfig() {
  const [form, setForm] = useState({ protocol: 'wss', port: '8884' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api('/api/mqtt/config').then(c => c && setForm(c));
  }, []);

  async function save(e) {
    e.preventDefault();

    await api('/api/mqtt/config', {
      method: 'POST',
      body: JSON.stringify(form)
    });

    setMsg('Configuração salva e conexão reiniciada.');
  }

  return (
    <div className="card">
      <h2>Configuração MQTT</h2>

      <form onSubmit={save} className="form-grid">
        <Field
          label="HOST HiveMQ"
          value={form.host || ''}
          onChange={v => setForm({ ...form, host: v })}
        />

        <Field
          label="Porta WebSocket"
          value={form.port || '8884'}
          onChange={v => setForm({ ...form, port: v })}
        />

        <Field
          label="Usuário"
          value={form.username || ''}
          onChange={v => setForm({ ...form, username: v })}
        />

        <Field
          label="Senha"
          type="password"
          value={form.password || ''}
          onChange={v => setForm({ ...form, password: v })}
        />

        <button>CONECTAR</button>
      </form>

      <p className="muted">{msg}</p>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ role: 'CLIENTE' });

  useEffect(() => {
    api('/api/auth/users')
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  async function save(e) {
    e.preventDefault();

    await api('/api/auth/users', {
      method: 'POST',
      body: JSON.stringify(form)
    });

    setUsers(await api('/api/auth/users'));
  }

  return (
    <div className="card">
      <h2>Usuários e roles</h2>

      <form onSubmit={save} className="form-grid">
        <Field
          label="Nome"
          value={form.name || ''}
          onChange={v => setForm({ ...form, name: v })}
        />

        <Field
          label="E-mail"
          value={form.email || ''}
          onChange={v => setForm({ ...form, email: v })}
        />

        <Field
          label="Senha"
          type="password"
          value={form.password || ''}
          onChange={v => setForm({ ...form, password: v })}
        />

        <div>
          <label>Role</label>
          <select
            value={form.role}
            onChange={e => setForm({ ...form, role: e.target.value })}
          >
            <option>ADMIN</option>
            <option>TECNICO</option>
            <option>CLIENTE</option>
          </select>
        </div>

        <button>CRIAR</button>
      </form>

      <DataTable items={users} />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null')
  );

  const [page, setPage] = useState('Dashboard');

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <div className="app">
      <Header page={page} setPage={setPage} user={user} logout={logout} />

      {page === 'Dashboard' && <Dashboard />}
      {page === 'Ambientes' && <CrudPage type="Ambientes" />}
      {page === 'Dispositivos' && <CrudPage type="Dispositivos" />}
      {page === 'Histórico' && <History />}
      {page === 'Relatórios' && <Reports />}
      {page === 'Logs' && <Logs />}
      {page === 'MQTT' && <MqttConfig />}
      {page === 'Usuários' && <Users />}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);