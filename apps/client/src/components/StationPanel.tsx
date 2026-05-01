import { getStationBuildCost, MAPS, type CardColor, type GameState, type Player } from "@ttr/shared";
import { useEffect, useMemo, useState } from "react";
import { buildClaimOptions, type ClaimOpt } from "../entities/game/claimOptions";
import { CARD_CFG } from "../lib/colors";
import { cityLabel, t, type Lang } from "../lib/i18n";
import { LocomotiveStatIcon, StationStatIcon } from "./StatIcons";

type Props = {
  game: GameState;
  me: Player | undefined;
  lang: Lang;
  selectedCity?: string;
  onSelectCity?: (city: string) => void;
  onBuildStation: (city: string, color: CardColor, useLocomotives?: number) => void;
};

const MiniCard = ({ color }: { color: CardColor }) => {
  const cfg = CARD_CFG[color];
  return (
    <span
      className="w-4 h-6 rounded-md flex items-center justify-center text-[10px] border shrink-0"
      style={{
        background: cfg.gradient ?? cfg.bg,
        borderColor: cfg.border,
        color: cfg.text,
      }}
    >
      {color === "locomotive" ? <LocomotiveStatIcon className="w-4 h-4" /> : cfg.icon}
    </span>
  );
};

const StationOptionBtn = ({
  opt,
  selected,
  onClick,
}: {
  opt: ClaimOpt;
  selected: boolean;
  onClick: () => void;
}) => {
  const baseCards = Array<CardColor>(opt.colorCount).fill(opt.baseColor);
  const locoCards = Array<CardColor>(opt.locoCount).fill("locomotive");
  const cards = [...baseCards, ...locoCards];
  const previewCards = cards.slice(0, 4);
  const overflowCount = Math.max(0, cards.length - previewCards.length);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative my-0.5 flex items-center gap-1.5 rounded-xl border-2 px-2 py-1.5 w-full transition-all text-left",
        selected
          ? "border-emerald-300 bg-emerald-700/35 ring-2 ring-emerald-300/35 shadow-[inset_0_0_0_1px_rgba(16,185,129,.45)]"
          : "border-slate-700 bg-slate-800/70 hover:bg-slate-700/70 hover:border-slate-500",
      ].join(" ")}
    >
      <div className="flex gap-1 shrink-0">
        {previewCards.map((color, idx) => (
          <MiniCard key={`${color}-${idx}`} color={color} />
        ))}
        {overflowCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-5 h-6 px-1 rounded-md border border-slate-600 bg-slate-900 text-[10px] font-black text-slate-200">
            +{overflowCount}
          </span>
        )}
      </div>
      <div className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-200">
        {opt.colorCount > 0 && (
          <span className="meta-chip">
            <span className="meta-value">{opt.colorCount}</span>
            <span className="text-[11px] leading-none" aria-hidden="true">{CARD_CFG[opt.baseColor].icon}</span>
          </span>
        )}
        {opt.colorCount > 0 && <span className="meta-sep">·</span>}
        <span className="meta-chip">
          <span className="meta-value">{opt.locoCount}</span>
          <LocomotiveStatIcon />
        </span>
      </div>
    </button>
  );
};

export const StationPanel = ({ game, me, lang, selectedCity, onSelectCity, onBuildStation }: Props) => {
  const [selectedStationOpt, setSelectedStationOpt] = useState<ClaimOpt | null>(null);

  const isEurope = game.mapId === "europe";
  const hand = me?.hand ?? [];
  const stationsLeft = me?.stationsLeft ?? 0;
  const stationCost = getStationBuildCost(stationsLeft);
  const drawInProgress = game.turnActionState.action === "draw_cards";

  const takenStationCities = useMemo(
    () => new Set(game.stations.map((station) => station.city)),
    [game.stations],
  );

  const availableStationCities = useMemo(
    () => (MAPS[game.mapId]?.cities ?? []).filter((city) => !takenStationCities.has(city)),
    [game.mapId, takenStationCities],
  );

  const stationClaimOpts = useMemo(() => {
    if (!isEurope || stationsLeft <= 0) return [];
    return buildClaimOptions(hand, {
      color: "gray",
      length: stationCost,
      routeType: "normal",
    });
  }, [hand, isEurope, stationCost, stationsLeft]);

  const selectedStationCity = useMemo(() => {
    if (selectedCity && availableStationCities.includes(selectedCity)) return selectedCity;
    return availableStationCities[0] ?? "";
  }, [availableStationCities, selectedCity]);

  useEffect(() => {
    if (!selectedStationCity) return;
    if (selectedCity === selectedStationCity) return;
    onSelectCity?.(selectedStationCity);
  }, [onSelectCity, selectedCity, selectedStationCity]);

  useEffect(() => {
    if (!selectedStationOpt || !stationClaimOpts.some((opt) => opt.baseColor === selectedStationOpt.baseColor && opt.locoCount === selectedStationOpt.locoCount)) {
      setSelectedStationOpt(stationClaimOpts[0] ?? null);
    }
  }, [selectedStationOpt, stationClaimOpts]);

  if (!isEurope || !me || me.isSpectator) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-slate-400">
        <span className="inline-flex items-center gap-1.5"><StationStatIcon />{t(lang, "ui.buildStation")}</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3 min-h-0">
      <div className="text-xs text-indigo-100 font-semibold">
        {t(lang, "ui.stationCostCards", { count: stationCost })}
      </div>

      {stationsLeft <= 0 ? (
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-400">
          {t(lang, "ui.noStationsLeft")}
        </div>
      ) : (
        <>
          <select
            value={selectedStationCity}
            onChange={(e) => {
              onSelectCity?.(e.target.value);
            }}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-sm"
          >
            {availableStationCities.map((city) => (
              <option key={city} value={city}>{cityLabel(lang, city)}</option>
            ))}
          </select>

          <div className="station-panel-options">
            {stationClaimOpts.length === 0 ? (
              <div className="rounded-xl border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                {t(lang, "ui.insufficientCards")}
              </div>
            ) : (
              stationClaimOpts.map((opt) => (
                <StationOptionBtn
                  key={`station-${opt.baseColor}-${opt.locoCount}`}
                  opt={opt}
                  selected={selectedStationOpt?.baseColor === opt.baseColor && selectedStationOpt?.locoCount === opt.locoCount}
                  onClick={() => setSelectedStationOpt(opt)}
                />
              ))
            )}
          </div>


          <button
            type="button"
            className="w-full rounded-xl py-2.5 font-bold text-sm border-2 border-indigo-400 bg-indigo-500/20 text-indigo-100 disabled:opacity-40"
            disabled={!selectedStationCity || !selectedStationOpt || stationClaimOpts.length === 0 || drawInProgress}
            onClick={() => {
              if (!selectedStationCity || !selectedStationOpt) return;
              onBuildStation(selectedStationCity, selectedStationOpt.baseColor, selectedStationOpt.locoCount);
            }}
          >
            {t(lang, "ui.buildStation")}
          </button>
        </>
      )}
    </div>
  );
};

