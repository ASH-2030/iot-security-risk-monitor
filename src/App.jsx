import { useMemo, useState } from 'react'
import './App.css'

const devices = [
  {
    id: 'esp32-temp',
    name: 'ESP32 Temperature Sensor',
    type: 'Sensor',
    zone: 'Warehouse A',
    site: 'North Campus',
    ipAddress: '10.24.8.17',
    firmwareVersion: '3.2.7',
    model: 'ESP32-WROOM-32',
    status: 'online',
    riskLevel: 'high',
    riskScore: 82,
    lastAssessed: '2026-09-27',
    connectedServices: ['MQTT broker', 'Local telemetry', 'HTTP admin'],
    authentication: {
      method: 'token',
      privilegedAccountUsed: false,
      leastPrivilegeStatus: 'partial',
    },
    compliance: {
      patchLevel: 'stale',
      tlsEnabled: false,
      defaultPasswordInUse: false,
    },
    summary:
      'Temperature sensor transmits environmental telemetry without strong encryption and has stale firmware.',
    tags: ['IoT', 'HVAC', 'monitoring'],
    access: {
      current: 'Read/write telemetry; admin remote access enabled',
      recommended: 'Read-only telemetry; restricted local admin access',
      reason:
        'The device exposes unnecessary admin functions and should only publish telemetry to the internal monitoring broker.',
    },
  },
  {
    id: 'smart-camera',
    name: 'Smart Camera',
    type: 'Camera',
    zone: 'Loading Bay',
    site: 'North Campus',
    ipAddress: '10.24.5.42',
    firmwareVersion: '2.9.4',
    model: 'AXIS M3067',
    status: 'online',
    riskLevel: 'critical',
    riskScore: 91,
    lastAssessed: '2026-09-29',
    connectedServices: ['RTSP stream', 'Web UI', 'Motion analytics'],
    authentication: {
      method: 'basic',
      privilegedAccountUsed: true,
      leastPrivilegeStatus: 'poor',
    },
    compliance: {
      patchLevel: 'stale',
      tlsEnabled: false,
      defaultPasswordInUse: true,
    },
    summary:
      'The smart camera uses default credentials and exposes streaming and admin services to the network.',
    tags: ['video', 'surveillance', 'edge'],
    access: {
      current: 'Administrator account with direct Internet reachability',
      recommended: 'Dedicated camera role with only stream access and signed credential usage',
      reason:
        'Default admin credentials combined with internet exposure create a high-likelihood path for lateral movement.',
    },
  },
  {
    id: 'smart-plug',
    name: 'Smart Plug',
    type: 'Relay',
    zone: 'Office 2A',
    site: 'HQ',
    ipAddress: '192.168.50.12',
    firmwareVersion: '1.8.1',
    model: 'TP-Link Kasa Mini',
    status: 'offline',
    riskLevel: 'medium',
    riskScore: 56,
    lastAssessed: '2026-09-18',
    connectedServices: ['Cloud API', 'Mobile app sync', 'Power telemetry'],
    authentication: {
      method: 'unknown',
      privilegedAccountUsed: false,
      leastPrivilegeStatus: 'partial',
    },
    compliance: {
      patchLevel: 'unknown',
      tlsEnabled: true,
      defaultPasswordInUse: false,
    },
    summary:
      'The smart plug has limited local exposure but unverified cloud connectivity and inconsistent patch tracking.',
    tags: ['power', 'remote', 'scheduling'],
    access: {
      current: 'Cloud API access from mobile application with broad device controls',
      recommended: 'Single-device control scopes with scheduled operations only',
      reason:
        'Device actions should be limited to the required operational scopes rather than broad remote control privileges.',
    },
  },
  {
    id: 'door-sensor',
    name: 'Door Sensor',
    type: 'Sensor',
    zone: 'Perimeter',
    site: 'HQ',
    ipAddress: '10.10.44.88',
    firmwareVersion: '2.4.6',
    model: 'Aqara Door Sensor',
    status: 'online',
    riskLevel: 'medium',
    riskScore: 49,
    lastAssessed: '2026-09-24',
    connectedServices: ['BLE gateway', 'Status feed', 'Local alert relay'],
    authentication: {
      method: 'cert',
      privilegedAccountUsed: false,
      leastPrivilegeStatus: 'good',
    },
    compliance: {
      patchLevel: 'current',
      tlsEnabled: true,
      defaultPasswordInUse: false,
    },
    summary:
      'The door sensor is generally well-managed, but it reports through an older gateway interface with limited hardening.',
    tags: ['security', 'doors', 'access'],
    access: {
      current: 'Read-only status updates and local gateway communication',
      recommended: 'Likewise maintain read-only status, with no remote administrative API',
      reason:
        'The device should remain limited to status reporting and alerts to reduce attack surface area.',
    },
  },
  {
    id: 'iot-gateway',
    name: 'IoT Gateway',
    type: 'Gateway',
    zone: 'Server Room',
    site: 'HQ',
    ipAddress: '10.10.1.14',
    firmwareVersion: '4.2.0',
    model: 'OpenWrt Edge Router',
    status: 'online',
    riskLevel: 'high',
    riskScore: 74,
    lastAssessed: '2026-09-28',
    connectedServices: ['VPN tunnel', 'MQTT relay', 'Device management'],
    authentication: {
      method: 'mTLS',
      privilegedAccountUsed: true,
      leastPrivilegeStatus: 'partial',
    },
    compliance: {
      patchLevel: 'current',
      tlsEnabled: true,
      defaultPasswordInUse: false,
    },
    summary:
      'The gateway is central to device operations and currently exposes more network reachability than necessary.',
    tags: ['gateway', 'edge', 'network'],
    access: {
      current: 'Shared admin role used for both edge routing and device orchestration',
      recommended: 'Separate admin roles for routing and IoT orchestration with role-based access',
      reason:
        'A shared privileged role increases blast radius; separating functions reduces privilege misuse risk.',
    },
  },
]

