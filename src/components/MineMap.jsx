import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

function MineMap({
  nodes,
  selectedNode,
  onNodeSelect
}) {

  const center = [23.7624, 86.4068];

  const getColor = (displacement) => {

  if (displacement >= 15) {
    return "#ef4444"; // CRITICAL
  }

  if (displacement >= 10) {
    return "#f59e0b"; // WARNING
  }

  return "#16a34a"; // SAFE
};


  return (

    <div className="mine-map-wrapper">

      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        attributionControl={false}
        style={{
        height: "100%",
        width: "100%"
      }}
    >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        {nodes.map((node) => {

          const color = getColor(
            node.displacement
          );

          const isSelected =
            selectedNode?.id === node.id;


          return (

            <CircleMarker
              key={node.id}

              center={[
                node.latitude,
                node.longitude
              ]}

              radius={
                isSelected ? 13 : 9
              }

              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.9,
                weight: isSelected ? 4 : 2
              }}

              eventHandlers={{
                click: () =>
                  onNodeSelect(node)
              }}

            >

              <Popup>

                <strong>
                  {node.id}
                </strong>

                <br />

                Risk:
                {" "}
                {node.riskScore}/100

                <br />

                Status:
                {" "}
                {node.riskLevel}

                <br />

                Displacement:
                {" "}
                {node.displacement} mm

              </Popup>

            </CircleMarker>

          );

        })}

      </MapContainer>

    </div>
  );
}

export default MineMap;