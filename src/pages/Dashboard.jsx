import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Siren,
  Radio,
  Volume2,
  VolumeX,
  Gauge,
  MapPin,
  Activity,
  Zap,
  Ruler,
  BatteryMedium,
  Signal,
  ShieldCheck
} from "lucide-react";

import historicalData from "../data/historicalData";
import SensorChart from "../components/SensorChart";
import mockNodes from "../data/mockNodes";
import MineMap from "../components/MineMap";

function Dashboard() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [simulationStatus, setSimulationStatus] = useState("WARNING");
  const [telemetryMode, setTelemetryMode] = useState("AVERAGE");

  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  // Controls the dashboard's live activity.
  const [isPaused, setIsPaused] = useState(false);

  // Shown only when live activity is paused.
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const audioContextRef = useRef(null);
  const alarmIntervalRef = useRef(null);

  const totalNodes = mockNodes.length;

  const onlineNodes = mockNodes.filter(
    (node) => node.status === "ONLINE"
  ).length;

  const highRiskNodes = mockNodes.filter(
    (node) =>
      node.riskLevel === "HIGH" ||
      node.riskLevel === "CRITICAL"
  ).length;


  const playAlarmBeep = () => {

  try {

    if (!alarmEnabled) return;

    if (!audioContextRef.current) {
      audioContextRef.current =
        new (window.AudioContext ||
          window.webkitAudioContext)();
    }

    const audioContext =
      audioContextRef.current;

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 850;

    gain.gain.setValueAtTime(
      0.0001,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.18,
      audioContext.currentTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.28
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();

    oscillator.stop(
      audioContext.currentTime + 0.3
    );

  } catch (error) {
    console.log("Alarm audio unavailable");
  }
};


useEffect(() => {

  if (
    simulationStatus === "CRITICAL" &&
    alarmEnabled &&
    !isAcknowledged &&
    !isPaused
  ) {

    playAlarmBeep();

    alarmIntervalRef.current =
      setInterval(() => {
        playAlarmBeep();
      }, 1500);

  }

  return () => {

    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

  };

}, [
  simulationStatus,
  alarmEnabled,
  isAcknowledged,
  isPaused
]);

  /*
   * ---------------------------------------------------------
   * FILTER NODES BASED ON CURRENT SIMULATION STATUS
   * ---------------------------------------------------------
   */

  const getStatusNodes = (status) => {

  if (status === "NORMAL") {
    return mockNodes.filter(
      (node) => node.riskScore <= 30
    );
  }

  if (status === "WARNING") {
    return mockNodes.filter(
      (node) =>
        node.riskScore > 30 &&
        node.riskScore <= 60
    );
  }

  if (status === "CRITICAL") {
    return mockNodes.filter(
      (node) => node.riskScore > 60
    );
  }

  return mockNodes;
};

  const activeNodes = useMemo(
    () => getStatusNodes(simulationStatus),
    [simulationStatus]
  );

  /*
   * ---------------------------------------------------------
   * MOST DEFORMED NODE
   * ---------------------------------------------------------
   *
   * We use a combined deformation score rather than simply
   * choosing the highest riskScore.
   */

  const getMostDeformedNode = (nodes) => {
    if (!nodes.length) return null;

    return [...nodes].sort((a, b) => {
      const scoreA =
        a.displacement +
        a.tilt * 2 +
        a.vibration +
        a.crack * 2;

      const scoreB =
        b.displacement +
        b.tilt * 2 +
        b.vibration +
        b.crack * 2;

      return scoreB - scoreA;
    })[0];
  };

  /*
   * ---------------------------------------------------------
   * AVERAGE SENSOR READINGS
   * ---------------------------------------------------------
   */

  const averageReadings = useMemo(() => {
    if (!activeNodes.length) {
      return {
        tilt: 0,
        displacement: 0,
        vibration: 0,
        crack: 0
      };
    }

    const total = activeNodes.length;

    return {
      tilt: (
        activeNodes.reduce((sum, node) => sum + node.tilt, 0) /
        total
      ).toFixed(2),

      displacement: (
        activeNodes.reduce(
          (sum, node) => sum + node.displacement,
          0
        ) / total
      ).toFixed(2),

      vibration: (
        activeNodes.reduce(
          (sum, node) => sum + node.vibration,
          0
        ) / total
      ).toFixed(2),

      crack: (
        activeNodes.reduce(
          (sum, node) => sum + node.crack,
          0
        ) / total
      ).toFixed(2)
    };
  }, [activeNodes]);

  /*
   * ---------------------------------------------------------
   * MOST DEFORMED NODE FOR CURRENT STATUS
   * ---------------------------------------------------------
   */

  const mostDeformedNode = useMemo(
    () => getMostDeformedNode(activeNodes),
    [activeNodes]
  );

  /*
   * ---------------------------------------------------------
   * AUTOMATIC TELEMETRY CAROUSEL
   *
   * 5 seconds average
   * 5 seconds most deformed node
   * repeat
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTelemetryMode((current) =>
        current === "AVERAGE"
          ? "MOST_DEFORMED"
          : "AVERAGE"
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  /*
   * ---------------------------------------------------------
   * LIVE ACTIVITY / PAUSE
   * ---------------------------------------------------------
   */

  const formatTime = (date) =>
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

  const togglePause = () => {
    setLastUpdated(new Date());
    setIsPaused((current) => !current);
  };

  /*
   * ---------------------------------------------------------
   * SIMULATION BUTTON
   * ---------------------------------------------------------
   */

  const handleSimulation = (status) => {

  setSimulationStatus(status);
  setTelemetryMode("AVERAGE");
  setSelectedNode(null);

  if (status !== "CRITICAL") {
    setIsAcknowledged(false);
  }
};

  /*
   * ---------------------------------------------------------
   * CURRENT TELEMETRY NODE
   * ---------------------------------------------------------
   */

  const displayNode =
    selectedNode || mostDeformedNode;

  /*
   * ---------------------------------------------------------
   * OVERALL AI RISK
   * ---------------------------------------------------------
   */

  const overallRisk = activeNodes.length
  ? Math.round(
      activeNodes.reduce(
        (sum, node) => sum + node.riskScore,
        0
      ) / activeNodes.length
    )
  : 0;

  /*
   * ---------------------------------------------------------
   * CURRENT PANEL STATUS
   * ---------------------------------------------------------
   */

  const panelStatus =
    simulationStatus === "CRITICAL"
      ? "CRITICAL"
      : simulationStatus === "WARNING"
      ? "WARNING"
      : "NORMAL";

  return (
    <div className="dashboard">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="dashboard-header">

        <div className="brand-block">
  <div className="brand-icon">
    <Radio size={19} strokeWidth={2.2} />
  </div>

  <div>
    <div className="eyebrow">MINE SAFETY INTELLIGENCE · SS-01</div>
    <h1>SURAKSHA SETU</h1>
  </div>
</div>

        <div className="mine-info">

          <strong>Jharia Colliery</strong>

          <span className="mine-divider"></span>

          <span>
            Surface Panel 4 / सतह पैनल 4
          </span>

        </div>

        <div className="header-actions">

          <div className="node-count">
            <span className="live-dot"></span>
            {onlineNodes}/{totalNodes} nodes
          </div>

          <button
  className={`sound-button ${
    alarmEnabled ? "sound-on" : "sound-off"
  }`}
  onClick={() => {
    setAlarmEnabled((current) => !current);
    setIsAcknowledged(false);
  }}
  title={
    alarmEnabled
      ? "Mute warning alarm"
      : "Enable warning alarm"
  }
>
  {alarmEnabled ? (
    <Volume2 size={15} strokeWidth={2} />
  ) : (
    <VolumeX size={15} strokeWidth={2} />
  )}
</button>

        </div>

      </header>


      {/* =====================================================
          WARNING / STATUS BAR
      ===================================================== */}

      <section className={`status-banner status-${simulationStatus.toLowerCase()}`}>

        <div className="status-main">

          <div className="eyebrow">
            CURRENT PANEL STATUS / वर्तमान स्थिति
          </div>

          <div className="status-title">

  {simulationStatus === "NORMAL" && (
    <ShieldCheck size={22} strokeWidth={2} />
  )}

  {simulationStatus === "WARNING" && (
    <Siren size={22} strokeWidth={2} />
  )}

  {simulationStatus === "CRITICAL" && (
    <Siren size={22} strokeWidth={2} />
  )}

  <strong>
    {simulationStatus === "NORMAL"
      ? "SAFE / NORMAL"
      : simulationStatus === "WARNING"
      ? "WARNING"
      : "DANGER / CRITICAL"}
  </strong>

  <span className="status-hindi">
    {simulationStatus === "NORMAL"
      ? "सुरक्षित"
      : simulationStatus === "WARNING"
      ? "चेतावनी"
      : "खतरा"}
  </span>

</div>

          <p>
            {panelStatus === "CRITICAL"
              ? "Significant deformation detected across monitored surface zones"
              : panelStatus === "WARNING"
              ? "Ground deformation detected across monitored surface zones"
              : "Ground conditions remain within monitored baseline"}
          </p>

        </div>


        <div className="status-actions">

          <div className="risk-summary">

            <div className="eyebrow">
              AI RISK SIGNAL
            </div>

            <div className="risk-number">
              {overallRisk}
              <span>/100</span>
            </div>

          </div>


          <div className="active-alert">

            <Bell
              size={16}
              strokeWidth={2}
            />

            <span>1 active alert</span>

          </div>


          <button
  className={`acknowledge-button ${
    isAcknowledged ? "acknowledged-button" : ""
  }`}
  onClick={() => {
    setIsAcknowledged(true);
    setAlarmEnabled(false);
  }}
>
  {isAcknowledged
    ? "✓ Acknowledged"
    : "Acknowledge"}
</button>

        </div>

      </section>


      {/* =====================================================
          LIVE FEED / SIMULATION
      ===================================================== */}

      <section className="control-row">

        <div className={`live-feed ${isPaused ? "feed-paused" : "feed-live"}`}>

          <span className={`live-dot ${isPaused ? "dot-paused" : "dot-live"}`}></span>

          {isPaused ? "MESH FEED PAUSED" : "LIVE MESH FEED"}

          {isPaused && (
            <span className="last-update">
              Last updated {formatTime(lastUpdated)}
            </span>
          )}

        </div>


        <div className="simulation-controls">

          <span>SIMULATE STATUS</span>

          <button
            className={
              simulationStatus === "NORMAL"
                ? "active-normal"
                : ""
            }
            onClick={() => handleSimulation("NORMAL")}
          >
            NORMAL
          </button>

          <button
            className={
              simulationStatus === "WARNING"
                ? "active-warning"
                : ""
            }
            onClick={() => handleSimulation("WARNING")}
          >
            WARNING
          </button>

          <button
            className={
              simulationStatus === "CRITICAL"
                ? "active-critical"
                : ""
            }
            onClick={() => handleSimulation("CRITICAL")}
          >
            CRITICAL
          </button>

          <button
            className={`pause-button ${isPaused ? "resume-button" : ""}`}
            onClick={togglePause}
            aria-label={
              isPaused
                ? "Resume live dashboard activity"
                : "Pause live dashboard activity"
            }
          >
            {isPaused ? "▶ RESUME" : "Ⅱ PAUSE"}
          </button>

        </div>

      </section>


      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <main className="dashboard-content">


        {/* ===================================================
            GIS MAP
        =================================================== */}

        <section className="map-section">

          <div className="map-heading">

            <div>
              <span className="eyebrow">
                SURFACE MESH / सतह मेष
              </span>

              <h2>Live deformation map</h2>
            </div>


            {/* MAP LEGEND */}

            <div className="map-legend">

              <span>
                <i className="legend-dot safe"></i>
                safe zone
              </span>

              <span>
                <i className="legend-dot warning"></i>
                warning zone
              </span>

              <span>
                <i className="legend-dot danger"></i>
                danger zone
              </span>

            </div>

          </div>


          <MineMap
            nodes={mockNodes}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
          />

        </section>


        {/* ===================================================
            TELEMETRY
        =================================================== */}

        <section className="node-panel">

          <div className="panel-heading">

            <div>

              <span className="eyebrow">
                TELEMETRY / SENSOR DATA
              </span>

              <h2>Live Sensor Readings</h2>

            </div>

            <span className={`live-badge ${isPaused ? "live-badge-paused" : ""}`}>
              • {isPaused ? "PAUSED" : "LIVE"}
            </span>

          </div>


          {/* -----------------------------------------------
              AVERAGE MODE
          ------------------------------------------------ */}

          {telemetryMode === "AVERAGE" && !selectedNode && (

            <div className="telemetry-view">

              <div className="telemetry-view-header">

                <div>

                  <span className="telemetry-label">
                    PANEL AVERAGE
                  </span>

                  <h3>
                    {simulationStatus} zone
                  </h3>

                </div>

                <div className="telemetry-count">
                  {activeNodes.length} nodes
                </div>

              </div>


              <div className="sensor-grid">

                <div className="sensor-card">

                  <Gauge size={18} />

                  <span>GROUND TILT</span>

                  <strong>
                    {averageReadings.tilt}°
                  </strong>

                  <small>
                    Average surface inclination
                  </small>

                </div>


                <div className="sensor-card">

                  <MapPin size={18} />

                  <span>DISPLACEMENT</span>

                  <strong>
                    {averageReadings.displacement} mm
                  </strong>

                  <small>
                    Average node displacement
                  </small>

                </div>


                <div className="sensor-card">

                  <Activity size={18} />

                  <span>MICRO VIBRATION</span>

                  <strong>
                    {averageReadings.vibration} mm/s
                  </strong>

                  <small>
                    Average ground vibration
                  </small>

                </div>


                <div className="sensor-card">

                  <Ruler size={18} />

                  <span>CRACK OPENING</span>

                  <strong>
                    {averageReadings.crack} mm
                  </strong>

                  <small>
                    Average surface crack width
                  </small>

                </div>

              </div>


              <div className="telemetry-slide-note">
                Showing average readings · next view in 5 sec
              </div>

            </div>

          )}


          {/* -----------------------------------------------
              MOST DEFORMED NODE MODE
          ------------------------------------------------ */}

          {(telemetryMode === "MOST_DEFORMED" || selectedNode) &&
            displayNode && (

              <div className="telemetry-view">

                <div className="selected-node-header">

                  <div>

                    <span className="telemetry-label">
                      MOST DEFORMED NODE
                    </span>

                    <h3>
                      {displayNode.id}
                    </h3>

                  </div>

                  <span
                    className={`risk-badge ${displayNode.riskLevel.toLowerCase()}`}
                  >
                    {displayNode.riskLevel}
                  </span>

                </div>


                <div className="sensor-grid">

                  <div className="sensor-card">

                    <Gauge size={18} />

                    <span>GROUND TILT</span>

                    <strong>
                      {displayNode.tilt}°
                    </strong>

                    <small>
                      Surface inclination
                    </small>

                  </div>


                  <div className="sensor-card">

                    <MapPin size={18} />

                    <span>DISPLACEMENT</span>

                    <strong>
                      {displayNode.displacement} mm
                    </strong>

                    <small>
                      Node displacement
                    </small>

                  </div>


                  <div className="sensor-card">

                    <Activity size={18} />

                    <span>MICRO VIBRATION</span>

                    <strong>
                      {displayNode.vibration} mm/s
                    </strong>

                    <small>
                      Ground vibration
                    </small>

                  </div>


                  <div className="sensor-card">

                    <Ruler size={18} />

                    <span>CRACK OPENING</span>

                    <strong>
                      {displayNode.crack} mm
                    </strong>

                    <small>
                      Surface crack width
                    </small>

                  </div>

                </div>


                <div className="node-health">

                  <div>
                    <BatteryMedium size={15} />
                    <span>BATTERY</span>
                    <strong>
                      {displayNode.battery}%
                    </strong>
                  </div>

                  <div>
                    <Signal size={15} />
                    <span>SIGNAL</span>
                    <strong>
                      {displayNode.signal}%
                    </strong>
                  </div>

                  <div>
                    <Radio size={15} />
                    <span>STATUS</span>
                    <strong>
                      {displayNode.status}
                    </strong>
                  </div>

                </div>


                <div className="ai-risk-card">

                  <div>

                    <span className="eyebrow">
                      AI RISK ASSESSMENT
                    </span>

                    <div className="risk-score">
                      {displayNode.riskScore}
                      <small>/100</small>
                    </div>

                    <strong>
                      {displayNode.riskLevel}
                    </strong>

                  </div>


                  <div className="anomaly-score">

                    <span>
                      ANOMALY SCORE
                    </span>

                    <strong>
                      {displayNode.anomalyScore}
                    </strong>

                  </div>

                </div>


                {selectedNode && (
                  <div className="telemetry-slide-note">
                    Manually selected from map
                  </div>
                )}

                {!selectedNode && (
                  <div className="telemetry-slide-note">
                    Most deformed node · next view in 5 sec
                  </div>
                )}

              </div>
            )}

        </section>

      </main>


      {/* =====================================================
          HISTORICAL SENSOR GRAPHS
      ===================================================== */}

      {displayNode &&
        historicalData[displayNode.id] && (

          <section className="charts-section">

            <div className="section-title">

              <span className="eyebrow">
                HISTORICAL ANALYSIS
              </span>

              <h2>
                {displayNode.id} Sensor Trends
              </h2>

            </div>


            <div className="charts-grid">

              <SensorChart
                data={historicalData[displayNode.id]}
                dataKey="displacement"
                title="Displacement Trend"
                unit="mm"
              />

              <SensorChart
                data={historicalData[displayNode.id]}
                dataKey="tilt"
                title="Ground Tilt Trend"
                unit="degrees"
              />

              <SensorChart
                data={historicalData[displayNode.id]}
                dataKey="vibration"
                title="Micro Vibration Trend"
                unit="mm/s"
              />

              <SensorChart
                data={historicalData[displayNode.id]}
                dataKey="crack"
                title="Crack Growth"
                unit="mm"
              />

            </div>

          </section>
        )}


      {/* =====================================================
          LOWER DASHBOARD
      ===================================================== */}

      <section className="lower-grid">


        {/* ===================================================
            PANEL HEALTH
        =================================================== */}

        <section className="lower-panel">

          <div className="lower-panel-heading">

            <div>

              <span className="eyebrow">
                ZONES / क्षेत्र
              </span>

              <h2>Panel health</h2>

            </div>

          </div>


          <div className="zone-list">

            <div className="zone-row safe-zone">

              <div>

                <strong>
                  Panel 4A / North
                </strong>

                <small>
                  पैनल 4A / उत्तर · 4 nodes
                </small>

              </div>

              <div className="zone-risk">

                <strong>22</strong>

                <span>
                  <i></i>
                  SAFE / NORMAL
                </span>

              </div>

            </div>


            <div className="zone-row warning-zone">

              <div>

                <strong>
                  Panel 4B / East
                </strong>

                <small>
                  पैनल 4B / पूर्व · 4 nodes
                </small>

              </div>

              <div className="zone-risk">

                <strong>54</strong>

                <span>
                  <i></i>
                  WARNING
                </span>

              </div>

            </div>


            <div className="zone-row danger-zone">

              <div>

                <strong>
                  Panel 4C / South
                </strong>

                <small>
                  पैनल 4C / दक्षिण · 4 nodes
                </small>

              </div>

              <div className="zone-risk">

                <strong>76</strong>

                <span>
                  <i></i>
                  DANGER / CRITICAL
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            SENSOR NODE TABLE
        =================================================== */}

        <section className="lower-panel">

          <div className="lower-panel-heading">

            <div>

              <span className="eyebrow">
                MESH HEALTH / मेष स्थिति
              </span>

              <h2>Sensor nodes</h2>

            </div>

            <span className="mesh-health">
              {Math.round(
                mockNodes.reduce(
                  (sum, node) => sum + node.signal,
                  0
                ) / mockNodes.length
              )}%
            </span>

          </div>


          <div className="node-table">

            <div className="node-table-header">
              <span>NODE</span>
              <span>GROUND</span>
              <span>BATTERY</span>
              <span>SIGNAL</span>
            </div>


            {mockNodes.map((node) => (

              <button
                key={node.id}
                className="node-table-row"
                onClick={() => setSelectedNode(node)}
              >

                <span>
                  <i
                    className={
                      node.riskLevel === "CRITICAL"
                        ? "node-dot critical"
                        : node.riskLevel === "HIGH"
                        ? "node-dot warning"
                        : "node-dot normal"
                    }
                  ></i>

                  {node.id}
                </span>

                <span>
                  {node.displacement} mm
                </span>

                <span>
                  {node.battery}%
                </span>

                <span>
                  {node.signal}%
                </span>

              </button>

            ))}

          </div>

        </section>

      </section>


      {/* =====================================================
          OPERATOR LOG
      ===================================================== */}

      <section className="operator-log">

        <div className="lower-panel-heading">

          <div>

            <span className="eyebrow">
              INCIDENT HISTORY / घटना इतिहास
            </span>

            <h2>Operator log</h2>

          </div>

          <span className="event-count">
            2 events
          </span>

        </div>


        <div className="incident">

          <div className="incident-icon">
            <Bell size={16} />
          </div>

          <div className="incident-content">

            <div className="incident-title">

              <strong>INC-2408</strong>

              <span>Panel 4B / East</span>

              <small className="incident-warning">
                WARNING · चेतावनी
              </small>

            </div>

            <strong>
              Tilt rising above safe limit
            </strong>

            <p>
              12:36 PM · Check affected nodes and restrict heavy vehicle movement.
            </p>

          </div>

          <button className="incident-button">
            Acknowledge
          </button>

        </div>


        <div className="incident muted-incident">

          <div className="incident-icon">
            <Bell size={16} />
          </div>

          <div className="incident-content">

            <div className="incident-title">

              <strong>INC-2407</strong>

              <span>Panel 4A / North</span>

              <small className="incident-critical">
                DANGER · CRITICAL
              </small>

            </div>

            <strong>
              Micro vibration spike
            </strong>

            <p>
              11:30 AM · Evacuation drill completed. Ground team notified.
            </p>

          </div>

          <span className="acknowledged">
            ✓ ACK
          </span>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="dashboard-footer">

        <span>
          ↻ Updates every 3 sec ·
          Wireless Surface Mesh ·
          Demo mode
        </span>

        <span>
          For operator guidance only · Verify on ground before action
        </span>

      </footer>

    </div>
  );
}

export default Dashboard;