const securityFindings = [
  {
    id: 'f-001',
    deviceId: 'smart-camera',
    title: 'Weak/default authentication',
    severity: 'critical',
    category: 'authentication',
    description: 'Camera web interface still uses the default admin password and a basic authentication configuration.',
    evidence: ['Default credentials detected', 'Basic auth in use', 'Password unchanged for 240 days'],
    status: 'open',
    createdAt: '2026-09-28',
    recommendedAction: 'Reset credentials and enforce unique role-based authentication.',
  },
  {
    id: 'f-002',
    deviceId: 'esp32-temp',
    title: 'Outdated firmware',
    severity: 'high',
    category: 'firmware',
    description: 'The sensor is running a firmware release that no longer receives security patch updates.',
    evidence: ['Firmware 3.2.7', 'No patch window active', 'Known crypto exposure in older release'],
    status: 'open',
    createdAt: '2026-09-25',
    recommendedAction: 'Upgrade to the supported firmware bundle and verify post-update telemetry integrity.',
  },
  {
    id: 'f-003',
    deviceId: 'esp32-temp',
    title: 'Unencrypted communication',
    severity: 'high',
    category: 'network',
    description: 'Telemetry traffic is transmitted over unencrypted channels between the device and the local broker.',
    evidence: ['TLS disabled on device interface', 'Plaintext MQTT traffic detected'],
    status: 'monitoring',
    createdAt: '2026-09-22',
    recommendedAction: 'Enable mutual TLS or encrypted MQTT transport for all sensor data.',
  },
  {
    id: 'f-004',
    deviceId: 'iot-gateway',
    title: 'Unnecessary internet access',
    severity: 'high',
    category: 'network',
    description: 'The gateway accepts remote connectivity paths that are not required for daily operations.',
    evidence: ['Remote tunnel enabled', 'Direct internet exposure on non-essential ports'],
    status: 'open',
    createdAt: '2026-09-20',
    recommendedAction: 'Restrict remote access to approved VPN endpoints only and remove unused internet routing.',
  },
  {
    id: 'f-005',
    deviceId: 'smart-camera',
    title: 'Exposed services',
    severity: 'critical',
    category: 'misconfiguration',
    description: 'The camera exposes multiple management and streaming ports beyond the minimum required set.',
    evidence: ['RTSP service mapped externally', 'Web UI on port 80 open', 'Admin service reachable from public segment'],
    status: 'open',
    createdAt: '2026-09-19',
    recommendedAction: 'Restrict service exposure to private network segments and disable unused ports.',
  },
]

