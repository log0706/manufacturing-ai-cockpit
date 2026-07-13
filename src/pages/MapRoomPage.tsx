import { useState } from "react";
import { conceptById } from "../data/concepts";
import { officialNames } from "../lib/officialNames";
import { CautionBox, DomainBadge } from "../components/ui";

const coreLayers = [
  ["erp"],
  ["mes", "mom", "plm", "qms"],
  ["cmms", "eam"],
  ["scada", "plc", "dcs", "ot"],
  ["manufacturing", "production-engineering", "maintenance"],
];

const satelliteIds = ["aps", "scm", "wms", "iiot", "digital-twin", "digital-thread"];

export const MapRoomPage = () => {
  const [selectedId, setSelectedId] = useState("mes");
  const selected = conceptById[selectedId];

  return (
    <section className="page mapPage">
      <div className="pageHeader">
        <span className="eyebrow">Map Room</span>
        <h1>AIは置き換えるのではなく、分断をつなぐ。</h1>
        <p>ERP、MES/MOM、PLM、QMS、SCADA/PLC/OTの関係を一枚で確認します。</p>
      </div>

      <div className="mapLayout">
        <div className="systemMap" aria-label="Manufacturing system map">
          <div className="mapColumn">
            {coreLayers.map((layer, index) => (
              <div className="mapLayer" key={layer.join("-")}>
                <div className="layerCards">
                  {layer.map((id) => (
                    <button
                      className={`mapNode ${selectedId === id ? "isActive" : ""}`}
                      key={id}
                      onClick={() => setSelectedId(id)}
                      type="button"
                    >
                      {conceptById[id].title}
                    </button>
                  ))}
                </div>
                {index < coreLayers.length - 1 ? <span className="mapArrow">↓</span> : null}
              </div>
            ))}
          </div>
          <div className="satelliteZone">
            {satelliteIds.map((id) => (
              <button
                className={`satelliteNode ${selectedId === id ? "isActive" : ""}`}
                key={id}
                onClick={() => setSelectedId(id)}
                type="button"
              >
                {conceptById[id].title}
              </button>
            ))}
          </div>
        </div>

        <aside className="mapDetail">
          <DomainBadge domain={selected.domain} />
          <h2>{selected.title}</h2>
          {officialNames[selected.id] ? (
            <p className="detailOfficialName">{officialNames[selected.id]}</p>
          ) : null}
          <p className="leadText">{selected.oneLine}</p>
          <div className="detailList">
            <div>
              <span>近い業務</span>
              <p>{selected.departments.join(" / ")}</p>
            </div>
            <div>
              <span>AIとの接点</span>
              <p>{selected.aiTouchpoint}</p>
            </div>
            <div>
              <span>見るべきKPI</span>
              <p>{selected.kpis.join(" / ")}</p>
            </div>
          </div>
          <CautionBox>{selected.caution}</CautionBox>
        </aside>
      </div>
    </section>
  );
};
