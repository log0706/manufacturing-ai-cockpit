import { useState } from "react";
import { localizedConceptById } from "../i18n/content";
import { officialNames } from "../lib/officialNames";
import { CautionBox, DomainBadge } from "../components/ui";
import { useLocale } from "../contexts/localeContext";

const coreLayers = [
  ["erp"],
  ["mes", "mom", "plm", "qms"],
  ["cmms", "eam"],
  ["scada", "plc", "dcs", "ot"],
  ["manufacturing", "production-engineering", "maintenance"],
];

const satelliteIds = ["aps", "scm", "wms", "iiot", "digital-twin", "digital-thread"];

export const MapRoomPage = () => {
  const { locale, t } = useLocale();
  const [selectedId, setSelectedId] = useState("mes");
  const conceptById = localizedConceptById[locale];
  const selected = conceptById[selectedId];

  return (
    <section className="page mapPage">
      <div className="pageHeader">
        <span className="eyebrow">{t.map.eyebrow}</span>
        <h1>{t.map.title}</h1>
        <p>{t.map.lead}</p>
      </div>

      <div className="mapLayout">
        <div className="systemMap" aria-label={t.a11y.systemMap}>
          <div className="mapColumn">
            {coreLayers.map((layer, index) => (
              <div className="mapLayer" key={layer.join("-")}>
                <div className="layerCards">
                  {layer.map((id) => (
                    <button
                      className={`mapNode ${selectedId === id ? "isActive" : ""}`}
                      key={id}
                      onClick={() => setSelectedId(id)}
                      aria-pressed={selectedId === id}
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
                aria-pressed={selectedId === id}
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
              <span>{t.map.nearbyWork}</span>
              <p>{selected.departments.join(" / ")}</p>
            </div>
            <div>
              <span>{t.map.aiTouchpoint}</span>
              <p>{selected.aiTouchpoint}</p>
            </div>
            <div>
              <span>{t.map.kpis}</span>
              <p>{selected.kpis.join(" / ")}</p>
            </div>
          </div>
          <CautionBox>{selected.caution}</CautionBox>
        </aside>
      </div>
    </section>
  );
};