const accessRecommendations = [
  {
    id: 'r-001',
    deviceId: 'smart-camera',
    title: 'Replace shared admin credentials',
    priority: 'high',
    currentAccess: 'Administrator account shared across camera operators and maintenance users',
    recommendedAccess: 'Separate admin role for maintenance only; no shared credentials',
    reason: 'Shared privileges significantly reduce accountability and increase the blast radius of credential theft.',
  },
  {
    id: 'r-002',
    deviceId: 'esp32-temp',
    title: 'Limit telemetry write access',
    priority: 'high',
    currentAccess: 'Telemetry device can write and change local configuration settings via web admin',
    recommendedAccess: 'Read-only telemetry publishing and restricted local configuration access',
    reason: 'Constrained device permissions reduce the chance of unauthorized configuration changes or misuse.',
  },
  {
    id: 'r-003',
    deviceId: 'iot-gateway',
    title: 'Split routing and IoT administration',
    priority: 'high',
    currentAccess: 'Single admin role handles both network routing and IoT orchestration',
    recommendedAccess: 'Separate route-management and device-management roles with least privilege boundaries',
    reason: 'Role separation reduces the impact of a single compromised administrator account on the network edge.',
  },
  {
    id: 'r-004',
    deviceId: 'smart-plug',
    title: 'Narrow app permissions',
    priority: 'medium',
    currentAccess: 'Mobile app can issue broad on/off changes and schedule operations',
    recommendedAccess: 'Device-specific control only for approved automation schedules',
    reason: 'Limiting access to the required operation scope makes unauthorized remote control less likely.',
  },
]

const navItems = [
  { id: 'dashboard', label: 'Dashboard Overview' },
  { id: 'inventory', label: 'Device Inventory' },
  { id: 'details', label: 'Device Security Details' },
  { id: 'findings', label: 'Security Findings' },
  { id: 'recommendations', label: 'Least-Privilege Recommendations' },
]

function getRiskLabel(score) {
  if (score >= 80) return 'critical'
  if (score >= 65) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

function getRiskColor(level) {
  const palette = {
    critical: 'risk-critical',
    high: 'risk-high',
    medium: 'risk-medium',
    low: 'risk-low',
  }

  return palette[level] || 'risk-low'
}

function getStatusColor(status) {
  const palette = {
    online: 'status-online',
    offline: 'status-offline',
    warning: 'status-warning',
    'at-risk': 'status-warning',
    isolated: 'status-offline',
  }

  return palette[status] || 'status-online'
}

function getPostureLabel(score) {
  if (score >= 80) return 'Critical Risk'
  if (score >= 65) return 'High Risk'
  if (score >= 45) return 'Moderate Risk'
  return 'Low Risk'
}

function getPostureClass(score) {
  if (score >= 80) return 'posture-critical'
  if (score >= 65) return 'posture-high'
  if (score >= 45) return 'posture-medium'
  return 'posture-low'
}

function formatRiskValue(level) {
  return level.charAt(0).toUpperCase() + level.slice(1)
}

function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedDeviceId, setSelectedDeviceId] = useState(devices[0].id)
  const [inventoryFilters, setInventoryFilters] = useState({
    search: '',
    risk: 'all',
    status: 'all',
  })
  const [findingFilters, setFindingFilters] = useState({
    search: '',
    severity: 'all',
    status: 'all',
  })

  const selectedDevice =
    devices.find((device) => device.id === selectedDeviceId) || devices[0]

  const stats = useMemo(() => {
    const totals = {
      total: devices.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      online: 0,
      offline: 0,
    }

    devices.forEach((device) => {
      const level = device.riskLevel
      totals[level] += 1
      if (device.status === 'online') totals.online += 1
      else totals.offline += 1
    })

    const postureScore = Math.round(
      devices.reduce((sum, device) => sum + device.riskScore, 0) / devices.length,
    )

    return {
      ...totals,
      postureScore,
      postureLabel: getPostureLabel(postureScore),
      postureClass: getPostureClass(postureScore),
    }
  }, [])

  const recentFindings = securityFindings.slice(0, 4)
  const topRiskDevices = [...devices].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3)
  const deviceFindings = securityFindings.filter((finding) => finding.deviceId === selectedDevice.id)
  const deviceRecommendations = accessRecommendations.filter(
    (recommendation) => recommendation.deviceId === selectedDevice.id,
  )

  const filteredInventory = devices.filter((device) => {
    const searchValue = inventoryFilters.search.trim().toLowerCase()
    const matchesSearch =
      !searchValue ||
      device.name.toLowerCase().includes(searchValue) ||
      device.zone.toLowerCase().includes(searchValue) ||
      device.type.toLowerCase().includes(searchValue)
    const matchesRisk = inventoryFilters.risk === 'all' || device.riskLevel === inventoryFilters.risk
    const matchesStatus = inventoryFilters.status === 'all' || device.status === inventoryFilters.status
    return matchesSearch && matchesRisk && matchesStatus
  })

  const filteredFindings = securityFindings.filter((finding) => {
    const searchValue = findingFilters.search.trim().toLowerCase()
    const device = devices.find((item) => item.id === finding.deviceId)
    const matchesSearch =
      !searchValue ||
      finding.title.toLowerCase().includes(searchValue) ||
      finding.category.toLowerCase().includes(searchValue) ||
      (device && device.name.toLowerCase().includes(searchValue))
    const matchesSeverity = findingFilters.severity === 'all' || finding.severity === findingFilters.severity
    const matchesStatus = findingFilters.status === 'all' || finding.status === findingFilters.status
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const handleDeviceSelect = (deviceId) => {
    setSelectedDeviceId(deviceId)
    setActiveView('details')
  }

  const renderDashboard = () => (
    <div className="page-grid">
      <section className="section-card hero-panel">
        <div>
          <p className="eyebrow">Security Overview</p>
          <h1>IoT Security Risk Monitor</h1>
          <p className="subtitle">
            Monitoring connected device posture, policy drift, and access exposure across the environment.
          </p>
        </div>
        <div className={`status-meter ${stats.postureClass}`}>
          <span className="meter-label">Overall Security Posture</span>
          <div className="posture-header">
            <strong>{stats.postureLabel}</strong>
            <span>{stats.postureScore}/100</span>
          </div>
          <div className="progress-bar" aria-label={`Overall security posture score ${stats.postureScore} out of 100`}>
            <span style={{ width: `${stats.postureScore}%` }} />
          </div>
        </div>
      </section>

      <div className="metrics-grid">
        <MetricCard label="Total devices" value={stats.total} detail="5 monitored assets" />
        <MetricCard label="Critical risk" value={stats.critical} detail="Immediate review required" />
        <MetricCard label="High risk" value={stats.high} detail="Elevated exposure" />
        <MetricCard label="Medium risk" value={stats.medium} detail="Needs attention" />
        <MetricCard label="Low risk" value={stats.low} detail="Stable assets" />
      </div>

      <div className="two-column-layout">
        <section className="section-card">
          <div className="section-header">
            <h2>Security statistics</h2>
            <span className="chip neutral">Live mock data</span>
          </div>
          <div className="stacked-bars">
            <StatBar label="Online devices" value={stats.online} total={stats.total} tone="online" />
            <StatBar label="Offline devices" value={stats.offline} total={stats.total} tone="offline" />
            <StatBar label="Compliant posture" value={72} total={100} tone="good" />
            <StatBar label="Open findings" value={5} total={10} tone="warning" />
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <h2>Top-risk devices</h2>
            <span className="chip neutral">Priority</span>
          </div>
          <div className="device-list compact-list">
            {topRiskDevices.map((device) => (
              <button
                type="button"
                key={device.id}
                className="device-row interactive"
                onClick={() => handleDeviceSelect(device.id)}
                aria-label={`View details for ${device.name}`}
                aria-pressed={selectedDeviceId === device.id}
              >
                <div>
                  <strong>{device.name}</strong>
                  <span>{device.zone}</span>
                </div>
                <div className="device-row-meta">
                  <RiskBadge level={device.riskLevel} score={device.riskScore} />
                  <StatusBadge status={device.status} />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="two-column-layout">
        <section className="section-card">
          <div className="section-header">
            <h2>Recent security findings</h2>
            <span className="chip alert">{securityFindings.length} findings</span>
          </div>
          <div className="finding-stack">
            {recentFindings.map((finding) => (
              <div key={finding.id} className="finding-item">
                <div className="finding-head">
                  <RiskBadge level={finding.severity} score={finding.severity.toUpperCase()} />
                  <span className="muted">{finding.createdAt}</span>
                </div>
                <strong>{finding.title}</strong>
                <p>{finding.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <h2>Network posture</h2>
            <span className="chip neutral">Environment</span>
          </div>
          <div className="mini-chart" aria-label="Network posture distribution">
            <div className="chart-node good">
              <span>72%</span>
              <small>Compliant</small>
            </div>
            <div className="chart-node warning">
              <span>18%</span>
              <small>Monitoring</small>
            </div>
            <div className="chart-node danger">
              <span>10%</span>
              <small>Critical</small>
            </div>
          </div>
        </section>
      </div>
    </div>
  )

  const renderInventory = () => (
    <div className="page-grid">
      <section className="section-card">
        <div className="section-header">
          <h2>Device inventory</h2>
          <span className="chip neutral">{filteredInventory.length} of {devices.length}</span>
        </div>

        <div className="filter-panel" role="search">
          <label className="filter-field">
            <span>Search</span>
            <input
              type="text"
              value={inventoryFilters.search}
              onChange={(event) =>
                setInventoryFilters((previous) => ({ ...previous, search: event.target.value }))
              }
              placeholder="Search device or zone"
              aria-label="Search devices"
            />
          </label>

          <label className="filter-field">
            <span>Risk</span>
            <select
              value={inventoryFilters.risk}
              onChange={(event) =>
                setInventoryFilters((previous) => ({ ...previous, risk: event.target.value }))
              }
              aria-label="Filter devices by risk level"
            >
              <option value="all">All risks</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label className="filter-field">
            <span>Status</span>
            <select
              value={inventoryFilters.status}
              onChange={(event) =>
                setInventoryFilters((previous) => ({ ...previous, status: event.target.value }))
              }
              aria-label="Filter devices by status"
            >
              <option value="all">All statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </label>
        </div>

        <div className="device-table">
          <div className="table-header table-row">
            <span>Device</span>
            <span>Location</span>
            <span>Risk</span>
            <span>Status</span>
            <span>Access</span>
          </div>

          {filteredInventory.length > 0 ? (
            filteredInventory.map((device) => (
              <div key={device.id} className="table-row device-row-item">
                <div className="device-identify">
                  <strong>{device.name}</strong>
                  <small>{device.type}</small>
                </div>
                <div>
                  <strong>{device.zone}</strong>
                  <small>{device.site}</small>
                </div>
                <RiskBadge level={device.riskLevel} score={device.riskScore} />
                <StatusBadge status={device.status} />
                <div className="inventory-actions">
                  <span>{device.authentication.method}</span>
                  <button
                    type="button"
                    onClick={() => handleDeviceSelect(device.id)}
                    aria-label={`View security details for ${device.name}`}
                  >
                    View details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">No devices match the current filter settings.</div>
          )}
        </div>
      </section>
    </div>
  )

  const renderDetails = () => (
    <div className="page-grid">
      <section className="section-card detail-header-card">
        <div>
          <p className="eyebrow">Device Security Details</p>
          <h2>{selectedDevice.name}</h2>
          <p className="subtitle">{selectedDevice.summary}</p>
        </div>
        <div className="detail-header-right">
          <RiskBadge level={selectedDevice.riskLevel} score={selectedDevice.riskScore} />
          <StatusBadge status={selectedDevice.status} />
        </div>
      </section>

      <div className="three-column-grid">
        <section className="section-card">
          <div className="section-header">
            <h3>Asset overview</h3>
          </div>
          <div className="info-grid">
            <InfoItem label="Type" value={selectedDevice.type} />
            <InfoItem label="Site" value={selectedDevice.site} />
            <InfoItem label="Zone" value={selectedDevice.zone} />
            <InfoItem label="IP" value={selectedDevice.ipAddress} />
            <InfoItem label="Firmware" value={selectedDevice.firmwareVersion} />
            <InfoItem label="Model" value={selectedDevice.model} />
            <InfoItem label="Last assessed" value={selectedDevice.lastAssessed} />
            <InfoItem label="Auth method" value={selectedDevice.authentication.method} />
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <h3>Compliance</h3>
          </div>
          <div className="info-grid compact">
            <InfoItem label="Patch status" value={selectedDevice.compliance.patchLevel} />
            <InfoItem label="TLS" value={selectedDevice.compliance.tlsEnabled ? 'Enabled' : 'Disabled'} />
            <InfoItem label="Default creds" value={selectedDevice.compliance.defaultPasswordInUse ? 'Yes' : 'No'} />
            <InfoItem label="Privilege state" value={selectedDevice.authentication.leastPrivilegeStatus} />
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <h3>Connected services</h3>
          </div>
          <ul className="pill-list">
            {selectedDevice.connectedServices.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="two-column-layout">
        <section className="section-card">
          <div className="section-header">
            <h3>Findings for this device</h3>
          </div>
          <div className="finding-stack">
            {deviceFindings.map((finding) => (
              <div key={finding.id} className="finding-item">
                <div className="finding-head">
                  <RiskBadge level={finding.severity} score={finding.severity.toUpperCase()} />
                  <span className="muted">{finding.category}</span>
                </div>
                <strong>{finding.title}</strong>
                <p>{finding.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section-card">
          <div className="section-header">
            <h3>Least-privilege access</h3>
          </div>
          <div className="recommendation-list">
            {deviceRecommendations.map((recommendation) => (
              <div key={recommendation.id} className="recommendation-box">
                <div className="recommendation-header">
                  <strong>{recommendation.title}</strong>
                  <span className={`priority-tag ${recommendation.priority}`}>{recommendation.priority}</span>
                </div>
                <div className="access-boxes">
                  <div>
                    <label>Current access</label>
                    <p>{recommendation.currentAccess}</p>
                  </div>
                  <div>
                    <label>Recommended access</label>
                    <p>{recommendation.recommendedAccess}</p>
                  </div>
                </div>
                <p className="reason-text">
                  <span>Reason:</span> {recommendation.reason}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )

  const renderFindings = () => (
    <div className="page-grid findings-page">
      <section className="section-card">
        <div className="section-header">
          <h2>Security findings</h2>
          <span className="chip alert">{filteredFindings.length} of {securityFindings.length} findings</span>
        </div>

        <div className="filter-panel" role="search">
          <label className="filter-field">
            <span>Search</span>
            <input
              type="text"
              value={findingFilters.search}
              onChange={(event) =>
                setFindingFilters((previous) => ({ ...previous, search: event.target.value }))
              }
              placeholder="Search finding or device"
              aria-label="Search findings"
            />
          </label>

          <label className="filter-field">
            <span>Severity</span>
            <select
              value={findingFilters.severity}
              onChange={(event) =>
                setFindingFilters((previous) => ({ ...previous, severity: event.target.value }))
              }
              aria-label="Filter findings by severity"
            >
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </label>

          <label className="filter-field">
            <span>Status</span>
            <select
              value={findingFilters.status}
              onChange={(event) =>
                setFindingFilters((previous) => ({ ...previous, status: event.target.value }))
              }
              aria-label="Filter findings by status"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="monitoring">Monitoring</option>
              <option value="mitigated">Mitigated</option>
            </select>
          </label>
        </div>

        <div className="findings-table">
          {filteredFindings.length > 0 ? (
            filteredFindings.map((finding) => {
              const device = devices.find((item) => item.id === finding.deviceId)
              return (
                <div key={finding.id} className="finding-billboard">
                  <div className="finding-billboard-head">
                    <RiskBadge level={finding.severity} score={finding.severity.toUpperCase()} />
                    <span className="muted">{device?.name}</span>
                  </div>
                  <h3>{finding.title}</h3>
                  <p>{finding.description}</p>
                  <ul>
                    {finding.evidence.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <div className="finding-action-row">
                    <span className="chip neutral">{finding.status}</span>
                    <strong>{finding.recommendedAction}</strong>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="empty-state">No findings match the current filter settings.</div>
          )}
        </div>
      </section>
    </div>
  )

  const renderRecommendations = () => (
    <div className="page-grid">
      <section className="section-card">
        <div className="section-header">
          <h2>Least-privilege recommendations</h2>
          <span className="chip neutral">Access hardening</span>
        </div>
        <div className="recommendation-list large-list">
          {accessRecommendations.map((recommendation) => {
            const device = devices.find((item) => item.id === recommendation.deviceId)
            return (
              <div key={recommendation.id} className="recommendation-box">
                <div className="recommendation-header">
                  <strong>{device?.name}</strong>
                  <span className={`priority-tag ${recommendation.priority}`}>{recommendation.priority}</span>
                </div>
                <h3>{recommendation.title}</h3>
                <div className="access-boxes">
                  <div>
                    <label>Current access</label>
                    <p>{recommendation.currentAccess}</p>
                  </div>
                  <div>
                    <label>Recommended access</label>
                    <p>{recommendation.recommendedAccess}</p>
                  </div>
                </div>
                <p className="reason-text">
                  <span>Reason:</span> {recommendation.reason}
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )

  const renderView = () => {
    if (activeView === 'inventory') return renderInventory()
    if (activeView === 'details') return renderDetails()
    if (activeView === 'findings') return renderFindings()
    if (activeView === 'recommendations') return renderRecommendations()
    return renderDashboard()
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">IS</div>
          <div>
            <p className="brand-name">IoT Security</p>
            <small>Risk Monitor</small>
          </div>
        </div>

        <nav className="nav-menu" aria-label="Main navigation">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={activeView === item.id ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveView(item.id)}
              aria-current={activeView === item.id ? 'page' : undefined}
              aria-label={`View ${item.label}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <p>Environment summary</p>
          <strong>{stats.online} online</strong>
          <span>{stats.offline} offline</span>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operational insight</p>
            <h1>Security dashboard</h1>
          </div>
          <div className="header-actions">
            <span className="chip success">Status: monitored</span>
            <button type="button" className="primary-btn">
              Export report
            </button>
          </div>
        </header>

        {renderView()}
      </main>
    </div>
  )
}

function MetricCard({ label, value, detail }) {
  return (
    <div className="metric-card section-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  )
}

function RiskBadge({ level, score }) {
  const normalizedLevel = typeof level === 'string' ? level.toLowerCase() : getRiskLabel(score)
  const label = typeof score === 'number' ? `${score}` : formatRiskValue(normalizedLevel)
  const ariaLabel = `Risk level ${formatRiskValue(normalizedLevel)}`

  return (
    <span
      className={`risk-badge ${getRiskColor(normalizedLevel)}`}
      role="status"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {label}
    </span>
  )
}

function StatusBadge({ status }) {
  const label = String(status)
  const ariaLabel = `Device status ${label}`

  return (
    <span
      className={`status-badge ${getStatusColor(status)}`}
      role="status"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {label}
    </span>
  )
}

function StatBar({ label, value, total, tone }) {
  return (
    <div className="stat-row">
      <div className="stat-label-row">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="progress-track">
        <span className={`progress-fill ${tone}`} style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  )
}

function InfoItem({ label, value }) {
  return (
    <div className="info-item">
      <label>{label}</label>
      <strong>{value}</strong>
    </div>
  )
}

export default App
